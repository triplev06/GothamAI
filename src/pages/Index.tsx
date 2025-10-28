import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import { BiometricAuth } from "@/components/BiometricAuth";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<string>("");

  const handleAuthentication = (userName: string) => {
    setAuthenticatedUser(userName);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <BiometricAuth onAuthenticated={handleAuthentication} />;
  }

  return (
    <div className="relative">
      <ChatInterface />

      {/* Welcome message display */}
      <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
        <p className="text-sm">
          Welcome, <strong>{authenticatedUser}</strong>
        </p>
        <p className="text-xs opacity-80">Verified by Voice + Face</p>
      </div>
    </div>
  );
};

export default Index;
