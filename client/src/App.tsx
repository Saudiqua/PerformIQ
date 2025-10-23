import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProtectedRoute } from "@/components/protected-route";
import { useWebSocket } from "@/lib/useWebSocket";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import EmployeeDashboard from "@/pages/employee-dashboard";
import ManagerDashboard from "@/pages/manager-dashboard";
import EmployeeDeepDive from "@/pages/employee-deep-dive";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

function WebSocketProvider() {
  useWebSocket();
  return null;
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b bg-background">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md text-sm">
              <span className="font-medium">Demo Mode</span>
              <span>-</span>
              <span>Simulated Data</span>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </>
  );
}

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role === "employee") {
    return <Redirect to="/employee/dashboard" />;
  } else if (user?.role === "manager") {
    return <Redirect to="/manager/dashboard" />;
  } else if (user?.role === "admin") {
    return <Redirect to="/admin/dashboard" />;
  }

  return <Redirect to="/login" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      <Route path="/employee/dashboard">
        <ProtectedRoute allowedRoles={["employee"]}>
          <DashboardLayout>
            <EmployeeDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/manager/dashboard">
        <ProtectedRoute allowedRoles={["manager"]}>
          <DashboardLayout>
            <ManagerDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/manager/employee/:id">
        <ProtectedRoute allowedRoles={["manager"]}>
          <DashboardLayout>
            <EmployeeDeepDive />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/settings">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
} as React.CSSProperties;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeProvider>
            <WebSocketProvider />
            <SidebarProvider style={sidebarStyle}>
              <div className="flex h-screen w-full">
                <Toaster />
                <Router />
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
