import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface AIInsight {
  type: "anomaly" | "correlation" | "trend" | "summary" | "error";
  title: string;
  description: string;
  data?: any;
  timestamp?: string;
}

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Simple in-memory cache with TTL
class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache has expired
    const age = Date.now() - entry.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new APICache();

// Get auth token from Supabase session
async function getAuthToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error("No active session. Please log in.");
  }

  return session.access_token;
}

// Fetch health data from API
export async function fetchHealthData(days: number = 7): Promise<any> {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/health-data?days=${days}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch health data");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching health data:", error);
    throw error;
  }
}

// Get AI insights with caching
export async function getAIInsights(): Promise<{ insights: AIInsight[] }> {
  // Check cache first
  const cached = apiCache.get<{ insights: AIInsight[] }>("ai_insights");
  if (cached) {
    console.log("Returning cached AI insights");
    return cached;
  }

  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/agent/insights`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to generate insights");
    }

    const data = await response.json();

    // Cache the result
    apiCache.set("ai_insights", data);

    return data;
  } catch (error) {
    console.error("Error fetching insights:", error);
    throw error;
  }
}

// Fetch health scores from Sahha
export async function getHealthScores(days: number = 7): Promise<any> {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/health-scores?days=${days}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch health scores");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching health scores:", error);
    throw error;
  }
}

// Convert blood pressure "systolic/diastolic" format to numeric value for charting
function getBPNumericValue(
  bpString: string,
  part: "systolic" | "diastolic" = "systolic"
): number {
  if (typeof bpString !== "string") return 0;
  const parts = bpString.split("/");
  if (part === "systolic") {
    return parseInt(parts[0]) || 0;
  } else {
    return parseInt(parts[1]) || 0;
  }
}

// Get numeric value from any biomarker value
function getNumericValue(value: any, metricKey: string): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Handle blood pressure format (e.g., "120/80")
    if (metricKey === "blood_pressure") {
      return getBPNumericValue(value, "systolic");
    }
    // Try to parse as float
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Filter data by selected metrics and variant selection
export function filterChartData(
  formattedData: any[],
  selectedMetrics: string[],
  variantSelections: Record<string, string[]> = {}
): Record<string, any[]> {
  const filtered: Record<string, any[]> = {};

  selectedMetrics.forEach((metric) => {
    const selectedVariants = variantSelections[metric] || [metric];

    filtered[metric] = formattedData.map((entry) => {
      const newEntry: any = { date: entry.date };
      selectedVariants.forEach((variant) => {
        newEntry[variant] = entry[variant];
      });
      return newEntry;
    });
  });

  return filtered;
}

// Format health data for chart
export function formatHealthDataForChart(biomarkers: any[]): any[] {
  if (!biomarkers || !Array.isArray(biomarkers)) {
    return [];
  }

  // Group biomarkers by date and track multiple readings per metric
  const dataByDate: Map<string, any> = new Map();
  const countByDateAndKey: Map<string, Map<string, number>> = new Map();

  for (const biomarker of biomarkers) {
    const timestamp = biomarker.startDateTime || biomarker.timestamp;
    if (!timestamp) continue;

    const date = new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (!dataByDate.has(date)) {
      dataByDate.set(date, { date });
      countByDateAndKey.set(date, new Map());
    }

    const entry = dataByDate.get(date);
    const key = biomarker.type || "unknown";

    // Get numeric value (handles blood pressure format conversion)
    const value = getNumericValue(biomarker.value, key);

    // For metrics with multiple readings per day, calculate average
    const counter = countByDateAndKey.get(date)!;
    const existingValue = entry[key] || 0;
    const newCount = (counter.get(key) || 0) + 1;

    // Moving average: (existing_avg * old_count + new_value) / new_count
    entry[key] = (existingValue * (newCount - 1) + value) / newCount;
    counter.set(key, newCount);
  }

  // Sort by date
  return Array.from(dataByDate.values()).reverse();
}

// Check data completeness for a metric
export function getMetricCompleteness(
  data: any[],
  metricKey: string
): { complete: number; total: number; percentage: number } {
  if (!data || data.length === 0) {
    return { complete: 0, total: 0, percentage: 0 };
  }

  let complete = 0;
  const total = data.length;

  data.forEach((entry) => {
    if (entry[metricKey] !== undefined && entry[metricKey] !== null) {
      complete++;
    }
  });

  return {
    complete,
    total,
    percentage: total > 0 ? Math.round((complete / total) * 100) : 0,
  };
}

// Process a user query with the AI agent
export async function queryAIAgent(query: string, history?: Array<{role: string, content: string}>): Promise<any> {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/agent/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, history }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to process query");
    }

    return response.json();
  } catch (error) {
    console.error("Error processing query:", error);
    throw error;
  }
}

// Create journal entry
export async function createJournalEntry(entry: {
  date: string;
  content: string;
}): Promise<any> {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/journal`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create journal entry");
    }

    return response.json();
  } catch (error) {
    console.error("Error creating journal entry:", error);
    throw error;
  }
}

// Get journal entries
export async function getJournalEntries(): Promise<any> {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/journal`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch journal entries");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    throw error;
  }
}

// Delete journal entry
export async function deleteJournalEntry(entryId: string): Promise<any> {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/journal/${entryId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete journal entry");
    }

    return response.json();
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    throw error;
  }
}

// Search journal entries
export async function searchJournal(
  query: string,
  nResults: number = 5
): Promise<any> {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/journal/search`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, n_results: nResults }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to search journal");
    }

    return response.json();
  } catch (error) {
    console.error("Error searching journal:", error);
    throw error;
  }
}
