import { GemPreset, getAllGems, getGemInstructions } from '@/services/gemini.service';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles } from 'lucide-react';

interface GemSelectorProps {
  selectedGem: GemPreset | null;
  onSelect: (gem: GemPreset) => void;
  disabled?: boolean;
}

const gemLabels: Record<GemPreset, string> = {
  aggressive: 'Aggressive Negotiation',
  riskAverse: 'Risk-Averse Review',
  saas: 'SaaS-Focused',
  vendor: 'Vendor Perspective',
  customer: 'Customer Perspective',
  balanced: 'Balanced Review'
};

export const GemSelector = ({ selectedGem, onSelect, disabled }: GemSelectorProps) => {
  const gems = getAllGems();

  return (
    <div className="flex items-center gap-2">
      <Sparkles className="w-5 h-5 text-accent shrink-0" />
      <Select
        value={selectedGem || 'balanced'}
        onValueChange={(value) => onSelect(value as GemPreset)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select review strategy" />
        </SelectTrigger>
        <SelectContent>
          {gems.map((gem) => (
            <SelectItem key={gem} value={gem}>
              {gemLabels[gem]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
