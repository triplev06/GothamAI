import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { extractFaceFeatures, compareFaceFeatures, loadFaceModels, FACE_SIMILARITY_THRESHOLD, FaceFeatures } from "@/utils/faceBiometrics";
import { useToast } from "@/hooks/use-toast";

interface FaceAuthProps {
  onSuccess: (userName: string, profileId: string, userProfileId: string) => void;
  onCancel?: () => void;
}

interface FaceProfileWithUser {
  id: string;
  user_name: string;
  face_features: number[];
  user_profile_id: string;
  user_profiles: {
    user_name: string;
  };
}

export function FaceAuth({ onSuccess, onCancel }: FaceAuthProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authResult, setAuthResult] = useState<"success" | "failure" | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [identifiedUser, setIdentifiedUser] = useState<string>("");
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Preload face recognition models
  useEffect(() => {
    const loadModels = async () => {
      if (!modelsLoaded) {
        toast({
          title: "Loading Face Recognition",
          description: "Downloading AI models (first time only)...",
          duration: 5000,
        });

        try {
          await loadFaceModels();
          setModelsLoaded(true);
          toast({
            title: "Ready!",
            description: "Face recognition loaded successfully.",
          });
        } catch (error) {
          console.error("Error loading models:", error);
          toast({
            title: "Model Load Failed",
            description: "Failed to load face recognition. Please refresh.",
            variant: "destructive",
          });
        }
      }
    };

    loadModels();
  }, [modelsLoaded, toast]);

  useEffect(() => {
    if (modelsLoaded) {
      startCamera();
    }

    return () => {
      // Cleanup camera when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [modelsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

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

    console.log('[FaceAuth] Starting authentication');
    setIsCapturing(true);
    setAuthResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error('[FaceAuth] No canvas context');
      setIsCapturing(false);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    console.log('[FaceAuth] Canvas size:', canvas.width, 'x', canvas.height);

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob with timeout wrapper
    const timeoutId = setTimeout(() => {
      console.error('[FaceAuth] Authentication timeout after 20 seconds');
      toast({
        title: "Authentication Timeout",
        description: "Face detection took too long. Please try again.",
        variant: "destructive",
      });
      setIsCapturing(false);
      setIsProcessing(false);
      setAuthResult("failure");
      setTimeout(() => setAuthResult(null), 2000);
    }, 20000);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      try {
        if (!blob) {
          console.error('[FaceAuth] Failed to create blob from canvas');
          clearTimeout(timeoutId);
          toast({
            title: "Capture Error",
            description: "Failed to capture image.",
            variant: "destructive",
          });
          setIsCapturing(false);
          return;
        }

        console.log('[FaceAuth] Blob created, size:', blob.size, 'bytes');
        setIsProcessing(true);

        toast({
          title: "Analyzing Face...",
          description: "Please hold still (this may take 10-15 seconds)",
          duration: 3000,
        });

        // Extract face features
        console.log('[FaceAuth] Calling extractFaceFeatures');
        const currentFeatures = await extractFaceFeatures(blob);
        console.log('[FaceAuth] extractFaceFeatures completed:', currentFeatures ? 'Success' : 'Failed');

        clearTimeout(timeoutId);

        if (!currentFeatures) {
          toast({
            title: "No Face Detected",
            description: "Please ensure your face is clearly visible, well-lit, and facing the camera directly. Try moving closer.",
            variant: "destructive",
            duration: 5000,
          });
          setIsCapturing(false);
          setIsProcessing(false);
          setAuthResult("failure");
          setTimeout(() => setAuthResult(null), 2000);
          return;
        }

        // Fetch all face profiles with user profile info
        const { data: profiles, error } = await supabase
          .from("face_profiles")
          .select(`
            *,
            user_profiles!inner (
              user_name
            )
          `);

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
        let bestMatch = { name: "", score: 0, id: "", userProfileId: "" };

        for (const profile of profiles as unknown as FaceProfileWithUser[]) {
          // Skip profiles without proper user_profile linkage
          if (!profile.user_profile_id || !profile.user_profiles) {
            console.warn("Skipping face profile without user_profile linkage:", profile.id);
            continue;
          }

          // Convert stored JSONB array back to Float32Array
          const storedFeatures = new Float32Array(profile.face_features);

          // Skip profiles with incompatible feature length (old format)
          if (storedFeatures.length !== currentFeatures.length) {
            console.warn(`Skipping incompatible face profile (length ${storedFeatures.length} vs ${currentFeatures.length}):`, profile.id);
            continue;
          }

          const similarity = compareFaceFeatures(currentFeatures, storedFeatures);

          if (similarity > bestMatch.score) {
            bestMatch = {
              name: profile.user_profiles.user_name,
              score: similarity,
              id: profile.id,
              userProfileId: profile.user_profile_id,
            };
          }
        }

        setIsCapturing(false);
        setIsProcessing(false);

        // Check if we found any compatible profiles
        if (bestMatch.score === 0) {
          toast({
            title: "No Compatible Profiles",
            description: "All face profiles are in old format. Please clear old profiles and re-enroll with the new system.",
            variant: "destructive",
            duration: 7000,
          });
          setAuthResult("failure");
          setTimeout(() => setAuthResult(null), 2000);
          return;
        }

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
            onSuccess(bestMatch.name, bestMatch.id, bestMatch.userProfileId);
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
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('[FaceAuth] Error during authentication:', error);
        toast({
          title: "Authentication Error",
          description: "An error occurred during face recognition. Please try again.",
          variant: "destructive",
        });
        setIsCapturing(false);
        setIsProcessing(false);
        setAuthResult("failure");
        setTimeout(() => setAuthResult(null), 2000);
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
