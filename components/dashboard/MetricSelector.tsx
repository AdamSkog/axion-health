'use client';

import {
  BIOMARKER_METADATA,
  getBiomarkersGroupedByCategory,
  getCategoryLabel,
  hasDataForMetric,
  type BiomarkerCategory,
} from '@/lib/biomarker-metadata';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMemo } from 'react';

interface MetricSelectorProps {
  selectedMetrics: string[];
  onMetricsChange: (metrics: string[]) => void;
  availableData: any[];
  maxMetrics?: number;
}

export function MetricSelector({
  selectedMetrics,
  onMetricsChange,
  availableData,
  maxMetrics = 4,
}: MetricSelectorProps) {
  const filteredMetrics = useMemo(() => {
    const biomarkersGrouped = getBiomarkersGroupedByCategory();
    const filtered: Record<BiomarkerCategory, typeof biomarkersGrouped['activity']> = {
      activity: [],
      body: [],
      sleep: [],
      vitals: [],
    };

    (Object.keys(biomarkersGrouped) as BiomarkerCategory[]).forEach((category) => {
      filtered[category] = biomarkersGrouped[category].filter((bm) => {
        return hasDataForMetric(availableData, bm.key);
      });
    });

    return filtered;
  }, [availableData]);

  const handleMetricSelect = (metricKey: string) => {
    if (selectedMetrics.includes(metricKey)) {
      // Remove metric
      onMetricsChange(selectedMetrics.filter((m) => m !== metricKey));
    } else {
      // Add metric (respect maxMetrics limit)
      if (selectedMetrics.length < maxMetrics) {
        onMetricsChange([...selectedMetrics, metricKey]);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Select Metrics ({selectedMetrics.length}/{maxMetrics})
        </label>
        <Select onValueChange={handleMetricSelect}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Click to add metric..." />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(getBiomarkersGroupedByCategory()) as BiomarkerCategory[]).map((category) => {
              const metrics = filteredMetrics[category];
              if (metrics.length === 0) return null;

              return (
                <SelectGroup key={category}>
                  <SelectLabel className="font-semibold">
                    {getCategoryLabel(category)}
                  </SelectLabel>
                  {metrics.map((biomarker) => (
                    <SelectItem
                      key={biomarker.key}
                      value={biomarker.key}
                    >
                      <span
                        className={`flex items-center gap-2 ${
                          selectedMetrics.includes(biomarker.key)
                            ? 'font-semibold'
                            : ''
                        }`}
                      >
                        {selectedMetrics.includes(biomarker.key) && '✓ '}
                        {biomarker.label}
                        <span className="text-xs text-gray-500">
                          ({biomarker.unit})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {selectedMetrics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMetrics.map((metricKey) => {
            const metadata = BIOMARKER_METADATA[metricKey];
            return (
              <div
                key={metricKey}
                className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                <span>{metadata?.label || metricKey}</span>
                <button
                  onClick={() => handleMetricSelect(metricKey)}
                  className="ml-1 hover:font-bold"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedMetrics.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          Select up to {maxMetrics} metrics to display
        </p>
      )}
    </div>
  );
}
