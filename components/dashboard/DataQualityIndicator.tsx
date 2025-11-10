'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle2, Database } from 'lucide-react';

interface DataQualityIndicatorProps {
  dataSource: 'sahha' | 'mock' | 'mixed';
  completeness: number; // 0-100 percentage
  metricsCount: number;
  daysOfData: number;
}

export function DataQualityIndicator({
  dataSource,
  completeness,
  metricsCount,
  daysOfData,
}: DataQualityIndicatorProps) {
  const getSourceInfo = (source: string) => {
    switch (source) {
      case 'sahha':
        return {
          label: 'Sahha API',
          color: 'bg-green-100 text-green-800',
          description: 'Real health data from Sahha',
          icon: CheckCircle2,
        };
      case 'mock':
        return {
          label: 'Demo Data',
          color: 'bg-amber-100 text-amber-800',
          description: 'Generated demo data for testing',
          icon: Database,
        };
      case 'mixed':
        return {
          label: 'Mixed',
          color: 'bg-blue-100 text-blue-800',
          description: 'Real and demo data combined',
          icon: Database,
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800',
          description: 'Data source unknown',
          icon: AlertCircle,
        };
    }
  };

  const sourceInfo = getSourceInfo(dataSource);
  const IconComponent = sourceInfo.icon;

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Data Quality</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`${sourceInfo.color} cursor-help`}>
                <IconComponent className="h-3 w-3 mr-1" />
                {sourceInfo.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{sourceInfo.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-3">
        {/* Completeness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Data Completeness</span>
            <span className="font-semibold text-gray-900">{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2" />
          {completeness < 70 && (
            <p className="text-xs text-amber-700">
              ⚠️ Some dates may have missing data
            </p>
          )}
        </div>

        {/* Metrics Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Metrics Tracked</span>
          <span className="font-semibold text-gray-900">{metricsCount}</span>
        </div>

        {/* Days of Data */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Days of Data</span>
          <span className="font-semibold text-gray-900">{daysOfData}</span>
        </div>
      </div>

      {dataSource === 'mock' && (
        <div className="rounded bg-amber-50 p-2 text-xs text-amber-800 border border-amber-200">
          💡 This is demo data. Connect to Sahha to see your real health data.
        </div>
      )}
    </div>
  );
}
