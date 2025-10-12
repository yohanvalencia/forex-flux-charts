import { TrendingUp } from 'lucide-react';
import { TimeframeSelector } from './TimeframeSelector';

interface ChartHeaderProps {
  symbol: string;
  price: string;
  change: string;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export const ChartHeader = ({
  symbol,
  price,
  change,
  timeframe,
  onTimeframeChange,
}: ChartHeaderProps) => {
  const isPositive = change.startsWith('+');

  return (
    <div className="flex items-center justify-between p-6 border-b border-border">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{symbol}</h1>
            <p className="text-sm text-muted-foreground">Forex Trading Chart</p>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-foreground">{price}</span>
          <span className={`text-lg font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {change}
          </span>
        </div>
      </div>
      <TimeframeSelector selected={timeframe} onSelect={onTimeframeChange} />
    </div>
  );
};
