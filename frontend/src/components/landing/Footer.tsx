import { Pill } from "lucide-react";

const Footer = () => (
  <footer className="py-10 border-t border-border bg-background">
    <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Pill className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">MedManager</span>
      </div>
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} MedManager. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
