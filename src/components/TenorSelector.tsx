import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TenorSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const TENOR_VALUES = [
  { value: '0', label: 'SPOT' },
  { value: '1', label: 'D1' },
  { value: '2', label: 'W1' },
  { value: '3', label: 'W2' },
  { value: '4', label: 'W3' },
  { value: '5', label: 'M1' },
  { value: '6', label: 'M2' },
  { value: '7', label: 'M3' },
  { value: '8', label: 'M4' },
  { value: '9', label: 'M5' },
  { value: '10', label: 'M6' },
  { value: '11', label: 'M7' },
  { value: '12', label: 'M8' },
  { value: '13', label: 'M9' },
  { value: '14', label: 'M10' },
  { value: '15', label: 'M11' },
  { value: '16', label: 'M12' },
  { value: '17', label: 'M15' },
  { value: '18', label: 'M18' },
  { value: '19', label: 'Y1' },
  { value: '20', label: 'Y2' },
  { value: '21', label: 'Y3' },
  { value: '22', label: 'Y4' },
  { value: '23', label: 'Y5' },
  { value: '24', label: 'Y6' },
  { value: '25', label: 'Y7' },
  { value: '26', label: 'Y8' },
  { value: '27', label: 'Y9' },
  { value: '28', label: 'Y10' },
];

export const TenorSelector = ({ value, onChange }: TenorSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Select tenor" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {TENOR_VALUES.map((tenor) => (
          <SelectItem key={tenor.value} value={tenor.value}>
            {tenor.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
