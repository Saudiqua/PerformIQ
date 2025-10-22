import { Home, Users, Settings, TrendingUp, BarChart3, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const employeeItems = [
    { title: "Dashboard", url: "/employee/dashboard", icon: Home },
  ];

  const managerItems = [
    { title: "Dashboard", url: "/manager/dashboard", icon: BarChart3 },
  ];

  const adminItems = [
    { title: "Dashboard", url: "/admin/dashboard", icon: TrendingUp },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ];

  const menuItems = 
    user.role === "employee" ? employeeItems :
    user.role === "manager" ? managerItems :
    adminItems;

  const getRoleBadgeVariant = () => {
    if (user.role === "admin") return "default";
    if (user.role === "manager") return "secondary";
    return "outline";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6">
            <h1 className="text-2xl font-bold text-primary">PerformIQ</h1>
            <p className="text-xs text-muted-foreground mt-1">Performance Analytics</p>
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <div className="px-4">
            <Badge variant={getRoleBadgeVariant()} className="w-full justify-center">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
