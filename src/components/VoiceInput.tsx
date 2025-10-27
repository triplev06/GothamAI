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
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
    recognition.continuous = true; // Keep listening continuously
    recognition.interimResults = true; // Get interim results
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      // Combine all results to get the full transcript
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + ' ';
      }
      fullTranscript = fullTranscript.trim();
      console.log("Recognized:", fullTranscript);
      transcriptRef.current = fullTranscript;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);

      // Don't stop on 'no-speech' error, just ignore it
      if (event.error === 'no-speech') {
        return;
      }

      setIsRecording(false);
      setIsProcessing(false);

      let errorMessage = "An error occurred during speech recognition.";

      switch (event.error) {
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
      // Don't automatically set isRecording to false here
      // It will be handled by our silence detection
    };

    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
      if (silenceDetectionIntervalRef.current) {
        clearInterval(silenceDetectionIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
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

      // Set up Web Audio API for silence detection
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start silence detection
      const SILENCE_THRESHOLD = 0.01; // Audio level threshold for silence
      const SILENCE_DURATION = 3000; // 3 seconds of silence
      const CHECK_INTERVAL = 100; // Check every 100ms

      let lastSoundTime = Date.now();

      const checkSilence = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Calculate RMS (root mean square) to detect audio level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        if (rms > SILENCE_THRESHOLD) {
          // Sound detected, reset timer
          lastSoundTime = Date.now();
        } else {
          // Silence detected, check duration
          const silenceDuration = Date.now() - lastSoundTime;
          if (silenceDuration >= SILENCE_DURATION) {
            console.log("3 seconds of silence detected, stopping recording");
            stopRecording();
          }
        }
      };

      silenceDetectionIntervalRef.current = setInterval(checkSilence, CHECK_INTERVAL);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Clear silence detection
        if (silenceDetectionIntervalRef.current) {
          clearInterval(silenceDetectionIntervalRef.current);
          silenceDetectionIntervalRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
          await audioContextRef.current.close();
          audioContextRef.current = null;
        }

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

        // Identify speaker
        const speakerName = await identifySpeaker(audioBlob);

        const transcript = transcriptRef.current;

        if (!transcript || transcript.trim() === "") {
          toast({
            title: "No speech detected",
            description: "Please try again and speak clearly.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

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
    console.log("Stopping recording manually or via silence detection");

    // Clear silence detection interval
    if (silenceDetectionIntervalRef.current) {
      clearInterval(silenceDetectionIntervalRef.current);
      silenceDetectionIntervalRef.current = null;
    }

    // Stop speech recognition
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error("Error stopping media recorder:", error);
      }
    }

    setIsRecording(false);
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
