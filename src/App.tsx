import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HittingProvider } from "@/context/HittingContext";
import Index from "./pages/Index";
import Roster from "./pages/Roster";
import PlayerDetail from "./pages/PlayerDetail";
import ParentDashboard from "./pages/ParentDashboard";
import NewOuting from "./pages/NewOuting";
import LiveOuting from "./pages/LiveOuting";
import LogOuting from "./pages/LogOuting";
import OutingDetail from "./pages/OutingDetail";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import CoachLogin from "./pages/CoachLogin";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HittingProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/roster" element={<Roster />} />
            <Route path="/player/:id" element={<PlayerDetail />} />
            <Route path="/parent/:id" element={<ParentDashboard />} />
            <Route path="/new-outing" element={<NewOuting />} />
            <Route path="/live/:id" element={<LiveOuting />} />
            <Route path="/log/:id" element={<LogOuting />} />
            <Route path="/outing/:id" element={<OutingDetail />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/coach-login" element={<CoachLogin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </HittingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
