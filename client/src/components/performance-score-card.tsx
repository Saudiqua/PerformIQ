import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PerformanceScoreCardProps {
  score: number;
  trend: number;
  title?: string;
  "data-testid"?: string;
}

export function PerformanceScoreCard({ score, trend, title = "Performance Score", "data-testid": testId }: PerformanceScoreCardProps) {
  const getScoreColor = () => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBackground = () => {
    if (score >= 80) return "bg-green-50 dark:bg-green-950";
    if (score >= 60) return "bg-blue-50 dark:bg-blue-950";
    if (score >= 40) return "bg-yellow-50 dark:bg-yellow-950";
    return "bg-red-50 dark:bg-red-950";
  };

  return (
    <Card className={getScoreBackground()} data-testid={testId}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-6xl font-bold font-mono ${getScoreColor()}`} data-testid="text-performance-score">
              {score.toFixed(0)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">out of 100</p>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1 ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend >= 0 ? (
                <TrendingUp className="h-6 w-6" />
              ) : (
                <TrendingDown className="h-6 w-6" />
              )}
              <span className="text-2xl font-bold font-mono">
                {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs last month</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
