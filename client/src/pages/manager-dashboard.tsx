import { useQuery } from "@tanstack/react-query";
import { ManagerDashboardData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, AlertCircle, Clock, Smile, Activity, Eye, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Link } from "wouter";
import { exportElementToPDF } from "@/lib/pdf-export";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker, DateRange } from "@/components/date-range-picker";
import { parseISO, isWithinInterval } from "date-fns";

export default function ManagerDashboard() {
  const { data, isLoading } = useQuery<ManagerDashboardData>({
    queryKey: ["/api/manager/dashboard"],
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  const defaultDateRange: DateRange = {
    from: new Date(new Date().setDate(new Date().getDate() - 90)),
    to: new Date(),
  };
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  
  const filteredSentimentTrend = useMemo(() => {
    if (!data?.teamAnalytics?.sentimentTrend) return [];
    
    const filtered = data.teamAnalytics.sentimentTrend.filter((item) => {
      const itemDate = parseISO(item.date);
      return isWithinInterval(itemDate, { start: dateRange.from, end: dateRange.to });
    });
    
    // Fallback to full dataset if filter eliminates all data points
    return filtered.length > 0 ? filtered : data.teamAnalytics.sentimentTrend;
  }, [data?.teamAnalytics?.sentimentTrend, dateRange]);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportElementToPDF(
        "manager-analytics-content",
        `team-analytics-${new Date().toISOString().split('T')[0]}.pdf`,
        "Team Analytics Report"
      );
      toast({
        title: "Export successful",
        description: "Team analytics has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the analytics",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getStatusColor = (status: string) => {
    if (status === "green") return "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700";
    if (status === "yellow") return "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700";
    return "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "high") return "destructive";
    if (severity === "medium") return "default";
    return "secondary";
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
    <div className="flex h-full">
      <div className="flex-1 p-8 space-y-8 overflow-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Team Dashboard</h1>
            <p className="text-muted-foreground">Monitor your team's performance and health</p>
          </div>
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            variant="outline"
            data-testid="button-export-pdf"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>

        <div id="manager-analytics-content" className="space-y-8">
        <Card className={`border-2 ${getStatusColor(data.teamHealth.status)}`} data-testid="card-team-health">
          <CardHeader>
            <CardTitle>Team Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                <p className="text-3xl font-bold font-mono">{data.teamHealth.overallScore.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">High Performers</p>
                <p className="text-3xl font-bold font-mono text-green-600 dark:text-green-400">{data.teamHealth.highPerformers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average</p>
                <p className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400">{data.teamHealth.averagePerformers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Needs Attention</p>
                <p className="text-3xl font-bold font-mono text-red-600 dark:text-red-400">{data.teamHealth.needsAttention}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4">Team Members</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.teamMembers.map((member) => (
              <Card key={member.id} className="relative hover-elevate" data-testid={`card-employee-${member.id}`}>
                {member.hasAlert && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Alert
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{member.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold font-mono">{member.performanceScore.toFixed(0)}</span>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(member.trend)}
                          <span className="text-xs font-medium">
                            {member.trendPercentage > 0 ? "+" : ""}{member.trendPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Response</span>
                    </div>
                    <span className="font-medium font-mono">{member.responseTime.toFixed(1)}h</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Smile className="h-3 w-3" />
                      <span>Sentiment</span>
                    </div>
                    <span className="font-medium font-mono">{(member.sentiment * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      <span>Activity</span>
                    </div>
                    <span className="font-medium font-mono">{member.activityLevel}</span>
                  </div>
                  <Link href={`/manager/employee/${member.id}`} data-testid={`link-view-employee-${member.id}`}>
                    <Button variant="outline" className="w-full mt-2" size="sm" data-testid={`button-view-employee-${member.id}`}>
                      <Eye className="h-3 w-3 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-sentiment-trend">
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Team Sentiment Trend</CardTitle>
                  <CardDescription>Average sentiment over time</CardDescription>
                </div>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredSentimentTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                      domain={[0, 1]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sentiment" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-workload-distribution">
            <CardHeader>
              <CardTitle>Workload Distribution</CardTitle>
              <CardDescription>Message volume by team member</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.teamAnalytics.workloadDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar 
                      dataKey="messageCount" 
                      fill="hsl(var(--chart-2))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>

      <div className="w-80 border-l bg-card p-6 overflow-auto">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Alerts</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {data.teamHealth.alertCount} {data.teamHealth.alertCount === 1 ? "issue" : "issues"} requiring attention
            </p>
          </div>

          <div className="space-y-3">
            {data.alerts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">No active alerts</p>
                </CardContent>
              </Card>
            ) : (
              data.alerts.slice(0, 10).map((alert) => (
                <Card key={alert.id} className="hover-elevate" data-testid={`card-alert-${alert.id}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Badge variant={getSeverityColor(alert.severity)} className="mb-2">
                          {alert.severity}
                        </Badge>
                        <p className="text-sm leading-snug">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
