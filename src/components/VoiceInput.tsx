import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isAssistantSpeaking: boolean;
}

const VoiceInput = ({ onTranscript, isAssistantSpeaking }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

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
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result?.toString().split(",")[1];
          if (base64Audio) {
            // For now, show a message that voice recognition is processing
            // In a real implementation, this would call a speech-to-text service
            toast({
              title: "Voice input received",
              description: "Processing your speech...",
            });
            
            // Simulate transcription (in real app, call speech-to-text API)
            setTimeout(() => {
              onTranscript("How can I help you today?");
              setIsProcessing(false);
            }, 1000);
          }
        };

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
