"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeInUp, staggerItem } from "@/lib/animations";
import { Send, ExternalLink, TrendingUp, Brain } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface QueryResponse {
  id: string;
  query: string;
  type: "text" | "chart" | "research";
  content: string;
  chartData?: any[];
  sources?: Array<{ title: string; url: string }>;
}

// Mock forecast data
const mockForecastData = [
  { day: "Mon", actual: 68, forecast: null },
  { day: "Tue", actual: 72, forecast: null },
  { day: "Wed", actual: 70, forecast: null },
  { day: "Thu", actual: 75, forecast: null },
  { day: "Fri", actual: 73, forecast: null },
  { day: "Sat", actual: null, forecast: 71 },
  { day: "Sun", actual: null, forecast: 69 },
  { day: "Mon", actual: null, forecast: 70 },
];

const mockResponses: Record<string, QueryResponse> = {
  "tired": {
    id: "1",
    query: "Why was I so tired last Tuesday?",
    type: "text",
    content: "Based on your data, you were likely tired last Tuesday due to a combination of factors: Your journal entry mentions a 'stressful project deadline,' and your sleep data shows you only slept 4.5 hours that night. Additionally, your heart rate variability was 15% lower than your baseline, indicating elevated stress levels.",
  },
  "forecast": {
    id: "2",
    query: "Forecast my resting heart rate for the next week",
    type: "chart",
    content: "Based on ARIMA time-series analysis of your last 30 days of data, here's your predicted resting heart rate for the next 7 days. The model shows a slight downward trend, suggesting improved cardiovascular health.",
    chartData: mockForecastData,
  },
  "medication": {
    id: "3",
    query: "My heart rate is high, and I just started a new allergy medication. Is there a link?",
    type: "research",
    content: "Yes, there appears to be a link. Your data shows your resting heart rate became elevated by 8-10 bpm starting the same day you logged 'Started Zyrtec' in your journal. External research confirms that an increased heart rate (tachycardia) is a known, though uncommon, side effect of cetirizine (Zyrtec). This occurs in approximately 2-5% of users and is usually mild.",
    sources: [
      { title: "FDA - Cetirizine Side Effects", url: "https://www.fda.gov" },
      { title: "WebMD - Zyrtec Oral: Uses, Side Effects", url: "https://www.webmd.com" },
      { title: "Mayo Clinic - Antihistamines and Heart Rate", url: "https://www.mayoclinic.org" },
    ],
  },
};

export default function DeepDivePage() {
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState<QueryResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);

    // Simulate API call and intelligent response
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simple keyword matching for demo
    let response: QueryResponse;
    if (query.toLowerCase().includes("tired") || query.toLowerCase().includes("fatigue")) {
      response = mockResponses["tired"];
    } else if (query.toLowerCase().includes("forecast") || query.toLowerCase().includes("predict")) {
      response = mockResponses["forecast"];
    } else if (query.toLowerCase().includes("medication") || query.toLowerCase().includes("heart rate")) {
      response = mockResponses["medication"];
    } else {
      response = {
        id: Date.now().toString(),
        query: query,
        type: "text",
        content: "I've analyzed your health data and found some interesting patterns. This is a demo response. In production, the AI agent would call various tools (anomaly detection, correlation analysis, journal search, and external research) to provide a comprehensive answer.",
      };
    }

    setResponses([{ ...response, query }, ...responses]);
    setQuery("");
    setLoading(false);
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Header */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900">Deep Dive</h1>
                  <p className="text-slate-600">Ask anything about your health data</p>
                </div>
              </div>
            </motion.div>

            {/* Query Input */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-8">
              <Card className="p-6">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a question... (e.g., 'Why was I tired last Tuesday?' or 'Forecast my heart rate')"
                    className="flex-1 text-lg"
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="bg-teal-600 hover:bg-teal-700 gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? "Thinking..." : "Ask"}
                  </Button>
                </form>
              </Card>
            </motion.div>

            {/* Example Queries */}
            {responses.length === 0 && !loading && (
              <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                <div className="mb-8">
                  <p className="text-sm text-slate-600 mb-3">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Why was I so tired last Tuesday?",
                      "Forecast my resting heart rate",
                      "Is my new medication affecting my heart rate?",
                    ].map((example) => (
                      <Badge
                        key={example}
                        variant="outline"
                        className="cursor-pointer hover:bg-slate-100"
                        onClick={() => setQuery(example)}
                      >
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Loading State */}
            {loading && (
              <Card className="p-6 mb-4">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
                <Skeleton className="h-4 w-4/6" />
              </Card>
            )}

            {/* Responses Feed */}
            <div className="space-y-6">
              <AnimatePresence>
                {responses.map((response) => (
                  <motion.div
                    key={response.id}
                    variants={staggerItem}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="p-6">
                      {/* Query */}
                      <div className="mb-4 pb-4 border-b border-slate-200">
                        <p className="text-lg font-semibold text-slate-900">{response.query}</p>
                      </div>

                      {/* Answer Content */}
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed mb-4">{response.content}</p>

                        {/* Chart (if type is chart) */}
                        {response.type === "chart" && response.chartData && (
                          <div className="my-6 p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-4">
                              <TrendingUp className="w-5 h-5 text-teal-600" />
                              <h3 className="font-semibold text-slate-900">Forecast Visualization</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart data={response.chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="day" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="actual"
                                  stroke="#0d9488"
                                  strokeWidth={3}
                                  name="Actual"
                                  dot={{ fill: "#0d9488", r: 4 }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="forecast"
                                  stroke="#3b82f6"
                                  strokeWidth={3}
                                  strokeDasharray="5 5"
                                  name="Forecast"
                                  dot={{ fill: "#3b82f6", r: 4 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* Sources (if type is research) */}
                        {response.type === "research" && response.sources && (
                          <div className="mt-6 pt-4 border-t border-slate-200">
                            <p className="text-sm font-semibold text-slate-700 mb-3">Sources:</p>
                            <div className="flex flex-wrap gap-2">
                              {response.sources.map((source, idx) => (
                                <a
                                  key={idx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs"
                                >
                                  <Badge variant="secondary" className="hover:bg-slate-200 cursor-pointer">
                                    {source.title}
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </Badge>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
