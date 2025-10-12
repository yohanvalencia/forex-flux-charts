import { Button } from './ui/button';

interface TimeframeSelectorProps {
  selected: string;
  onSelect: (timeframe: string) => void;
}

const TIMEFRAMES = ['1M', '5M', '15M', '1D'];

export const TimeframeSelector = ({ selected, onSelect }: TimeframeSelectorProps) => {
  return (
    <div className="flex gap-2">
      {TIMEFRAMES.map((tf) => (
        <Button
          key={tf}
          onClick={() => onSelect(tf)}
          variant={selected === tf ? 'default' : 'secondary'}
          size="sm"
          className="min-w-[60px]"
        >
          {tf}
        </Button>
      ))}
    </div>
  );
};
