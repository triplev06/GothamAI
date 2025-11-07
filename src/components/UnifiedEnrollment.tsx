import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VoiceEnrollment from "./VoiceEnrollment";
import { FaceEnrollment } from "./FaceEnrollment";
import { PasswordSetup } from "./PasswordSetup";
import { CheckCircle2, Circle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UnifiedEnrollmentProps {
  onComplete: (userName: string) => void;
  onCancel: () => void;
}

type EnrollmentStep = "username" | "voice" | "face" | "password" | "complete";

interface EnrollmentStatus {
  voice: boolean;
  face: boolean;
  password: boolean;
}

export function UnifiedEnrollment({ onComplete, onCancel }: UnifiedEnrollmentProps) {
  const [step, setStep] = useState<EnrollmentStep>("username");
  const [userName, setUserName] = useState("");
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState<EnrollmentStatus>({
    voice: false,
    face: false,
    password: false,
  });
  const { toast } = useToast();

  const handleUsernameSubmit = async () => {
    if (userName.trim().length < 2) {
      toast({
        title: "Invalid Username",
        description: "Please enter a username with at least 2 characters.",
        variant: "destructive",
      });
      return;
    }

    // Check if username already exists
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_name", userName.trim())
      .single();

    if (existingProfile) {
      toast({
        title: "Username Taken",
        description: "This username is already registered. Please choose another.",
        variant: "destructive",
      });
      return;
    }

    // Create user profile
    const { data: newProfile, error } = await supabase
      .from("user_profiles")
      .insert({
        user_name: userName.trim(),
        password_hash: null,
      })
      .select()
      .single();

    if (error || !newProfile) {
      toast({
        title: "Error",
        description: "Failed to create user profile. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setUserProfileId(newProfile.id);
    setStep("voice");
  };

  const handleVoiceComplete = async (profileId: string, userName?: string) => {
    // Link voice profile to user profile
    await supabase
      .from("voice_profiles")
      .update({ user_profile_id: userProfileId })
      .eq("id", profileId);

    setStatus((prev) => ({ ...prev, voice: true }));
    toast({
      title: "Voice Enrolled",
      description: "Voice profile created successfully!",
    });
    setStep("face");
  };

  const handleFaceComplete = async (profileId: string, userName?: string) => {
    // Link face profile to user profile
    await supabase
      .from("face_profiles")
      .update({ user_profile_id: userProfileId })
      .eq("id", profileId);

    setStatus((prev) => ({ ...prev, face: true }));
    toast({
      title: "Face Enrolled",
      description: "Face profile created successfully!",
    });
    setStep("password");
  };

  const handlePasswordComplete = () => {
    setStatus((prev) => ({ ...prev, password: true }));
    setStep("complete");
  };

  const handlePasswordSkip = () => {
    setStep("complete");
  };

  const handleFinish = () => {
    toast({
      title: "Enrollment Complete!",
      description: `Welcome, ${userName}! Your account is ready.`,
    });
    onComplete(userName);
  };

  return (
    <div className="space-y-4">
      {/* Progress Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Account Setup for {userName || "New User"}
          </CardTitle>
          <CardDescription>
            Set up all authentication methods for one account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2">
              {status.voice ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : step === "voice" ? (
                <Circle className="w-5 h-5 text-blue-500 animate-pulse" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={`text-sm ${status.voice ? "text-green-500 font-semibold" : "text-muted-foreground"}`}>
                Voice
              </span>
            </div>
            <div className="flex items-center gap-2">
              {status.face ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : step === "face" ? (
                <Circle className="w-5 h-5 text-blue-500 animate-pulse" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={`text-sm ${status.face ? "text-green-500 font-semibold" : "text-muted-foreground"}`}>
                Face
              </span>
            </div>
            <div className="flex items-center gap-2">
              {status.password ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : step === "password" ? (
                <Circle className="w-5 h-5 text-blue-500 animate-pulse" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={`text-sm ${status.password ? "text-green-500 font-semibold" : "text-muted-foreground"}`}>
                Password
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {step === "username" && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Username</CardTitle>
            <CardDescription>
              This username will be used for all authentication methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleUsernameSubmit()}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUsernameSubmit} className="flex-1">
                Continue
              </Button>
              <Button onClick={onCancel} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "voice" && (
        <VoiceEnrollment
          onComplete={handleVoiceComplete}
          userName={userName}
        />
      )}

      {step === "face" && (
        <FaceEnrollment
          onComplete={handleFaceComplete}
          userName={userName}
        />
      )}

      {step === "password" && (
        <PasswordSetup
          userName={userName}
          onComplete={handlePasswordComplete}
          onSkip={handlePasswordSkip}
        />
      )}

      {step === "complete" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Enrollment Complete!
            </CardTitle>
            <CardDescription>
              Your account is ready with the following methods:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {status.voice && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Voice authentication enabled</span>
                </div>
              )}
              {status.face && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Face authentication enabled</span>
                </div>
              )}
              {status.password && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Password backup enabled</span>
                </div>
              )}
              {!status.password && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Circle className="w-4 h-4" />
                  <span className="text-sm">No password backup (you can add this later)</span>
                </div>
              )}
            </div>
            <Button onClick={handleFinish} className="w-full">
              Finish & Sign In
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
