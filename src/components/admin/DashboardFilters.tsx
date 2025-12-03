import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Download, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

type DashboardFiltersProps = {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  trendPeriod: "day" | "week";
  onTrendPeriodChange: (period: "day" | "week") => void;
};

export const DashboardFilters = ({
  dateRange,
  onDateRangeChange,
  onExportPDF,
  onExportExcel,
  trendPeriod,
  onTrendPeriodChange,
}: DashboardFiltersProps) => {
  const presetRanges = [
    { label: "Última semana", days: 7 },
    { label: "Último mes", days: 30 },
    { label: "Últimos 3 meses", days: 90 },
    { label: "Todo", days: 0 },
  ];

  const handlePreset = (days: number) => {
    if (days === 0) {
      onDateRangeChange({ from: undefined, to: undefined });
    } else {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - days);
      onDateRangeChange({ from, to });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Date Range Picker */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal min-w-[140px]",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: es }) : "Desde"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.from}
              onSelect={(date) => onDateRangeChange({ ...dateRange, from: date })}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground">-</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal min-w-[140px]",
                !dateRange.to && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: es }) : "Hasta"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.to}
              onSelect={(date) => onDateRangeChange({ ...dateRange, to: date })}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Preset Buttons */}
      <div className="flex gap-1">
        {presetRanges.map((preset) => (
          <Button
            key={preset.days}
            variant="ghost"
            size="sm"
            onClick={() => handlePreset(preset.days)}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Trend Period Selector */}
      <Select value={trendPeriod} onValueChange={(v) => onTrendPeriodChange(v as "day" | "week")}>
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Por día</SelectItem>
          <SelectItem value="week">Por semana</SelectItem>
        </SelectContent>
      </Select>

      {/* Export Buttons */}
      <div className="flex gap-2 ml-auto">
        <Button variant="outline" size="sm" onClick={onExportPDF}>
          <Download className="w-4 h-4 mr-2" />
          PDF
        </Button>
        <Button variant="outline" size="sm" onClick={onExportExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Excel
        </Button>
      </div>
    </div>
  );
};
