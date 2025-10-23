import { useQuery } from "@tanstack/react-query";
import { EmployeeDashboardData } from "@shared/schema";
import { PerformanceScoreCard } from "@/components/performance-score-card";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Users, Clock, MessageSquare, TrendingUp, Target, Zap, MessageCircle, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { exportElementToPDF } from "@/lib/pdf-export";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker, DateRange } from "@/components/date-range-picker";
import { parseISO, isWithinInterval } from "date-fns";

export default function EmployeeDashboard() {
  const { data, isLoading } = useQuery<EmployeeDashboardData>({
    queryKey: ["/api/employee/dashboard"],
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  const defaultDateRange: DateRange = {
    from: new Date(new Date().setDate(new Date().getDate() - 90)),
    to: new Date(),
  };
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  
  const filteredWeeklyTrends = useMemo(() => {
    if (!data?.weeklyTrends) return [];
    
    const filtered = data.weeklyTrends.filter((trend) => {
      const trendDate = parseISO(trend.week);
      return isWithinInterval(trendDate, { start: dateRange.from, end: dateRange.to });
    });
    
    // Fallback to full dataset if filter eliminates all data points
    return filtered.length > 0 ? filtered : data.weeklyTrends;
  }, [data?.weeklyTrends, dateRange]);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportElementToPDF(
        "employee-dashboard-content",
        `performance-report-${new Date().toISOString().split('T')[0]}.pdf`,
        "Employee Performance Report"
      );
      toast({
        title: "Export successful",
        description: "Your performance report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your report",
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
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getSentimentColor = (type: string) => {
    if (type === "positive") return "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200";
    if (type === "neutral") return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
    return "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200";
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
    <div className="p-8 space-y-8 max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Welcome, {data.user.name}</h1>
          <p className="text-muted-foreground">Here's your performance overview and insights</p>
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

      <div id="employee-dashboard-content" className="space-y-8">

      <PerformanceScoreCard 
        score={data.performanceScore} 
        trend={data.performanceTrend}
        data-testid="card-performance-overview"
      />

      <div>
        <h2 className="text-xl font-semibold mb-4">Key Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Initiative Score"
            value={data.metrics.initiative.current}
            trend={data.metrics.initiative.trend}
            icon={Target}
          />
          <MetricCard
            title="Collaboration Index"
            value={data.metrics.collaboration.current}
            trend={data.metrics.collaboration.trend}
            icon={Users}
          />
          <MetricCard
            title="Responsiveness"
            value={data.metrics.responsiveness.current}
            trend={data.metrics.responsiveness.trend}
            icon={Zap}
          />
          <MetricCard
            title="Communication Clarity"
            value={data.metrics.clarity.current}
            trend={data.metrics.clarity.trend}
            icon={MessageCircle}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Communication Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{data.communicationStats.avgResponseTime.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                Team avg: {data.communicationStats.teamAvgResponseTime.toFixed(1)}h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{data.communicationStats.messagesSentThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last week: {data.communicationStats.messagesSentLastWeek}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Received</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{data.communicationStats.messagesReceivedThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last week: {data.communicationStats.messagesReceivedLastWeek}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sentiment Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Positive</span>
                  <Badge className={getSentimentColor("positive")}>
                    {data.communicationStats.sentimentBreakdown.positive}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Neutral</span>
                  <Badge className={getSentimentColor("neutral")}>
                    {data.communicationStats.sentimentBreakdown.neutral}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Negative</span>
                  <Badge className={getSentimentColor("negative")}>
                    {data.communicationStats.sentimentBreakdown.negative}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card data-testid="card-collaboration-partners">
        <CardHeader>
          <CardTitle>Top Collaboration Partners</CardTitle>
          <CardDescription>People you communicate with most frequently</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.communicationStats.topCollaborators.map((collaborator, index) => (
              <div key={collaborator.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={collaborator.avatarUrl} alt={collaborator.name} />
                    <AvatarFallback>{getInitials(collaborator.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{collaborator.name}</p>
                    <p className="text-xs text-muted-foreground">{collaborator.messageCount} messages</p>
                  </div>
                </div>
                <Badge variant="outline">#{index + 1}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-weekly-trend">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>Track your metrics over time</CardDescription>
            </div>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredWeeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
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
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="initiative" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Initiative"
                />
                <Line 
                  type="monotone" 
                  dataKey="collaboration" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Collaboration"
                />
                <Line 
                  type="monotone" 
                  dataKey="responsiveness" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Responsiveness"
                />
                <Line 
                  type="monotone" 
                  dataKey="clarity" 
                  stroke="hsl(var(--chart-4))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Clarity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-strengths">
          <CardHeader>
            <CardTitle className="text-green-600 dark:text-green-400">Your Strengths</CardTitle>
            <CardDescription>AI-identified areas where you excel</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.aiInsights.strengths.map((strength, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card data-testid="card-growth-areas">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">Areas for Growth</CardTitle>
            <CardDescription>Actionable suggestions to improve</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.aiInsights.growthAreas.map((area, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                  <span className="text-sm">{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20" data-testid="card-weekly-highlight">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            This Week's Highlight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed" data-testid="text-weekly-highlight">{data.aiInsights.weeklyHighlight}</p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
