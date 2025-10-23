import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { EmployeeDeepDiveData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Target, Users, Zap, ThumbsUp, Lightbulb, TrendingUp, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import { Link } from "wouter";
import { exportElementToPDF } from "@/lib/pdf-export";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeDeepDive() {
  const [, params] = useRoute("/manager/employee/:id");
  const employeeId = params?.id;
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<EmployeeDeepDiveData>({
    queryKey: ["/api/manager/employee", employeeId],
    enabled: !!employeeId,
  });

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportElementToPDF(
        "employee-detail-content",
        `employee-analysis-${data?.employee.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
        "Employee Performance Analysis"
      );
      toast({
        title: "Export successful",
        description: "Employee analysis has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the analysis",
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return "text-green-600 dark:text-green-400";
    if (sentiment < -0.3) return "text-red-600 dark:text-red-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  const getSentimentBadge = (sentiment: number) => {
    if (sentiment > 0.3) return "Positive";
    if (sentiment < -0.3) return "Negative";
    return "Neutral";
  };

  const metricsData = [
    { name: "Initiative", value: data.metrics.initiative, fill: "hsl(var(--chart-1))" },
    { name: "Collaboration", value: data.metrics.collaboration, fill: "hsl(var(--chart-2))" },
    { name: "Responsiveness", value: data.metrics.responsiveness, fill: "hsl(var(--chart-3))" },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/manager/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold">Employee Performance Analysis</h1>
            <p className="text-muted-foreground">Detailed insights and recommendations</p>
          </div>
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

      <div id="employee-detail-content" className="space-y-8">
      <Card data-testid="card-employee-header">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={data.employee.avatarUrl} alt={data.employee.name} />
              <AvatarFallback className="text-2xl">{getInitials(data.employee.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{data.employee.name}</h2>
              <p className="text-muted-foreground">{data.employee.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Overall Performance</p>
              <p className="text-5xl font-bold font-mono text-primary">{data.performanceScore.toFixed(0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Current Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Initiative Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{data.metrics.initiative.toFixed(0)}</div>
              <div className="mt-4 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="60%" 
                    outerRadius="100%" 
                    data={[{ value: data.metrics.initiative, fill: "hsl(var(--chart-1))" }]}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar background dataKey="value" />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collaboration Index</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{data.metrics.collaboration.toFixed(0)}</div>
              <div className="mt-4 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="60%" 
                    outerRadius="100%" 
                    data={[{ value: data.metrics.collaboration, fill: "hsl(var(--chart-2))" }]}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar background dataKey="value" />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Responsiveness</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{data.metrics.responsiveness.toFixed(0)}</div>
              <div className="mt-4 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="60%" 
                    outerRadius="100%" 
                    data={[{ value: data.metrics.responsiveness, fill: "hsl(var(--chart-3))" }]}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar background dataKey="value" />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card data-testid="card-performance-trends">
        <CardHeader>
          <CardTitle>3-Month Performance Trends</CardTitle>
          <CardDescription>Track progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  domain={[0, 100]}
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
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-ai-summary">
        <CardHeader>
          <CardTitle>AI Performance Summary</CardTitle>
          <CardDescription>Generated insights based on communication patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed" data-testid="text-ai-summary">{data.aiSummary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Communication Examples</CardTitle>
          <CardDescription>Sample messages with sentiment analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.communicationExamples.map((example, index) => (
            <div key={index} className="p-4 border rounded-md bg-card">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{example.platform}</Badge>
                <Badge className={getSentimentColor(example.sentiment)}>
                  {getSentimentBadge(example.sentiment)}
                </Badge>
              </div>
              <p className="text-sm mb-2 italic text-muted-foreground">"{example.snippet}"</p>
              <p className="text-xs text-muted-foreground">
                {new Date(example.timestamp).toLocaleDateString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <ThumbsUp className="h-5 w-5" />
              Recognize
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recommendations.recognize.map((item, index) => (
                <li key={index} className="text-sm flex gap-2">
                  <span className="text-green-600 dark:text-green-400">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Lightbulb className="h-5 w-5" />
              Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recommendations.support.map((item, index) => (
                <li key={index} className="text-sm flex gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <TrendingUp className="h-5 w-5" />
              Develop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recommendations.develop.map((item, index) => (
                <li key={index} className="text-sm flex gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20" data-testid="card-talking-points">
        <CardHeader>
          <CardTitle>1:1 Meeting Talking Points</CardTitle>
          <CardDescription>Suggested discussion topics for your next meeting</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.talkingPoints.map((point, index) => (
              <li key={index} className="flex gap-3">
                <span className="text-primary font-bold">{index + 1}.</span>
                <span className="text-base">{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
