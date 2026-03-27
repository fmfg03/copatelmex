import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { FloatingDownload } from "@/components/FloatingDownload";
import ComingSoon from "./pages/ComingSoon";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import DocumentsPortal from "./pages/DocumentsPortal";
import TournamentInfo from "./pages/TournamentInfo";
import Schedule from "./pages/Schedule";
import TournamentCalendar from "./pages/TournamentCalendar";
import MediaGallery from "./pages/MediaGallery";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import Admin from "./pages/Admin";
import MyTeams from "./pages/MyTeams";
import StateOperators from "./pages/StateOperators";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <FloatingDownload />
        <Routes>
          <Route path="/" element={<ComingSoon />} />
          <Route path="/home" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/register" element={<Register />} />
          <Route path="/documents" element={<DocumentsPortal />} />
          <Route path="/tournament-info" element={<TournamentInfo />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/calendario" element={<TournamentCalendar />} />
          <Route path="/media" element={<MediaGallery />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancelled" element={<PaymentCancelled />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/my-teams" element={<MyTeams />} />
          <Route path="/inscripcion" element={<StateOperators />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
