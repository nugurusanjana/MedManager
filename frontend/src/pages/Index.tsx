import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeatureCards from "@/components/landing/FeatureCards";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onLogin={handleLogin} />
      <main className="flex-1">
        <HeroSection onGetStarted={handleLogin} />
        <FeatureCards />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
