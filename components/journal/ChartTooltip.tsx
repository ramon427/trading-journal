interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({ active, payload, label, formatter, labelFormatter }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const formattedLabel = labelFormatter ? labelFormatter(label || '') : label;

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/60 rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="px-3 py-2 border-b border-border/40 bg-muted/20">
        <p className="text-muted-foreground">{formattedLabel}</p>
      </div>
      <div className="px-3 py-2.5 space-y-1.5">
        {payload.map((entry, index) => {
          const value = formatter ? formatter(entry.value) : entry.value;
          const color = entry.color || entry.fill || entry.stroke;
          
          return (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-card" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <span className="tabular-nums">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
