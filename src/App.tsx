import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Register from "./pages/Register";
import Applicants from "./pages/Applicants";
import IDUpload from "./pages/IDUpload";
import IDUploadSuccess from "./pages/IDUploadSuccess";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import NotFound from "./pages/NotFound";
import CitizenAuth from "./pages/CitizenAuth";
import CitizenDashboard from "./pages/CitizenDashboard";
import StaffAppointments from "./pages/StaffAppointments";
import Analytics from "./pages/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/applicants" element={<Applicants />} />
          <Route path="/id-upload" element={<IDUpload />} />
          <Route path="/id-upload-success" element={<IDUploadSuccess />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
          {/* Citizen Portal Routes */}
          <Route path="/citizen-auth" element={<CitizenAuth />} />
          <Route path="/citizen" element={<CitizenDashboard />} />
          {/* Staff Appointments */}
          <Route path="/appointments" element={<StaffAppointments />} />
          <Route path="/analytics" element={<Analytics />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
