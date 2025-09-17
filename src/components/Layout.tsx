import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LogOut } from "lucide-react";
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
    // Redirect to auth page after logout
    window.location.href = '/auth';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
            <div className="flex items-center">
              <SidebarTrigger className="text-muted-foreground" />
            </div>
            
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
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