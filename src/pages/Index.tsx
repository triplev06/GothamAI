import { useState, useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import VoiceEnrollment from "@/components/VoiceEnrollment";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [hasProfiles, setHasProfiles] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkForProfiles();
  }, []);

  const checkForProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_profiles')
        .select('id')
        .limit(1);

      if (error) throw error;

      setHasProfiles(data && data.length > 0);

      // If no profiles exist, show enrollment wizard automatically
      if (!data || data.length === 0) {
        setShowEnrollment(true);
      }
    } catch (error) {
      console.error("Error checking voice profiles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollmentComplete = () => {
    setShowEnrollment(false);
    setHasProfiles(true);
    checkForProfiles();
  };

  const handleSkipEnrollment = () => {
    setShowEnrollment(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showEnrollment) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4">
        <VoiceEnrollment
          onComplete={handleEnrollmentComplete}
          onSkip={handleSkipEnrollment}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <ChatInterface />

      {/* Floating button to add new voice profile */}
      <div className="fixed bottom-24 right-8 z-50">
        <Button
          onClick={() => setShowEnrollment(true)}
          size="lg"
          className="rounded-full shadow-lg hover:scale-105 transition-transform"
          title="Add new voice profile"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add Voice Profile
        </Button>
      </div>
    </div>
  );
};

export default Index;
