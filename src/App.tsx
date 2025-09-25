
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SavedMixes from "./pages/SavedMixes";
import NotFound from "./pages/NotFound";
import { SoundProvider } from "./contexts/SoundContext";
import { AuthProvider } from "./hooks/useAuth";
import { useMixLockScreen, useLockScreenMetadata } from "./hooks/useMixLockScreen";

const queryClient = new QueryClient();

// Composant interne pour utiliser les hooks dans le contexte SoundProvider
const AppContent = () => {
  useMixLockScreen();
  useLockScreenMetadata();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/saved-mixes" element={<SavedMixes />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SoundProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </SoundProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

 


export default App;
