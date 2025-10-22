import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AuthResponse } from "@shared/schema";
import { Link } from "wouter";
import { TrendingUp } from "lucide-react";

export default function Login() {
  const { login, user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "employee") {
        setLocation("/employee/dashboard");
      } else if (user.role === "manager") {
        setLocation("/manager/dashboard");
      } else {
        setLocation("/admin/dashboard");
      }
    }
  }, [isAuthenticated, user, setLocation]);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<AuthResponse>("POST", "/api/auth/login", data);
      login(response.token, response.user);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${response.user.name}`,
      });
      // Redirect is handled by useEffect after auth state updates
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-primary">PerformIQ</h1>
          </div>
          <p className="text-muted-foreground">AI-Powered Performance Management</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="employee@demo.com" 
                          {...field} 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter password" 
                          {...field}
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 p-4 bg-muted rounded-md">
              <p className="text-xs font-medium mb-2">Demo Accounts:</p>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>Employee: employee@demo.com</p>
                <p>Manager: manager@demo.com</p>
                <p>Admin: admin@demo.com</p>
                <p>Password: demo123</p>
              </div>
            </div>

            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline" data-testid="link-signup">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md text-sm">
            <span className="font-medium">Demo Mode</span>
            <span>-</span>
            <span>Simulated Data</span>
          </div>
        </div>
      </div>
    </div>
  );
}
