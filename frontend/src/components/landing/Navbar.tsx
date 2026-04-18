import { Pill } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onLogin: () => void;
}

const Navbar = ({ onLogin }: NavbarProps) => {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Pill className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">MedManager</span>
        </div>
        <Button onClick={onLogin} size="sm">
          Sign In
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
