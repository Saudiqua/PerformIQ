import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  trend?: number;
  icon: LucideIcon;
  format?: "number" | "percentage" | "time";
  subtitle?: string;
}

export function MetricCard({ title, value, trend, icon: Icon, format = "number", subtitle }: MetricCardProps) {
  const formatValue = () => {
    if (format === "percentage") return `${value.toFixed(1)}%`;
    if (format === "time") return `${value.toFixed(1)}h`;
    return value.toFixed(0);
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend > 0) return "text-green-600 dark:text-green-400";
    if (trend < 0) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono" data-testid={`text-metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {formatValue()}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {getTrendIcon()}
            <span className={`text-xs font-medium ${getTrendColor()}`}>
              {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">vs last period</span>
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
