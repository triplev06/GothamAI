import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractVoiceFeatures, averageVoiceFeatures, VoiceFeatures } from "@/utils/voiceBiometrics";

interface VoiceEnrollmentProps {
  onComplete: (userId: string, userName?: string) => void;
  onSkip?: () => void;
  userName?: string; // Optional: if provided, skip name entry
}

const REQUIRED_SAMPLES = 3;
const SAMPLE_DURATION = 3000; // 3 seconds per sample

const VoiceEnrollment = ({ onComplete, onSkip, userName: providedUserName }: VoiceEnrollmentProps) => {
  const [step, setStep] = useState<'name' | 'recording' | 'processing'>(providedUserName ? 'recording' : 'name');
  const [userName, setUserName] = useState(providedUserName || "");
  const [currentSample, setCurrentSample] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [samples, setSamples] = useState<Blob[]>([]);
  const [features, setFeatures] = useState<VoiceFeatures[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const prompts = [
    "Please say: 'My name is [your name] and I'm setting up my voice profile'",
    "Please say: 'The quick brown fox jumps over the lazy dog'",
    "Please say: 'I use my voice to identify myself to this AI assistant'",
  ];

  const handleNameSubmit = () => {
    if (userName.trim().length < 2) {
      toast({
        title: "Invalid Name",
        description: "Please enter a name with at least 2 characters.",
        variant: "destructive",
      });
      return;
    }
    setStep('recording');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setSamples((prev) => [...prev, audioBlob]);

        // Extract features from this sample
        try {
          const voiceFeatures = await extractVoiceFeatures(audioBlob);
          setFeatures((prev) => [...prev, voiceFeatures]);

          toast({
            title: "Sample Recorded",
            description: `Sample ${currentSample + 1} of ${REQUIRED_SAMPLES} captured successfully.`,
          });

          if (currentSample + 1 < REQUIRED_SAMPLES) {
            setCurrentSample((prev) => prev + 1);
          } else {
            // All samples collected, process enrollment
            await processEnrollment([...features, voiceFeatures]);
          }
        } catch (error) {
          console.error("Error extracting voice features:", error);
          toast({
            title: "Processing Error",
            description: "Failed to process voice sample. Please try again.",
            variant: "destructive",
          });
        }

        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after SAMPLE_DURATION
      recordingTimerRef.current = setTimeout(() => {
        stopRecording();
      }, SAMPLE_DURATION);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const processEnrollment = async (allFeatures: VoiceFeatures[]) => {
    setStep('processing');

    try {
      // Average all voice features
      const averagedFeatures = averageVoiceFeatures(allFeatures);

      // Store in Supabase
      const { data, error } = await supabase
        .from('voice_profiles')
        .insert({
          user_name: userName,
          voice_features: averagedFeatures,
          enrollment_samples: REQUIRED_SAMPLES,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", error);
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        console.error("Error hint:", error.hint);
        throw error;
      }

      toast({
        title: "Enrollment Complete!",
        description: `Voice profile for ${userName} has been created successfully.`,
      });

      onComplete(data.id, userName);
    } catch (error) {
      console.error("Error saving voice profile:", error);
      console.error("Full error object:", JSON.stringify(error, null, 2));

      let errorMessage = "Could not save your voice profile. Please try again.";

      if (error?.message) {
        errorMessage += ` Error: ${error.message}`;
      }

      toast({
        title: "Enrollment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setStep('recording');
    }
  };

  if (step === 'name') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Voice Enrollment</CardTitle>
          <CardDescription>
            Set up your voice profile to let the AI recognize you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Your Name</label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {onSkip && (
            <Button variant="outline" onClick={onSkip}>
              Skip for Now
            </Button>
          )}
          <Button onClick={handleNameSubmit}>
            Continue
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === 'recording') {
    const progress = ((currentSample / REQUIRED_SAMPLES) * 100).toFixed(0);

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Record Voice Samples</CardTitle>
          <CardDescription>
            Sample {currentSample + 1} of {REQUIRED_SAMPLES}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Recording Prompt */}
            <div className="p-4 bg-accent rounded-lg">
              <p className="text-sm font-medium text-center">
                {prompts[currentSample]}
              </p>
            </div>

            {/* Recording Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                className={`rounded-full w-20 h-20 transition-all duration-300 ${
                  isRecording
                    ? "bg-destructive hover:bg-destructive/90 animate-pulse shadow-lg"
                    : "bg-primary hover:bg-primary/90 hover:scale-105 shadow-md"
                }`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 bg-white rounded-sm" />
                    <span className="text-xs mt-1">Stop</span>
                  </div>
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {isRecording ? "Recording... speak clearly" : "Click to start recording"}
            </p>

            {/* Completed Samples */}
            <div className="flex justify-center gap-2">
              {Array.from({ length: REQUIRED_SAMPLES }).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    i < currentSample
                      ? "bg-green-500"
                      : i === currentSample && isRecording
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-secondary"
                  }`}
                >
                  {i < currentSample && <Check className="w-4 h-4 text-white" />}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'processing') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Processing Your Voice Profile</CardTitle>
          <CardDescription>
            Please wait while we create your voice profile...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default VoiceEnrollment;
