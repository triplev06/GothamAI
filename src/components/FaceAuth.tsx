import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { extractFaceFeatures, compareFaceFeatures, FACE_SIMILARITY_THRESHOLD } from "@/utils/faceBiometrics";
import { useToast } from "@/hooks/use-toast";

interface FaceAuthProps {
  onSuccess: (userName: string, profileId: string) => void;
  onCancel?: () => void;
}

export function FaceAuth({ onSuccess, onCancel }: FaceAuthProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authResult, setAuthResult] = useState<"success" | "failure" | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [identifiedUser, setIdentifiedUser] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    startCamera();

    return () => {
      // Cleanup camera when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const authenticateFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setAuthResult(null);

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

      setIsProcessing(true);

      // Extract face features
      const currentFeatures = await extractFaceFeatures(blob);

      if (!currentFeatures) {
        toast({
          title: "No Face Detected",
          description: "Please ensure your face is clearly visible and well-lit.",
          variant: "destructive",
        });
        setIsCapturing(false);
        setIsProcessing(false);
        setAuthResult("failure");
        return;
      }

      // Fetch all face profiles from database
      const { data: profiles, error } = await supabase
        .from("face_profiles")
        .select("*");

      if (error) {
        console.error("Error fetching face profiles:", error);
        toast({
          title: "Authentication Error",
          description: "Failed to fetch face profiles.",
          variant: "destructive",
        });
        setIsCapturing(false);
        setIsProcessing(false);
        setAuthResult("failure");
        return;
      }

      if (!profiles || profiles.length === 0) {
        toast({
          title: "No Profiles Found",
          description: "No face profiles registered. Please enroll first.",
          variant: "destructive",
        });
        setIsCapturing(false);
        setIsProcessing(false);
        setAuthResult("failure");
        return;
      }

      // Compare with all profiles
      let bestMatch = { name: "", score: 0, id: "" };

      for (const profile of profiles) {
        const similarity = compareFaceFeatures(currentFeatures, profile.face_features);

        if (similarity > bestMatch.score) {
          bestMatch = {
            name: profile.user_name,
            score: similarity,
            id: profile.id,
          };
        }
      }

      setIsCapturing(false);
      setIsProcessing(false);

      // Check if match meets threshold
      if (bestMatch.score >= FACE_SIMILARITY_THRESHOLD) {
        setAuthResult("success");
        setIdentifiedUser(bestMatch.name);

        toast({
          title: "Authentication Successful",
          description: `Welcome, ${bestMatch.name}! (${Math.round(bestMatch.score * 100)}% match)`,
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

        // Call success callback after a brief delay
        setTimeout(() => {
          onSuccess(bestMatch.name, bestMatch.id);
        }, 1500);
      } else {
        setAuthResult("failure");

        toast({
          title: "Authentication Failed",
          description: `Face not recognized. ${
            bestMatch.score > 0
              ? `Best match: ${Math.round(bestMatch.score * 100)}% (minimum ${Math.round(FACE_SIMILARITY_THRESHOLD * 100)}% required)`
              : "No matches found."
          }`,
          variant: "destructive",
        });

        // Reset after delay
        setTimeout(() => {
          setAuthResult(null);
        }, 2000);
      }
    }, "image/jpeg");
  };

  const handleCancel = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onCancel?.();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Face Authentication
        </CardTitle>
        <CardDescription>
          Position your face in the camera and click authenticate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Video preview */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Success/Failure overlay */}
            {authResult && (
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center ${
                  authResult === "success" ? "bg-green-500" : "bg-red-500"
                } bg-opacity-80`}
              >
                {authResult === "success" ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-white mb-2" />
                    <p className="text-white text-lg font-semibold">
                      Welcome, {identifiedUser}!
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-16 h-16 text-white mb-2" />
                    <p className="text-white text-lg font-semibold">
                      Authentication Failed
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && !authResult && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground bg-muted p-3 rounded">
            Look directly at the camera and ensure your face is well-lit
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={authenticateFace}
              disabled={isCapturing || isProcessing || authResult === "success"}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Authenticate
                </>
              )}
            </Button>

            {onCancel && (
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isProcessing}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
