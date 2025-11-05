import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaceAuth } from "./FaceAuth";
import VoiceEnrollment from "./VoiceEnrollment";
import { FaceEnrollment } from "./FaceEnrollment";
import { Mic, Camera, UserPlus, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { extractVoiceFeatures, compareVoiceFeatures } from "@/utils/voiceBiometrics";

interface BiometricAuthProps {
  onAuthenticated: (userName: string) => void;
}

interface AuthStatus {
  voice: { authenticated: boolean; userName: string };
  face: { authenticated: boolean; userName: string };
}

export function BiometricAuth({ onAuthenticated }: BiometricAuthProps) {
  const [mode, setMode] = useState<"auth" | "enroll">("auth");
  const [activeTab, setActiveTab] = useState<"voice" | "face">("voice");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    voice: { authenticated: false, userName: "" },
    face: { authenticated: false, userName: "" },
  });

  const { toast } = useToast();

  // Check if both authentications are complete
  useEffect(() => {
    if (authStatus.voice.authenticated && authStatus.face.authenticated) {
      // Verify both authentications are for the same user
      if (authStatus.voice.userName === authStatus.face.userName) {
        toast({
          title: "Full Authentication Complete",
          description: `Welcome, ${authStatus.voice.userName}! Both biometrics verified.`,
        });
        onAuthenticated(authStatus.voice.userName);
      } else {
        toast({
          title: "Authentication Mismatch",
          description: `Voice identified as "${authStatus.voice.userName}" but face identified as "${authStatus.face.userName}". Please re-authenticate.`,
          variant: "destructive",
        });
        // Reset authentication
        setAuthStatus({
          voice: { authenticated: false, userName: "" },
          face: { authenticated: false, userName: "" },
        });
      }
    }
  }, [authStatus, onAuthenticated, toast]);

  const handleFaceAuthSuccess = (userName: string, profileId: string) => {
    setAuthStatus((prev) => ({
      ...prev,
      face: { authenticated: true, userName },
    }));

    toast({
      title: "Face Authentication Complete",
      description: authStatus.voice.authenticated
        ? "Checking identity match..."
        : "Now authenticate with your voice.",
    });

    // Auto-switch to voice tab if not yet authenticated
    if (!authStatus.voice.authenticated) {
      setTimeout(() => setActiveTab("voice"), 1500);
    }
  };

  const handleVoiceAuthSuccess = (userName: string) => {
    setAuthStatus((prev) => ({
      ...prev,
      voice: { authenticated: true, userName },
    }));

    toast({
      title: "Voice Authentication Complete",
      description: authStatus.face.authenticated
        ? "Checking identity match..."
        : "Now authenticate with your face.",
    });

    // Auto-switch to face tab if not yet authenticated
    if (!authStatus.face.authenticated) {
      setTimeout(() => setActiveTab("face"), 1500);
    }
  };

  const handleEnrollmentComplete = (profileId: string, userName: string) => {
    toast({
      title: "Enrollment Complete",
      description: `${activeTab === "voice" ? "Voice" : "Face"} profile created for ${userName}!`,
    });
    setMode("auth");
  };

  const authenticateWithVoice = async () => {
    setIsRecording(true);
    setIsProcessing(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);

        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

        // Extract voice features
        const currentFeatures = await extractVoiceFeatures(audioBlob);

        if (!currentFeatures) {
          toast({
            title: "Processing Error",
            description: "Failed to extract voice features. Please try again.",
            variant: "destructive",
          });
          setIsProcessing(false);
          // Clean up stream on error
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Fetch all voice profiles
        const { data: profiles, error } = await supabase
          .from("voice_profiles")
          .select("*");

        if (error || !profiles || profiles.length === 0) {
          toast({
            title: "No Profiles Found",
            description: "No voice profiles registered. Please enroll first.",
            variant: "destructive",
          });
          setIsProcessing(false);
          // Clean up stream on error
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Compare with all profiles
        let bestMatch = { name: "", score: 0 };

        for (const profile of profiles) {
          const similarity = compareVoiceFeatures(currentFeatures, profile.voice_features);

          if (similarity > bestMatch.score) {
            bestMatch = {
              name: profile.user_name,
              score: similarity,
            };
          }
        }

        setIsProcessing(false);

        // Check if match meets threshold (60%)
        if (bestMatch.score >= 0.6) {
          toast({
            title: "Authentication Successful",
            description: `Welcome, ${bestMatch.name}! (${Math.round(bestMatch.score * 100)}% match)`,
          });

          handleVoiceAuthSuccess(bestMatch.name);
        } else {
          toast({
            title: "Authentication Failed",
            description: `Voice not recognized. ${
              bestMatch.score > 0
                ? `Best match: ${Math.round(bestMatch.score * 100)}% (minimum 60% required)`
                : "No matches found."
            }`,
            variant: "destructive",
          });
        }

        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      // Record for 3 seconds
      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 3000);

      toast({
        title: "Recording",
        description: "Speak now... (3 seconds)",
      });
    } catch (error) {
      console.error("Error recording audio:", error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Voice/Face Sign In</CardTitle>
          <CardDescription>
            {mode === "auth"
              ? "Complete both voice AND face authentication to access the chatbot"
              : "Enroll a new biometric profile"}
          </CardDescription>

          {/* Authentication Progress Indicators */}
          {mode === "auth" && (
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                {authStatus.voice.authenticated ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
                <span className={`text-sm ${authStatus.voice.authenticated ? "text-green-500 font-semibold" : "text-muted-foreground"}`}>
                  Voice {authStatus.voice.authenticated && `(${authStatus.voice.userName})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {authStatus.face.authenticated ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
                <span className={`text-sm ${authStatus.face.authenticated ? "text-green-500 font-semibold" : "text-muted-foreground"}`}>
                  Face {authStatus.face.authenticated && `(${authStatus.face.userName})`}
                </span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {mode === "auth" ? (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "voice" | "face")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Voice
                </TabsTrigger>
                <TabsTrigger value="face" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Face
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="space-y-4 mt-6">
                <div className="text-center space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Click the button below and speak clearly into your microphone
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recording will last 3 seconds
                    </p>
                  </div>

                  <Button
                    onClick={authenticateWithVoice}
                    disabled={isRecording || isProcessing}
                    size="lg"
                    className="w-full"
                  >
                    {isRecording ? (
                      <>
                        <Mic className="w-5 h-5 mr-2 animate-pulse" />
                        Recording...
                      </>
                    ) : isProcessing ? (
                      "Processing..."
                    ) : (
                      <>
                        <Mic className="w-5 h-5 mr-2" />
                        Authenticate with Voice
                      </>
                    )}
                  </Button>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => setMode("enroll")}
                      variant="outline"
                      className="w-full"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Enroll New Voice Profile
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="face" className="mt-6">
                <div className="space-y-4">
                  {activeTab === "face" && (
                    <FaceAuth
                      onSuccess={handleFaceAuthSuccess}
                      onCancel={undefined}
                    />
                  )}

                  <div className="pt-2">
                    <Button
                      onClick={() => setMode("enroll")}
                      variant="outline"
                      className="w-full"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Enroll New Face Profile
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "voice" | "face")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="voice" className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Voice
                  </TabsTrigger>
                  <TabsTrigger value="face" className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Face
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="voice" className="mt-6">
                  {activeTab === "voice" && (
                    <VoiceEnrollment onComplete={handleEnrollmentComplete} />
                  )}
                </TabsContent>

                <TabsContent value="face" className="mt-6">
                  {activeTab === "face" && (
                    <FaceEnrollment onComplete={handleEnrollmentComplete} />
                  )}
                </TabsContent>
              </Tabs>

              <Button
                onClick={() => setMode("auth")}
                variant="outline"
                className="w-full"
              >
                Back to Authentication
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
