import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange({ from: range.from, to: range.to });
      setOpen(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            data-testid="button-date-range-picker"
            className={cn(
              "justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                  {format(dateRange.to, "MMM dd, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM dd, yyyy")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={{ from: dateRange?.from, to: dateRange?.to }}
            onSelect={handleSelect}
            numberOfMonths={2}
            data-testid="calendar-date-range"
          />
        </PopoverContent>
      </Popover>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const to = new Date();
            const from = new Date();
            from.setDate(from.getDate() - 30);
            onDateRangeChange({ from, to });
          }}
          data-testid="button-last-30-days"
        >
          Last 30 days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const to = new Date();
            const from = new Date();
            from.setDate(from.getDate() - 90);
            onDateRangeChange({ from, to });
          }}
          data-testid="button-last-90-days"
        >
          Last 90 days
        </Button>
      </div>
    </div>
  );
}
