import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Store, LogOut, LayoutDashboard, Shield, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, userRole, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Store className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-primary">ALSHBH</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">عن المنصة</Link>
          <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">كلمنا</Link>
          {user ? (
            <>
              {userRole === "admin" && (
                <Link to="/admin">
                  <Button variant="outline" size="sm"><Shield className="ml-1 h-4 w-4" />الأدمن</Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="outline" size="sm"><LayoutDashboard className="ml-1 h-4 w-4" />متجري</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="ml-1 h-4 w-4" />خروج
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm">يلا ادخل! 🚀</Button>
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-2">
          <Link to="/about" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>عن المنصة</Link>
          <Link to="/contact" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>كلمنا</Link>
          {user ? (
            <>
              {userRole === "admin" && (
                <Link to="/admin" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>الأدمن</Link>
              )}
              <Link to="/dashboard" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>متجري</Link>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { signOut(); setMobileOpen(false); }}>
                <LogOut className="ml-1 h-4 w-4" />خروج
              </Button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)}>
              <Button size="sm" className="w-full">يلا ادخل! 🚀</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
