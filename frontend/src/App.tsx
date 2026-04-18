import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/AuthContext";
import { ThemeProvider } from "@/ThemeContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import MyStock from "./pages/MyStock";
import Seasonality from "./pages/Seasonality";
import ProfitLoss from "./pages/ProfitLoss";
import UpdateStock from "./pages/UpdateStock";
import Notifications from "./pages/Notifications";
import Cart from "./pages/Cart";
import MedGuide from "./pages/MedGuide";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<Home />} />
      <Route path="stock" element={<MyStock />} />
      <Route path="seasonality" element={<Seasonality />} />
      <Route path="profit-loss" element={<ProfitLoss />} />
      <Route path="update" element={<UpdateStock />} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="cart" element={<Cart />} />
      <Route path="medguide" element={<MedGuide />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
