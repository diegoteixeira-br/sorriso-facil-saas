import React from "react";
import { 
  Calendar,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  Heart,
  Stethoscope,
  ClipboardList,
  TrendingDown
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
    group: "principal"
  },
  {
    title: "Pacientes",
    url: "/pacientes",
    icon: Users,
    group: "principal"
  },
  {
    title: "Dentistas",
    url: "/dentistas",
    icon: Stethoscope,
    group: "principal"
  },
  {
    title: "Funcionários",
    url: "/funcionarios",
    icon: Users,
    group: "principal"
  },
  {
    title: "Agenda",
    url: "/agenda",
    icon: Calendar,
    group: "principal"
  },
  {
    title: "Procedimentos",
    url: "/procedimentos",
    icon: ClipboardList,
    group: "clinico"
  },
  {
    title: "Orçamentos",
    url: "/orcamentos",
    icon: FileText,
    group: "clinico"
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: CreditCard,
    group: "clinico"
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3,
    group: "gestao"
  },
  {
    title: "Despesas",
    url: "/despesas",
    icon: TrendingDown,
    group: "gestao"
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
    group: "gestao"
  }
];

const groupedItems = {
  principal: menuItems.filter(item => item.group === "principal"),
  clinico: menuItems.filter(item => item.group === "clinico"),
  gestao: menuItems.filter(item => item.group === "gestao")
};

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  
  const [clinicData, setClinicData] = React.useState<{ name: string; logo?: string }>({ 
    name: 'System Dental' 
  });

  React.useEffect(() => {
    const fetchClinicData = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('clinic_name, logo_url')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setClinicData({
          name: data.clinic_name || 'System Dental',
          logo: data.logo_url || undefined
        });
      }
    };

    fetchClinicData();

    // Setup real-time subscription to listen for profile changes
    const subscription = supabase
      .channel('profile_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: `user_id=eq.${user?.id}`
        }, 
        (payload) => {
          console.log('Profile updated:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as any;
            setClinicData({
              name: newData.clinic_name || 'System Dental',
              logo: newData.logo_url || undefined
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium shadow-md border-l-4 border-primary-foreground" 
      : "text-card-foreground hover:bg-primary/10 hover:text-primary font-medium transition-all duration-200 hover:shadow-sm";

  return (
    <Sidebar className="border-r border-border w-64" collapsible="none">
      <SidebarContent className="bg-card">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div>
            <h2 className="font-bold text-lg text-card-foreground">{clinicData.name}</h2>
            <p className="text-xs text-muted-foreground">Sistema Odontológico</p>
          </div>
        </div>

        {/* Menu Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-bold text-card-foreground uppercase tracking-wider mb-2 px-2">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {groupedItems.principal.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                        ${getNavCls({ isActive })}
                      `}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="truncate font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu Clínico */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-bold text-card-foreground uppercase tracking-wider mb-2 px-2">
            Clínico
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {groupedItems.clinico.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                        ${getNavCls({ isActive })}
                      `}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="truncate font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu Gestão */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-bold text-card-foreground uppercase tracking-wider mb-2 px-2">
            Gestão
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {groupedItems.gestao.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                        ${getNavCls({ isActive })}
                      `}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="truncate font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}