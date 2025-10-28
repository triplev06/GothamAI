/**
 * Face Biometrics Utility
 * Extracts facial features from images for biometric authentication
 * Uses browser-native face detection API when available
 */

export interface FaceFeatures {
  // Facial landmark distances (normalized)
  eyeDistance: number;
  noseToMouthDistance: number;
  faceWidth: number;
  faceHeight: number;
  leftEyeToNose: number;
  rightEyeToNose: number;

  // Color/texture features (simplified)
  skinToneAverage: number;
  textureComplexity: number;

  // Histogram features
  brightnessDistribution: number[];
}

/**
 * Extract facial features from an image
 */
export async function extractFaceFeatures(imageBlob: Blob): Promise<FaceFeatures | null> {
  try {
    const imageBitmap = await createImageBitmap(imageBlob);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    ctx.drawImage(imageBitmap, 0, 0);

    // Try to use FaceDetector API if available
    if ('FaceDetector' in window) {
      const faceDetector = new (window as any).FaceDetector();
      const faces = await faceDetector.detect(imageBitmap);

      if (faces.length === 0) {
        throw new Error('No face detected in image');
      }

      const face = faces[0];
      const landmarks = face.landmarks;

      // Extract features from detected landmarks
      return extractFeaturesFromLandmarks(landmarks, ctx, imageBitmap.width, imageBitmap.height);
    } else {
      // Fallback to image analysis without face detection
      return extractFeaturesFromImage(ctx, imageBitmap.width, imageBitmap.height);
    }
  } catch (error) {
    console.error('Error extracting face features:', error);
    return null;
  }
}

/**
 * Extract features from detected facial landmarks
 */
function extractFeaturesFromLandmarks(
  landmarks: any[],
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): FaceFeatures {
  // Find key landmarks
  const leftEye = landmarks.find((l: any) => l.type === 'eye' && l.locations[0].x < width / 2);
  const rightEye = landmarks.find((l: any) => l.type === 'eye' && l.locations[0].x >= width / 2);
  const nose = landmarks.find((l: any) => l.type === 'nose');
  const mouth = landmarks.find((l: any) => l.type === 'mouth');

  // Calculate normalized distances
  const eyeDistance = leftEye && rightEye
    ? distance(leftEye.locations[0], rightEye.locations[0]) / width
    : 0.2;

  const noseToMouthDistance = nose && mouth
    ? distance(nose.locations[0], mouth.locations[0]) / height
    : 0.15;

  const leftEyeToNose = leftEye && nose
    ? distance(leftEye.locations[0], nose.locations[0]) / width
    : 0.12;

  const rightEyeToNose = rightEye && nose
    ? distance(rightEye.locations[0], nose.locations[0]) / width
    : 0.12;

  // Extract additional features from image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const { skinToneAverage, textureComplexity, brightnessDistribution } = analyzeImageData(imageData);

  return {
    eyeDistance,
    noseToMouthDistance,
    faceWidth: 1.0, // Normalized
    faceHeight: 1.0, // Normalized
    leftEyeToNose,
    rightEyeToNose,
    skinToneAverage,
    textureComplexity,
    brightnessDistribution,
  };
}

/**
 * Fallback feature extraction when face detection API is not available
 */
function extractFeaturesFromImage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): FaceFeatures {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { skinToneAverage, textureComplexity, brightnessDistribution } = analyzeImageData(imageData);

  // Use default normalized values for structural features
  return {
    eyeDistance: 0.2,
    noseToMouthDistance: 0.15,
    faceWidth: 1.0,
    faceHeight: 1.0,
    leftEyeToNose: 0.12,
    rightEyeToNose: 0.12,
    skinToneAverage,
    textureComplexity,
    brightnessDistribution,
  };
}

/**
 * Analyze image data for color and texture features
 */
