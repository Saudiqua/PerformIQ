import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Users as UsersIcon, MessageSquare, TrendingUp, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SystemAnalytics {
  totalUsers: number;
  totalCommunications: number;
  avgPerformanceScore: number;
  alertsThisWeek: number;
}

interface Thresholds {
  performanceDropThreshold: number;
  burnoutThreshold: number;
  engagementThreshold: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<SystemAnalytics>({
    queryKey: ["/api/admin/analytics"],
  });

  const { data: thresholdsData, isLoading: thresholdsLoading } = useQuery<Thresholds>({
    queryKey: ["/api/admin/thresholds"],
  });

  const [thresholds, setThresholds] = useState({
    performanceDropThreshold: 15,
    burnoutThreshold: 70,
    engagementThreshold: 40,
  });

  useEffect(() => {
    if (thresholdsData) {
      setThresholds(thresholdsData);
    }
  }, [thresholdsData]);

  const updateThresholdsMutation = useMutation({
    mutationFn: async (newThresholds: typeof thresholds) => {
      return apiRequest("PUT", "/api/admin/thresholds", newThresholds);
    },
    onSuccess: () => {
      toast({
        title: "Thresholds updated",
        description: "Alert thresholds have been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/thresholds"] });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Could not update thresholds",
        variant: "destructive",
      });
    },
  });

  const isLoading = usersLoading || analyticsLoading || thresholdsLoading;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!users || !analytics) return null;

  const handleSaveThresholds = () => {
    updateThresholdsMutation.mutate(thresholds);
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === "admin") return "default";
    if (role === "manager") return "secondary";
    return "outline";
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">System-wide analytics and configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Communications</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{analytics.totalCommunications}</div>
            <p className="text-xs text-muted-foreground mt-1">Total messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{analytics.avgPerformanceScore.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">System-wide score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts This Week</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{analytics.alertsThisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          <TabsTrigger value="thresholds" data-testid="tab-thresholds">Alert Thresholds</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card data-testid="card-users-table">
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user accounts and roles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Team ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {user.teamId}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-4">
          <Card data-testid="card-alert-configuration">
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>Adjust thresholds for automated alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">Performance Drop Threshold</p>
                      <p className="text-sm text-muted-foreground">
                        Alert when performance drops by this percentage
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {thresholds.performanceDropThreshold}%
                    </Badge>
                  </div>
                  <Slider
                    value={[thresholds.performanceDropThreshold]}
                    onValueChange={([value]) =>
                      setThresholds({ ...thresholds, performanceDropThreshold: value })
                    }
                    min={5}
                    max={50}
                    step={5}
                    data-testid="slider-performance-drop"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">Burnout Threshold</p>
                      <p className="text-sm text-muted-foreground">
                        Alert when workload exceeds this score
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {thresholds.burnoutThreshold}
                    </Badge>
                  </div>
                  <Slider
                    value={[thresholds.burnoutThreshold]}
                    onValueChange={([value]) =>
                      setThresholds({ ...thresholds, burnoutThreshold: value })
                    }
                    min={50}
                    max={100}
                    step={5}
                    data-testid="slider-burnout"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">Engagement Threshold</p>
                      <p className="text-sm text-muted-foreground">
                        Alert when engagement falls below this score
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {thresholds.engagementThreshold}
                    </Badge>
                  </div>
                  <Slider
                    value={[thresholds.engagementThreshold]}
                    onValueChange={([value]) =>
                      setThresholds({ ...thresholds, engagementThreshold: value })
                    }
                    min={20}
                    max={80}
                    step={5}
                    data-testid="slider-engagement"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveThresholds} 
                disabled={updateThresholdsMutation.isPending}
                data-testid="button-save-thresholds"
              >
                {updateThresholdsMutation.isPending ? "Saving..." : "Save Thresholds"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
