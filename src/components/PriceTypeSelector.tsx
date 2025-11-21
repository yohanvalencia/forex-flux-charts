import { PriceType } from '@/types/websocket';
import { Button } from '@/components/ui/button';

interface PriceTypeSelectorProps {
  priceType: PriceType;
  onPriceTypeChange: (priceType: PriceType) => void;
}

export const PriceTypeSelector = ({ priceType, onPriceTypeChange }: PriceTypeSelectorProps) => {
  const priceTypes: PriceType[] = ['bid', 'mid', 'ask'];

  return (
    <div className="flex items-center gap-1 bg-card/50 rounded-lg p-1">
      {priceTypes.map((type) => (
        <Button
          key={type}
          variant={priceType === type ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onPriceTypeChange(type)}
          className="text-xs uppercase font-medium"
        >
          {type}
        </Button>
      ))}
    </div>
  );
};
