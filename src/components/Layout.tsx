import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { signOut, subscriptionTier, subscribed } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-primary px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-primary-foreground" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-foreground rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">SD</span>
                </div>
                <div>
                  <h1 className="text-primary-foreground font-semibold text-lg">System Dental</h1>
                  <p className="text-primary-foreground/80 text-xs">Sistema Odontológico</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-primary-foreground hover:bg-primary-foreground/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}