function analyzeImageData(imageData: ImageData) {
  const data = imageData.data;
  let rSum = 0, gSum = 0, bSum = 0;
  let variance = 0;
  const brightnessHistogram = new Array(10).fill(0);

  // Calculate averages and histogram
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    rSum += r;
    gSum += g;
    bSum += b;

    const brightness = (r + g + b) / 3;
    const histogramIndex = Math.min(Math.floor(brightness / 25.6), 9);
    brightnessHistogram[histogramIndex]++;
  }

  const pixelCount = data.length / 4;
  const avgR = rSum / pixelCount;
  const avgG = gSum / pixelCount;
  const avgB = bSum / pixelCount;

  // Calculate skin tone (simplified)
  const skinToneAverage = (avgR * 0.5 + avgG * 0.3 + avgB * 0.2) / 255;

  // Calculate texture complexity (variance)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const diff = r - avgR;
    variance += diff * diff;
  }
  const textureComplexity = Math.sqrt(variance / pixelCount) / 255;

  // Normalize histogram
  const brightnessDistribution = brightnessHistogram.map(v => v / pixelCount);

  return { skinToneAverage, textureComplexity, brightnessDistribution };
}

/**
 * Calculate Euclidean distance between two points
 */
function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * Compare two face feature sets and return similarity score (0-1)
 */
export function compareFaceFeatures(features1: FaceFeatures, features2: FaceFeatures): number {
  // Weight factors for different features
  const weights = {
    structural: 0.4, // Eye distance, nose-mouth distance, etc.
    color: 0.3, // Skin tone
    texture: 0.1, // Texture complexity
    histogram: 0.2, // Brightness distribution
  };

  // Compare structural features
  const structuralDiff =
    Math.abs(features1.eyeDistance - features2.eyeDistance) +
    Math.abs(features1.noseToMouthDistance - features2.noseToMouthDistance) +
    Math.abs(features1.leftEyeToNose - features2.leftEyeToNose) +
    Math.abs(features1.rightEyeToNose - features2.rightEyeToNose);
  const structuralSimilarity = Math.max(0, 1 - structuralDiff);

  // Compare color features
  const colorSimilarity = 1 - Math.abs(features1.skinToneAverage - features2.skinToneAverage);

  // Compare texture
  const textureSimilarity = 1 - Math.abs(features1.textureComplexity - features2.textureComplexity);

  // Compare histograms
  let histogramDiff = 0;
  for (let i = 0; i < features1.brightnessDistribution.length; i++) {
    histogramDiff += Math.abs(
      features1.brightnessDistribution[i] - features2.brightnessDistribution[i]
    );
  }
  const histogramSimilarity = Math.max(0, 1 - histogramDiff / 2);

  // Calculate weighted similarity
  const totalSimilarity =
    structuralSimilarity * weights.structural +
    colorSimilarity * weights.color +
    textureSimilarity * weights.texture +
    histogramSimilarity * weights.histogram;

  return totalSimilarity;
}

/**
 * Average multiple face feature sets (for enrollment)
 */
export function averageFaceFeatures(featuresList: FaceFeatures[]): FaceFeatures {
  const count = featuresList.length;

  const averaged: FaceFeatures = {
    eyeDistance: 0,
    noseToMouthDistance: 0,
    faceWidth: 0,
    faceHeight: 0,
    leftEyeToNose: 0,
    rightEyeToNose: 0,
    skinToneAverage: 0,
    textureComplexity: 0,
    brightnessDistribution: new Array(10).fill(0),
  };

  // Sum all features
  for (const features of featuresList) {
    averaged.eyeDistance += features.eyeDistance;
    averaged.noseToMouthDistance += features.noseToMouthDistance;
    averaged.faceWidth += features.faceWidth;
    averaged.faceHeight += features.faceHeight;
    averaged.leftEyeToNose += features.leftEyeToNose;
    averaged.rightEyeToNose += features.rightEyeToNose;
    averaged.skinToneAverage += features.skinToneAverage;
    averaged.textureComplexity += features.textureComplexity;

    for (let i = 0; i < 10; i++) {
      averaged.brightnessDistribution[i] += features.brightnessDistribution[i];
    }
  }

  // Divide by count to get averages
  averaged.eyeDistance /= count;
  averaged.noseToMouthDistance /= count;
  averaged.faceWidth /= count;
  averaged.faceHeight /= count;
  averaged.leftEyeToNose /= count;
  averaged.rightEyeToNose /= count;
  averaged.skinToneAverage /= count;
  averaged.textureComplexity /= count;

  for (let i = 0; i < 10; i++) {
    averaged.brightnessDistribution[i] /= count;
  }

  return averaged;
}

/**
 * Similarity threshold for face matching (65% match required)
 */
export const FACE_SIMILARITY_THRESHOLD = 0.65;
