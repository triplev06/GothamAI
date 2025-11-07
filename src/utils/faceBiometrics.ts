/**
 * Face Biometrics Utility using face-api.js
 * Provides professional-grade face recognition with 128-dimensional face descriptors
 */

import * as faceapi from 'face-api.js';

// Face descriptor is a 128-dimensional array of numbers (much more precise than old method)
export type FaceFeatures = Float32Array;

let modelsLoaded = false;
let modelsLoading = false;

/**
 * Load face-api.js models with timeout
 * Models are loaded from CDN on first use (~10MB download)
 */
export async function loadFaceModels(timeoutMs = 30000): Promise<void> {
  if (modelsLoaded) return;

  if (modelsLoading) {
    // Wait for existing load to complete
    const startWait = Date.now();
    while (modelsLoading) {
      if (Date.now() - startWait > timeoutMs) {
        throw new Error('Timeout waiting for models to load');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  modelsLoading = true;

  try {
    console.log('Loading face recognition models from CDN...');
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

    // Add timeout to model loading
    const loadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Model loading timeout after 30s. Please check your internet connection.')), timeoutMs)
    );

    await Promise.race([loadPromise, timeoutPromise]);

    modelsLoaded = true;
    console.log('Face recognition models loaded successfully');
  } catch (error) {
    modelsLoading = false; // Reset so it can be retried
    console.error('Error loading face recognition models:', error);
    throw new Error('Failed to load face recognition models. Please refresh and try again.');
  } finally {
    modelsLoading = false;
  }
}

/**
 * Extract face descriptor (128-dimensional embedding) from an image
 * This is MUCH more precise than the old brightness/skin tone approach
 */
export async function extractFaceFeatures(imageBlob: Blob, timeoutMs = 15000): Promise<FaceFeatures | null> {
  try {
    console.log('[FaceAPI] Starting face feature extraction');

    // Ensure models are loaded
    console.log('[FaceAPI] Checking if models are loaded');
    await loadFaceModels();
    console.log('[FaceAPI] Models confirmed loaded');

    // Convert blob to image element
    console.log('[FaceAPI] Converting blob to image');
    const img = await blobToImage(imageBlob);
    console.log('[FaceAPI] Image loaded, dimensions:', img.width, 'x', img.height);

    // Detect face and extract descriptor with timeout
    console.log('[FaceAPI] Starting face detection...');
    const detectionPromise = faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5
      }))
      .withFaceLandmarks()
      .withFaceDescriptor()
      .then(result => {
        console.log('[FaceAPI] Detection completed:', result ? 'Face found' : 'No face found');
        return result;
      })
      .catch(err => {
        console.error('[FaceAPI] Detection error:', err);
        return null;
      });

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => {
        console.warn('[FaceAPI] Face detection timeout after', timeoutMs, 'ms');
        resolve(null);
      }, timeoutMs)
    );

    const detection = await Promise.race([detectionPromise, timeoutPromise]);

    if (!detection) {
      console.log('[FaceAPI] No face detected in image');
      return null;
    }

    console.log('[FaceAPI] Successfully extracted face descriptor');
    // Return the 128-dimensional face descriptor
    return detection.descriptor;
  } catch (error) {
    console.error('[FaceAPI] Error extracting face features:', error);
    return null;
  }
}

/**
 * Compare two face descriptors using Euclidean distance
 * Returns similarity score (0-1, where 1 is identical)
 */
export function compareFaceFeatures(features1: FaceFeatures, features2: FaceFeatures): number {
  // Calculate Euclidean distance between the two descriptors
  const distance = faceapi.euclideanDistance(features1, features2);

  // Convert distance to similarity score (0-1)
  // Typical matching threshold is 0.6 distance, so we normalize around that
  // Lower distance = higher similarity
  const similarity = Math.max(0, 1 - (distance / 0.6));

  return similarity;
}

/**
 * Average multiple face descriptors (for enrollment with multiple samples)
 */
export function averageFaceFeatures(featuresList: FaceFeatures[]): FaceFeatures {
  if (featuresList.length === 0) {
    throw new Error('Cannot average empty features list');
  }

  const descriptorLength = featuresList[0].length;
  const averaged = new Float32Array(descriptorLength);

  // Sum all descriptors
  for (const features of featuresList) {
    for (let i = 0; i < descriptorLength; i++) {
      averaged[i] += features[i];
    }
  }

  // Divide by count to get average
  for (let i = 0; i < descriptorLength; i++) {
    averaged[i] /= featuresList.length;
  }

  return averaged;
}

/**
 * Similarity threshold for face matching
 * Using 0.6 which is industry standard for face-api.js
 * This is MUCH more accurate than the old 0.75 threshold on basic features
 */
export const FACE_SIMILARITY_THRESHOLD = 0.6;

/**
 * Helper: Convert blob to HTMLImageElement
 */
function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image from blob'));
    };

    img.src = url;
  });
}
