import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CurrencyPairSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const CURRENCY_PAIRS = [
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'AUDUSD',
  'USDCAD',
  'NZDUSD',
  'USDCHF',
];

export const CurrencyPairSelector = ({ value, onChange }: CurrencyPairSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Select pair" />
      </SelectTrigger>
      <SelectContent>
        {CURRENCY_PAIRS.map((pair) => (
          <SelectItem key={pair} value={pair}>
            {pair}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
