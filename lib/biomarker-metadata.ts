/**
 * Biomarker Metadata System
 * Defines metadata for all 42+ biomarkers with display names, units, normal ranges, and chart preferences
 */

export type BiomarkerCategory = 'activity' | 'body' | 'sleep' | 'vitals';
export type ChartType = 'line' | 'bar' | 'area';

export interface BiomarkerMetadata {
  key: string;                          // Data key used in API responses
  label: string;                        // Display name for UI
  category: BiomarkerCategory;          // Category for grouping
  unit: string;                         // Unit of measurement
  preferredChart: ChartType;            // Recommended chart type
  normalRange?: [number, number];       // Min and max normal values
  variants?: string[];                  // Related metric variants
  aggregateOf?: string[];               // If computed from other metrics
  description?: string;                 // User-friendly description
}

// Color palette for charts (used across all variants)
export const CHART_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

// Comprehensive metadata for all biomarkers
export const BIOMARKER_METADATA: Record<string, BiomarkerMetadata> = {
  // ============ ACTIVITY METRICS (10) ============
  steps: {
    key: 'steps',
    label: 'Daily Steps',
    category: 'activity',
    unit: 'steps',
    preferredChart: 'bar',
    normalRange: [5000, 10000],
    description: 'Number of steps taken per day'
  },
  floors_climbed: {
    key: 'floors_climbed',
    label: 'Floors Climbed',
    category: 'activity',
    unit: 'floors',
    preferredChart: 'bar',
    normalRange: [5, 20],
    description: 'Number of floors climbed per day'
  },
  active_hours: {
    key: 'active_hours',
    label: 'Active Hours',
    category: 'activity',
    unit: 'hours',
    preferredChart: 'line',
    normalRange: [2, 6],
    description: 'Hours of active movement per day'
  },
  active_duration: {
    key: 'active_duration',
    label: 'Active Duration',
    category: 'activity',
    unit: 'minutes',
    preferredChart: 'line',
    normalRange: [30, 240],
    description: 'Total minutes of active movement'
  },
  activity_low_intensity_duration: {
    key: 'activity_low_intensity_duration',
    label: 'Low Intensity Duration',
    category: 'activity',
    unit: 'minutes',
    preferredChart: 'bar',
    normalRange: [60, 180],
    description: 'Minutes of low-intensity activity'
  },
  activity_medium_intensity_duration: {
    key: 'activity_medium_intensity_duration',
    label: 'Medium Intensity Duration',
    category: 'activity',
    unit: 'minutes',
    preferredChart: 'bar',
    normalRange: [20, 90],
    description: 'Minutes of moderate-intensity activity'
  },
  activity_high_intensity_duration: {
    key: 'activity_high_intensity_duration',
    label: 'High Intensity Duration',
    category: 'activity',
    unit: 'minutes',
    preferredChart: 'bar',
    normalRange: [0, 60],
    description: 'Minutes of vigorous-intensity activity'
  },
  activity_sedentary_duration: {
    key: 'activity_sedentary_duration',
    label: 'Sedentary Duration',
    category: 'activity',
    unit: 'minutes',
    preferredChart: 'bar',
    normalRange: [300, 600],
    description: 'Minutes spent sedentary (sitting/lying)'
  },
  active_energy_burned: {
    key: 'active_energy_burned',
    label: 'Active Calories',
    category: 'activity',
    unit: 'kcal',
    preferredChart: 'bar',
    normalRange: [300, 800],
    description: 'Calories burned through activity'
  },
  total_energy_burned: {
    key: 'total_energy_burned',
    label: 'Total Calories Burned',
    category: 'activity',
    unit: 'kcal',
    preferredChart: 'line',
    normalRange: [2000, 3000],
    description: 'Total daily energy expenditure'
  },

  // ============ BODY METRICS (8) ============
  height: {
    key: 'height',
    label: 'Height',
    category: 'body',
    unit: 'cm',
    preferredChart: 'line',
    description: 'Body height'
  },
  weight: {
    key: 'weight',
    label: 'Weight',
    category: 'body',
    unit: 'kg',
    preferredChart: 'line',
    normalRange: [50, 100],
    description: 'Body weight'
  },
  body_mass_index: {
    key: 'body_mass_index',
    label: 'BMI',
    category: 'body',
    unit: 'kg/m²',
    preferredChart: 'line',
    normalRange: [18.5, 24.9],
    description: 'Body Mass Index'
  },
  body_fat: {
    key: 'body_fat',
    label: 'Body Fat %',
    category: 'body',
    unit: '%',
    preferredChart: 'line',
    normalRange: [15, 25],
    description: 'Percentage of body fat'
  },
  fat_mass: {
    key: 'fat_mass',
    label: 'Fat Mass',
    category: 'body',
    unit: 'kg',
    preferredChart: 'line',
    description: 'Total fat mass'
  },
  lean_mass: {
    key: 'lean_mass',
    label: 'Lean Mass',
    category: 'body',
    unit: 'kg',
    preferredChart: 'line',
    description: 'Total lean body mass'
  },
  waist_circumference: {
    key: 'waist_circumference',
    label: 'Waist Circumference',
    category: 'body',
    unit: 'cm',
    preferredChart: 'line',
    normalRange: [70, 100],
    description: 'Waist circumference measurement'
  },
  resting_energy_burned: {
    key: 'resting_energy_burned',
    label: 'Resting Calories',
    category: 'body',
    unit: 'kcal',
    preferredChart: 'line',
    normalRange: [1500, 1800],
    description: 'Calories burned at rest (basal metabolic rate)'
  },

  // ============ SLEEP METRICS (9) ============
  sleep_duration: {
    key: 'sleep_duration',
    label: 'Sleep Duration',
    category: 'sleep',
    unit: 'hours',
    preferredChart: 'line',
    normalRange: [7, 9],
    description: 'Total hours of sleep'
  },
  sleep_debt: {
    key: 'sleep_debt',
    label: 'Sleep Debt',
    category: 'sleep',
    unit: 'hours',
    preferredChart: 'line',
    description: 'Accumulated sleep deficit'
  },
  sleep_interruptions: {
    key: 'sleep_interruptions',
    label: 'Sleep Interruptions',
    category: 'sleep',
    unit: 'count',
    preferredChart: 'bar',
    normalRange: [0, 2],
    description: 'Number of times sleep was interrupted'
  },
  sleep_in_bed_duration: {
    key: 'sleep_in_bed_duration',
    label: 'Time in Bed',
    category: 'sleep',
    unit: 'hours',
    preferredChart: 'line',
    description: 'Total time spent in bed'
  },
  sleep_awake_duration: {
    key: 'sleep_awake_duration',
    label: 'Awake Duration',
    category: 'sleep',
    unit: 'hours',
    preferredChart: 'line',
    description: 'Time spent awake while in bed'
  },
  sleep_light_duration: {
    key: 'sleep_light_duration',
    label: 'Light Sleep',
    category: 'sleep',
    unit: 'hours',
    preferredChart: 'bar',
    description: 'Time spent in light sleep stage'
  },
  sleep_rem_duration: {
    key: 'sleep_rem_duration',
    label: 'REM Sleep',
    category: 'sleep',
    unit: 'hours',
    preferredChart: 'bar',
    normalRange: [1, 2.5],
    description: 'Time spent in REM (dreaming) sleep'
  },
  sleep_deep_duration: {
    key: 'sleep_deep_duration',
    label: 'Deep Sleep',
    category: 'sleep',
    unit: 'hours',
    preferredChart: 'bar',
    normalRange: [1, 2],
    description: 'Time spent in deep restorative sleep'
  },
  sleep_efficiency: {
    key: 'sleep_efficiency',
    label: 'Sleep Efficiency',
    category: 'sleep',
    unit: '%',
    preferredChart: 'line',
    normalRange: [80, 95],
    description: 'Percentage of time in bed actually spent sleeping'
  },

  // ============ VITAL METRICS (15) ============
  heart_rate: {
    key: 'heart_rate',
    label: 'Heart Rate',
    category: 'vitals',
    unit: 'bpm',
    preferredChart: 'line',
    normalRange: [60, 100],
    variants: ['heart_rate_resting', 'heart_rate_sleep'],
    aggregateOf: ['heart_rate_resting', 'heart_rate_sleep'],
    description: 'Average heart rate (computed from resting + sleep)'
  },
  heart_rate_resting: {
    key: 'heart_rate_resting',
    label: 'Resting Heart Rate',
    category: 'vitals',
    unit: 'bpm',
    preferredChart: 'line',
    normalRange: [55, 70],
    description: 'Heart rate while at rest'
  },
  heart_rate_sleep: {
    key: 'heart_rate_sleep',
    label: 'Sleep Heart Rate',
    category: 'vitals',
    unit: 'bpm',
    preferredChart: 'line',
    normalRange: [50, 65],
    description: 'Heart rate during sleep'
  },
  heart_rate_variability_sdnn: {
    key: 'heart_rate_variability_sdnn',
    label: 'HRV (SDNN)',
    category: 'vitals',
    unit: 'ms',
    preferredChart: 'line',
    normalRange: [20, 60],
    variants: ['heart_rate_variability_rmssd'],
    description: 'Heart rate variability (standard deviation)'
  },
  heart_rate_variability_rmssd: {
    key: 'heart_rate_variability_rmssd',
    label: 'HRV (RMSSD)',
    category: 'vitals',
    unit: 'ms',
    preferredChart: 'line',
    normalRange: [15, 80],
    description: 'Heart rate variability (root mean square)'
  },
  respiratory_rate: {
    key: 'respiratory_rate',
    label: 'Respiratory Rate',
    category: 'vitals',
    unit: 'breaths/min',
    preferredChart: 'line',
    normalRange: [12, 20],
    description: 'Breathing rate during normal activity'
  },
  respiratory_rate_sleep: {
    key: 'respiratory_rate_sleep',
    label: 'Sleep Respiratory Rate',
    category: 'vitals',
    unit: 'breaths/min',
    preferredChart: 'line',
    normalRange: [10, 16],
    description: 'Breathing rate during sleep'
  },
  oxygen_saturation: {
    key: 'oxygen_saturation',
    label: 'O2 Saturation',
    category: 'vitals',
    unit: '%',
    preferredChart: 'line',
    normalRange: [95, 99],
    description: 'Blood oxygen saturation level'
  },
  oxygen_saturation_sleep: {
    key: 'oxygen_saturation_sleep',
    label: 'O2 Saturation (Sleep)',
    category: 'vitals',
    unit: '%',
    preferredChart: 'line',
    normalRange: [94, 98],
    description: 'Blood oxygen saturation during sleep'
  },
  vo2_max: {
    key: 'vo2_max',
    label: 'VO2 Max',
    category: 'vitals',
    unit: 'mL/kg/min',
    preferredChart: 'line',
    normalRange: [35, 55],
    description: 'Maximum oxygen consumption during exercise'
  },
  blood_glucose: {
    key: 'blood_glucose',
    label: 'Blood Glucose',
    category: 'vitals',
    unit: 'mg/dL',
    preferredChart: 'line',
    normalRange: [70, 100],
    description: 'Blood glucose level'
  },
  blood_pressure_systolic: {
    key: 'blood_pressure_systolic',
    label: 'Blood Pressure (Systolic)',
    category: 'vitals',
    unit: 'mmHg',
    preferredChart: 'line',
    normalRange: [90, 120],
    variants: ['blood_pressure_diastolic'],
    description: 'Systolic blood pressure (top number)'
  },
  blood_pressure_diastolic: {
    key: 'blood_pressure_diastolic',
    label: 'Blood Pressure (Diastolic)',
    category: 'vitals',
    unit: 'mmHg',
    preferredChart: 'line',
    normalRange: [60, 80],
    description: 'Diastolic blood pressure (bottom number)'
  },
  body_temperature_basal: {
    key: 'body_temperature_basal',
    label: 'Basal Body Temp',
    category: 'vitals',
    unit: '°C',
    preferredChart: 'line',
    normalRange: [36.5, 37.5],
    description: 'Body temperature at rest'
  },
  skin_temperature_sleep: {
    key: 'skin_temperature_sleep',
    label: 'Skin Temp (Sleep)',
    category: 'vitals',
    unit: '°C',
    preferredChart: 'line',
    normalRange: [33, 34],
    description: 'Skin temperature during sleep'
  },
};

