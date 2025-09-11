import { 
  Calendar,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  Heart,
  Stethoscope,
  CalendarDays
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
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
    title: "Agenda",
    url: "/agenda",
    icon: Calendar,
    group: "principal"
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
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium shadow-medical" 
      : "hover:bg-secondary text-muted-foreground hover:text-card-foreground";

  return (
    <Sidebar className={`border-r border-border ${collapsed ? "w-14" : "w-64"}`} collapsible="icon">
      <SidebarContent className="bg-card">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-8 h-8 bg-gradient-medical rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-lg text-card-foreground">Sorriso Fácil</h2>
              <p className="text-xs text-muted-foreground">Sistema Odontológico</p>
            </div>
          )}
        </div>

        {/* Menu Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groupedItems.principal.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className={getNavCls}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu Clínico */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Clínico
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groupedItems.clinico.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavCls}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu Gestão */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Gestão
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groupedItems.gestao.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavCls}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
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