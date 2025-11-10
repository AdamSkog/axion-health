'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LineChart, BarChart3, TrendingUp } from 'lucide-react';

export type ChartType = 'line' | 'bar' | 'area';

interface ChartTypeSelectorProps {
  chartType: ChartType;
  onChange: (type: ChartType) => void;
}

export function ChartTypeSelector({ chartType, onChange }: ChartTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Chart Type</label>
      <ToggleGroup
        type="single"
        value={chartType}
        onValueChange={(value) => {
          if (value) onChange(value as ChartType);
        }}
        className="justify-start"
      >
        <ToggleGroupItem value="line" aria-label="Line chart">
          <LineChart className="h-4 w-4 mr-2" />
          Line
        </ToggleGroupItem>
        <ToggleGroupItem value="bar" aria-label="Bar chart">
          <BarChart3 className="h-4 w-4 mr-2" />
          Bar
        </ToggleGroupItem>
        <ToggleGroupItem value="area" aria-label="Area chart">
          <TrendingUp className="h-4 w-4 mr-2" />
          Area
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
