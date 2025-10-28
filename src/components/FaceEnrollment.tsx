import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { extractFaceFeatures, averageFaceFeatures, type FaceFeatures } from "@/utils/faceBiometrics";
import { useToast } from "@/hooks/use-toast";

const REQUIRED_SAMPLES = 3;

interface FaceEnrollmentProps {
  onComplete: (profileId: string, userName: string) => void;
}

export function FaceEnrollment({ onComplete }: FaceEnrollmentProps) {
  const [step, setStep] = useState<"name" | "capture">("name");
  const [userName, setUserName] = useState("");
  const [currentSample, setCurrentSample] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedFeatures, setCapturedFeatures] = useState<FaceFeatures[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const prompts = [
    "Look directly at the camera with a neutral expression",
    "Smile naturally at the camera",
    "Tilt your head slightly to the left",
  ];

  useEffect(() => {
    if (step === "capture" && !stream) {
      startCamera();
    }

    return () => {
      // Cleanup camera when component unmounts or step changes
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleNameSubmit = () => {
    if (userName.trim().length < 2) {
      toast({
        title: "Invalid Name",
        description: "Please enter a name with at least 2 characters.",
        variant: "destructive",
      });
      return;
    }
    setStep("capture");
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast({
          title: "Capture Error",
          description: "Failed to capture image.",
          variant: "destructive",
        });
        setIsCapturing(false);
        return;
      }

      // Extract face features
      const features = await extractFaceFeatures(blob);

      if (!features) {
        toast({
          title: "No Face Detected",
          description: "Please ensure your face is clearly visible and well-lit.",
          variant: "destructive",
        });
        setIsCapturing(false);
        return;
      }

      // Add features to captured samples
      const newFeatures = [...capturedFeatures, features];
      setCapturedFeatures(newFeatures);

      toast({
        title: "Sample Captured",
        description: `Sample ${currentSample + 1} of ${REQUIRED_SAMPLES} captured successfully.`,
      });

      // Move to next sample or process enrollment
      if (currentSample + 1 < REQUIRED_SAMPLES) {
        setCurrentSample(currentSample + 1);
        setIsCapturing(false);
      } else {
        await processEnrollment(newFeatures);
      }
    }, "image/jpeg");
  };

  const processEnrollment = async (allFeatures: FaceFeatures[]) => {
    setIsProcessing(true);

    try {
      // Average all face features
      const averagedFeatures = averageFaceFeatures(allFeatures);

      // Store in Supabase
      const { data, error } = await supabase
        .from("face_profiles")
        .insert({
          user_name: userName,
          face_features: averagedFeatures,
          enrollment_samples: REQUIRED_SAMPLES,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Enrollment Complete",
        description: `Face profile created successfully for ${userName}!`,
      });

      // Stop camera immediately
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      onComplete(data.id, userName);
    } catch (error) {
      console.error("Error saving face profile:", error);
      toast({
        title: "Enrollment Failed",
        description: "Failed to save face profile. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Face Enrollment
        </CardTitle>
        <CardDescription>
          {step === "name"
            ? "Enter your name to begin face enrollment"
            : `Capture ${REQUIRED_SAMPLES} face samples for biometric authentication`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "name" ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Your Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleNameSubmit()}
                className="mt-1"
              />
            </div>
            <Button onClick={handleNameSubmit} className="w-full">
              Continue to Face Capture
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress indicator */}
            <div className="flex justify-center gap-2 mb-4">
              {Array.from({ length: REQUIRED_SAMPLES }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < currentSample
                      ? "bg-green-500"
                      : i === currentSample
                      ? "bg-blue-500 animate-pulse"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Video preview */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isCapturing && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-20">
                  <CheckCircle2 className="w-16 h-16 text-green-500 animate-pulse" />
                </div>
              )}
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Instruction */}
            <div className="text-center text-sm text-muted-foreground bg-muted p-3 rounded">
              <strong>Sample {currentSample + 1}:</strong> {prompts[currentSample]}
            </div>

            {/* Capture button */}
            <Button
              onClick={capturePhoto}
              disabled={isCapturing || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Enrollment...
                </>
              ) : isCapturing ? (
                "Capturing..."
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Capture Sample {currentSample + 1}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