/**
 * Get all biomarkers for a specific category
 */
export function getBiomarkersByCategory(
  category: BiomarkerCategory
): BiomarkerMetadata[] {
  return Object.values(BIOMARKER_METADATA).filter(
    (bm) => bm.category === category
  );
}

/**
 * Get all biomarkers grouped by category
 */
export function getBiomarkersGroupedByCategory(): Record<
  BiomarkerCategory,
  BiomarkerMetadata[]
> {
  return {
    activity: getBiomarkersByCategory('activity'),
    body: getBiomarkersByCategory('body'),
    sleep: getBiomarkersByCategory('sleep'),
    vitals: getBiomarkersByCategory('vitals'),
  };
}

/**
 * Get category label for display
 */
export function getCategoryLabel(category: BiomarkerCategory): string {
  const labels: Record<BiomarkerCategory, string> = {
    activity: '🏃 Activity',
    body: '⚖️ Body',
    sleep: '😴 Sleep',
    vitals: '❤️ Vitals',
  };
  return labels[category];
}

/**
 * Check if a metric has data in a dataset
 */
export function hasDataForMetric(data: any[], metricKey: string): boolean {
  if (!data || !Array.isArray(data)) return false;
  return data.some((entry) => entry[metricKey] !== undefined && entry[metricKey] !== null);
}

/**
 * Get all metrics that have data in a dataset
 */
export function getAvailableMetrics(data: any[]): string[] {
  if (!data || !Array.isArray(data)) return [];
  const metrics = new Set<string>();
  data.forEach((entry) => {
    Object.keys(entry).forEach((key) => {
      if (key !== 'date' && entry[key] !== undefined && entry[key] !== null) {
        metrics.add(key);
      }
    });
  });
  return Array.from(metrics);
}

/**
 * Find metrics with most complete data (fewest missing values)
 */
export function getMetricsWithMostData(data: any[], count: number = 2): string[] {
  if (!data || !Array.isArray(data)) return [];

  const metricCompleteness: Record<string, number> = {};

  data.forEach((entry) => {
    Object.keys(entry).forEach((key) => {
      if (key !== 'date') {
        if (!metricCompleteness[key]) metricCompleteness[key] = 0;
        if (entry[key] !== undefined && entry[key] !== null) {
          metricCompleteness[key]++;
        }
      }
    });
  });

  return Object.entries(metricCompleteness)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([metric]) => metric);
}
