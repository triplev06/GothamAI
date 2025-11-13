import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaceAuth } from "./FaceAuth";
import { PasswordAuth } from "./PasswordAuth";
import { UnifiedEnrollment } from "./UnifiedEnrollment";
import { ThemeToggle } from "./ThemeToggle";
import { Mic, Camera, UserPlus, CheckCircle2, Circle, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { extractVoiceFeatures, compareVoiceFeatures, VoiceFeatures } from "@/utils/voiceBiometrics";

interface BiometricAuthProps {
  onAuthenticated: (userName: string) => void;
}

interface AuthStatus {
  voice: { authenticated: boolean; userName: string; userProfileId: string };
  face: { authenticated: boolean; userName: string; userProfileId: string };
}

interface VoiceProfileWithUser {
  id: string;
  user_name: string;
  voice_features: VoiceFeatures;
  user_profile_id: string;
  user_profiles: {
    user_name: string;
  };
}

export function BiometricAuth({ onAuthenticated }: BiometricAuthProps) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<"auth" | "enroll">("auth");
  const [activeTab, setActiveTab] = useState<"voice" | "face" | "password">("voice");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    voice: { authenticated: false, userName: "", userProfileId: "" },
    face: { authenticated: false, userName: "", userProfileId: "" },
  });

  const { toast } = useToast();

  // Check if both authentications are complete
  useEffect(() => {
    if (authStatus.voice.authenticated && authStatus.face.authenticated) {
      // Verify both authentications are for the same user profile
      if (authStatus.voice.userProfileId === authStatus.face.userProfileId) {
        toast({
          title: "Access Granted",
          description: theme === 'batman'
            ? `Welcome to the Batcave, ${authStatus.voice.userName}. All security protocols cleared.`
            : `Welcome, ${authStatus.voice.userName}. Authentication successful. You may proceed.`,
        });
        onAuthenticated(authStatus.voice.userName);
      } else {
        toast({
          title: theme === 'batman' ? "Security Breach Detected" : "Authentication Mismatch",
          description: `Biometric mismatch. Voice: "${authStatus.voice.userName}", Face: "${authStatus.face.userName}". Access denied.`,
          variant: "destructive",
        });
        // Reset authentication
        setAuthStatus({
          voice: { authenticated: false, userName: "", userProfileId: "" },
          face: { authenticated: false, userName: "", userProfileId: "" },
        });
      }
    }
  }, [authStatus, onAuthenticated, toast]);

  const handleFaceAuthSuccess = (userName: string, profileId: string, userProfileId: string) => {
    setAuthStatus((prev) => ({
      ...prev,
      face: { authenticated: true, userName, userProfileId },
    }));

    toast({
      title: "Facial Recognition Complete",
      description: authStatus.voice.authenticated
        ? "Verifying credentials..."
        : "Voice authentication required.",
    });

    // Auto-switch to voice tab if not yet authenticated
    if (!authStatus.voice.authenticated) {
      setTimeout(() => setActiveTab("voice"), 1500);
    }
  };

  const handleVoiceAuthSuccess = (userName: string, userProfileId: string) => {
    setAuthStatus((prev) => ({
      ...prev,
      voice: { authenticated: true, userName, userProfileId },
    }));

    toast({
      title: "Voice Pattern Recognized",
      description: authStatus.face.authenticated
        ? "Verifying credentials..."
        : "Facial scan required.",
    });

    // Auto-switch to face tab if not yet authenticated
    if (!authStatus.face.authenticated) {
      setTimeout(() => setActiveTab("face"), 1500);
    }
  };

  const handleEnrollmentComplete = (userName: string) => {
    toast({
      title: "Personnel Registered",
      description: `${userName} authorized. Security clearance granted.`,
    });
    setMode("auth");
  };

  const handlePasswordAuthSuccess = (userName: string) => {
    // Password bypasses biometric requirements
    toast({
      title: "Access Granted",
      description: `Welcome to the Batcave, ${userName}.`,
    });
    onAuthenticated(userName);
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

        // Fetch all voice profiles with user profile info
        const { data: profiles, error } = await supabase
          .from("voice_profiles")
          .select(`
            *,
            user_profiles!inner (
              user_name
            )
          `);

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
        let bestMatch = { name: "", score: 0, userProfileId: "" };

        for (const profile of profiles as unknown as VoiceProfileWithUser[]) {
          // Skip profiles without proper user_profile linkage
          if (!profile.user_profile_id || !profile.user_profiles) {
            console.warn("Skipping voice profile without user_profile linkage:", profile.id);
            continue;
          }

          const similarity = compareVoiceFeatures(currentFeatures, profile.voice_features);

          if (similarity > bestMatch.score) {
            bestMatch = {
              name: profile.user_profiles.user_name,
              score: similarity,
              userProfileId: profile.user_profile_id,
            };
          }
        }

        setIsProcessing(false);

        // Check if match meets threshold (75% - increased for better security)
        if (bestMatch.score >= 0.75) {
          toast({
            title: "Voice Pattern Confirmed",
            description: `Identity verified: ${bestMatch.name} (${Math.round(bestMatch.score * 100)}% match)`,
          });

          handleVoiceAuthSuccess(bestMatch.name, bestMatch.userProfileId);
        } else {
          toast({
            title: "Access Denied",
            description: `Voice pattern not recognized. ${
              bestMatch.score > 0
                ? `Confidence: ${Math.round(bestMatch.score * 100)}% (75% required)`
                : "No matching profiles."
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

  const authTitle = theme === 'batman' ? 'Batcave Security Protocol' : theme === 'alfred' ? 'Biometric Authentication' : 'Chaos Clearance Required';
  const authDescription = mode === "auth"
    ? theme === 'batman'
      ? "Complete biometric authentication to access secure systems"
      : theme === 'alfred'
      ? "Complete both voice AND face authentication, or use your password backup"
      : "Show me your face and voice... if you DARE! HAHAHA!"
    : mode === "enroll"
    ? theme === 'batman'
      ? "Register new authorized personnel"
      : theme === 'alfred'
      ? "Enroll a new biometric profile"
      : "Let's make you part of the madness..."
    : "Configure backup security credentials";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${
      theme === 'batman' ? 'gradient-secondary' : theme === 'alfred' ? 'gradient-secondary' : 'gradient-chaos'
    }`}>
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className={`absolute inset-0 opacity-20 ${
        theme === 'batman'
          ? 'bg-[radial-gradient(circle_at_center,_hsl(43_74%_49%_/_0.15)_0%,_transparent_70%)]'
          : theme === 'alfred'
          ? 'bg-[radial-gradient(circle_at_center,_hsl(0_0%_75%_/_0.15)_0%,_transparent_70%)]'
          : 'bg-[radial-gradient(circle_at_center,_hsl(280_60%_60%_/_0.2)_0%,_transparent_70%)]'
      }`}></div>
      <Card className={`w-full max-w-2xl theme-entrance relative z-10 ${
        theme === 'batman' ? 'shadow-gotham-lg' : theme === 'alfred' ? 'shadow-elegant-lg' : 'shadow-chaos-lg'
      }`}>
        <CardHeader className={`text-center theme-panel`}>
          <CardTitle className={`text-2xl text-primary ${
            theme === 'batman' ? 'text-glow-gold' : theme === 'alfred' ? 'text-glow-silver' : 'text-glow-purple'
          }`}>
            {authTitle}
          </CardTitle>
          <CardDescription>{authDescription}</CardDescription>

          {/* Authentication Progress Indicators - Hidden on mobile */}
          {mode === "auth" && (
            <div className="hidden md:flex justify-center gap-6 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                {authStatus.voice.authenticated ? (
                  <CheckCircle2 className={`w-5 h-5 text-primary ${
                    theme === 'batman' ? 'glow-gold' : theme === 'alfred' ? 'glow-silver' : 'glow-purple'
                  }`} />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
                <span className={`text-sm ${authStatus.voice.authenticated ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  Voice {authStatus.voice.authenticated && `(${authStatus.voice.userName})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {authStatus.face.authenticated ? (
                  <CheckCircle2 className={`w-5 h-5 text-primary ${
                    theme === 'batman' ? 'glow-gold' : theme === 'alfred' ? 'glow-silver' : 'glow-purple'
                  }`} />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
                <span className={`text-sm ${authStatus.face.authenticated ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  Face {authStatus.face.authenticated && `(${authStatus.face.userName})`}
                </span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {mode === "auth" ? (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "voice" | "face" | "password")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Voice
                </TabsTrigger>
                <TabsTrigger value="face" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Face
                </TabsTrigger>
                <TabsTrigger value="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
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

              <TabsContent value="password" className="mt-6">
                {activeTab === "password" && (
                  <PasswordAuth onSuccess={handlePasswordAuthSuccess} />
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <UnifiedEnrollment
              onComplete={handleEnrollmentComplete}
              onCancel={() => setMode("auth")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
