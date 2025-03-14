
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SoundProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/saved-mixes" element={<SavedMixes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SoundProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log("Service Worker enregistré avec succès :", registration);
      })
      .catch((error) => {
        console.error("Erreur lors de l'enregistrement du Service Worker :", error);
      });
  });
}


export default App;
