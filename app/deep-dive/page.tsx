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
import { queryAIAgent } from "@/lib/api";
import { Send, ExternalLink, TrendingUp, Brain, AlertCircle } from "lucide-react";
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
  answer: string;
  tools_used: string[];
  chartData?: any[];
  sources?: string[];
  error?: string;
}

// Helper to extract chart data from tool results
function extractChartData(toolResults: Record<string, any>): any[] | null {
  // Check for forecasting results
  if (toolResults.run_forecasting) {
    const forecast = toolResults.run_forecasting;
    if (forecast.forecast_dates && forecast.forecast_values) {
      return forecast.forecast_dates.map((date: string, idx: number) => ({
        date: new Date(date).toLocaleDateString(),
        forecast: forecast.forecast_values[idx],
        low: forecast.confidence_intervals?.[idx]?.low,
        high: forecast.confidence_intervals?.[idx]?.high,
      }));
    }
  }

  // Check for correlation results (could visualize as a network)
  if (toolResults.find_correlations && toolResults.find_correlations.correlations?.length > 0) {
    // Return correlation data for potential visualization
    return toolResults.find_correlations.correlations;
  }

  return null;
}

export default function DeepDivePage() {
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState<QueryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  // Session-based conversation history (resets on page refresh)
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const currentQuery = query.trim();
    setQuery(""); // Clear input immediately
    setLoading(true);

    try {
      // Call the real AI agent with conversation history
      const result = await queryAIAgent(currentQuery, conversationHistory);

      // Extract chart data if available
      const chartData = result.tool_results ? extractChartData(result.tool_results) : null;

      const newResponse: QueryResponse = {
        id: Date.now().toString(),
        query: currentQuery,
        answer: result.answer,
        tools_used: result.tools_used,
        chartData: chartData || undefined,
        sources: result.sources.length > 0 ? result.sources : undefined,
        error: result.error,
      };

      setResponses([newResponse, ...responses]);
      
      // Update conversation history for next query
      setConversationHistory([
        ...conversationHistory,
        { role: "user", content: currentQuery },
        { role: "assistant", content: result.answer }
      ]);
    } catch (err) {
      console.error("Error querying agent:", err);

      // Add error response
      const errorResponse: QueryResponse = {
        id: Date.now().toString(),
        query: currentQuery,
        answer: err instanceof Error ? err.message : "Failed to process query. Please try again.",
        tools_used: [],
        error: err instanceof Error ? err.message : "Unknown error",
      };

      setResponses([errorResponse, ...responses]);
    } finally {
      setLoading(false);
    }
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
                        {response.tools_used && response.tools_used.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {response.tools_used.map((tool, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tool.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Error State */}
                      {response.error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <p className="font-semibold">Error processing query</p>
                          </div>
                        </div>
                      )}

                      {/* Answer Content */}
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap">{response.answer}</p>

                        {/* Chart (if chart data exists) */}
                        {response.chartData && (
                          <div className="my-6 p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-4">
                              <TrendingUp className="w-5 h-5 text-teal-600" />
                              <h3 className="font-semibold text-slate-900">Forecast Visualization</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart data={response.chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" stroke="#64748b" />
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
                                  dataKey="forecast"
                                  stroke="#3b82f6"
                                  strokeWidth={3}
                                  name="Forecast"
                                  dot={{ fill: "#3b82f6", r: 4 }}
                                />
                                {response.chartData[0]?.low && (
                                  <>
                                    <Line
                                      type="monotone"
                                      dataKey="low"
                                      stroke="#94a3b8"
                                      strokeWidth={1}
                                      strokeDasharray="3 3"
                                      name="Lower Bound"
                                      dot={false}
                                    />
                                    <Line
                                      type="monotone"
                                      dataKey="high"
                                      stroke="#94a3b8"
                                      strokeWidth={1}
                                      strokeDasharray="3 3"
                                      name="Upper Bound"
                                      dot={false}
                                    />
                                  </>
                                )}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* Sources (if research sources exist) */}
                        {response.sources && response.sources.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-slate-200">
                            <p className="text-sm font-semibold text-slate-700 mb-3">Sources:</p>
                            <div className="flex flex-wrap gap-2">
                              {response.sources.map((source, idx) => (
                                <a
                                  key={idx}
                                  href={source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs"
                                >
                                  <Badge variant="secondary" className="hover:bg-slate-200 cursor-pointer">
                                    Source {idx + 1}
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
