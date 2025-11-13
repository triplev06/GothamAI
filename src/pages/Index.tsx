import { useState, useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import { BiometricAuth } from "@/components/BiometricAuth";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<string>("");
  const [showWelcome, setShowWelcome] = useState(true);

  const handleAuthentication = (userName: string) => {
    setAuthenticatedUser(userName);
    setIsAuthenticated(true);
    setShowWelcome(true);
  };

  // Auto-hide welcome message on mobile after 3 seconds
  useEffect(() => {
    if (isAuthenticated) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const timer = setTimeout(() => {
          setShowWelcome(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <BiometricAuth onAuthenticated={handleAuthentication} />;
  }

  return (
    <div className="relative">
      <ChatInterface />

      {/* Welcome message display - auto-hides on mobile after 3 seconds */}
      {showWelcome && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300">
          <p className="text-sm">
            Welcome, <strong>{authenticatedUser}</strong>
          </p>
          <p className="text-xs opacity-80">Verified by Voice + Face</p>
        </div>
      )}
    </div>
  );
};

export default Index;
