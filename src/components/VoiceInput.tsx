import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractVoiceFeatures, compareVoiceFeatures, VoiceFeatures } from "@/utils/voiceBiometrics";

interface VoiceInputProps {
  onTranscript: (text: string, speakerName?: string) => void;
  isAssistantSpeaking: boolean;
}

// Type declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const VoiceInput = ({ onTranscript, isAssistantSpeaking }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log("Recognized:", transcript);
      transcriptRef.current = transcript;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      setIsProcessing(false);

      let errorMessage = "An error occurred during speech recognition.";

      switch (event.error) {
        case 'no-speech':
          errorMessage = "No speech detected. Please try again.";
          break;
        case 'audio-capture':
          errorMessage = "Microphone not found or not accessible.";
          break;
        case 'not-allowed':
          errorMessage = "Microphone permission denied. Please allow access.";
          break;
        case 'network':
          errorMessage = "Network error occurred during recognition.";
          break;
      }

      toast({
        title: "Recognition Error",
        description: errorMessage,
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [toast]);

  const identifySpeaker = async (audioBlob: Blob): Promise<string | undefined> => {
    try {
      setIsProcessing(true);

      // Extract voice features from the audio
      const currentFeatures = await extractVoiceFeatures(audioBlob);

      // Fetch all voice profiles from Supabase
      const { data: profiles, error } = await supabase
        .from('voice_profiles')
        .select('*');

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        console.log("No voice profiles found");
        return undefined;
      }

      // Compare with all profiles and find best match
      let bestMatch = { name: "", score: 0 };

      for (const profile of profiles) {
        const storedFeatures = profile.voice_features as VoiceFeatures;
        const similarity = compareVoiceFeatures(currentFeatures, storedFeatures);

        console.log(`Similarity with ${profile.user_name}: ${similarity.toFixed(2)}`);

        if (similarity > bestMatch.score) {
          bestMatch = { name: profile.user_name, score: similarity };
        }
      }

      // Require at least 60% similarity to identify
      const SIMILARITY_THRESHOLD = 0.6;

      if (bestMatch.score >= SIMILARITY_THRESHOLD) {
        console.log(`Identified speaker: ${bestMatch.name} (${(bestMatch.score * 100).toFixed(1)}% match)`);
        return bestMatch.name;
      } else {
        console.log(`No confident match found (best: ${(bestMatch.score * 100).toFixed(1)}%)`);
        return undefined;
      }
    } catch (error) {
      console.error("Error identifying speaker:", error);
      return undefined;
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Available",
        description: "Speech recognition is not available in this browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Start MediaRecorder for voice biometrics
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      transcriptRef.current = "";

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

        // Identify speaker
        const speakerName = await identifySpeaker(audioBlob);

        const transcript = transcriptRef.current;

        if (speakerName) {
          toast({
            title: "Voice recognized",
            description: `${speakerName} said: "${transcript}"`,
          });
        } else {
          toast({
            title: "Voice recognized",
            description: `Unknown speaker said: "${transcript}"`,
          });
        }

        // Send transcript with speaker info
        onTranscript(transcript, speakerName);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();

      // Also start speech recognition
      recognitionRef.current.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Could not start recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="flex justify-center">
      <Button
        size="lg"
        className={`rounded-full w-16 h-16 transition-all duration-300 ${
          isRecording
            ? "bg-destructive hover:bg-destructive/90 animate-pulse shadow-lg"
            : "bg-primary hover:bg-primary/90 hover:scale-105 shadow-md border-2 border-accent"
        }`}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || isAssistantSpeaking}
      >
        {isProcessing ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
};

export default VoiceInput;
