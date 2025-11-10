// Health Data Types
export interface HealthMetric {
  id: string;
  timestamp: string;
  value: number;
  unit: string;
  metricType: 'heart_rate' | 'sleep_duration' | 'steps' | 'calories' | 'weight';
}

export interface HealthData {
  userId: string;
  metrics: HealthMetric[];
  dateRange: {
    start: string;
    end: string;
  };
}

// Journal Entry Types
export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// AI Insight Types
export interface AIInsight {
  id: string;
  type: 'anomaly' | 'correlation' | 'forecast' | 'research';
  title: string;
  description: string;
  data?: any;
  sources?: string[];
  createdAt: string;
}

// Deep Dive Query Types
export interface DeepDiveQuery {
  query: string;
  timestamp: string;
}

export interface DeepDiveResponse {
  id: string;
  query: string;
  type: 'text' | 'chart' | 'research';
  content: string;
  chartData?: any;
  sources?: Array<{
    title: string;
    url: string;
  }>;
  timestamp: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  createdAt: string;
}
