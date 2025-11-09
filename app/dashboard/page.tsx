"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";
import { fetchHealthData, getAIInsights, formatHealthDataForChart, type AIInsight } from "@/lib/api";
import { RefreshCw, TrendingUp, AlertCircle, Activity, Brain } from "lucide-react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Helper function to get insight icon and styling
function getInsightStyle(type: string) {
  const styles = {
    anomaly: {
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    correlation: {
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    trend: {
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    summary: {
      icon: Brain,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
    error: {
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  };
  return styles[type as keyof typeof styles] || styles.summary;
}

export default function DashboardPage() {
  const [metric1, setMetric1] = useState("sleep_duration");
  const [metric2, setMetric2] = useState("heart_rate");
  const [healthData, setHealthData] = useState<any[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine if initial page load is in progress
  const isInitialLoad = loadingHealth || loadingInsights;
  const loadingStage = loadingHealth ? "Loading health data..." : "Generating insights...";

  // Fetch health data on mount
  useEffect(() => {
    loadHealthData();
    loadInsights();
  }, []);

  const loadHealthData = async () => {
    try {
      setLoadingHealth(true);
      const response = await fetchHealthData(7);
      const formatted = formatHealthDataForChart(response.data);
      setHealthData(formatted);
      setError(null);
    } catch (err) {
      console.error("Error fetching health data:", err);
      setError(err instanceof Error ? err.message : "Failed to load health data");
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadInsights = async () => {
    try {
      setLoadingInsights(true);
      const response = await getAIInsights();
      setInsights(response.insights);
      setError(null);
    } catch (err) {
      console.error("Error fetching insights:", err);
      setError(err instanceof Error ? err.message : "Failed to load insights");
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleRefreshInsights = async () => {
    await loadInsights();
  };

  return (
    <ProtectedRoute>
      {/* Full-page loading overlay during initial load */}
      {isInitialLoad && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-8 text-center shadow-2xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {loadingStage}
            </h3>
            <p className="text-sm text-slate-600">
              This may take a few moments
            </p>
          </motion.div>
        </motion.div>
      )}

      <div className="flex h-screen bg-slate-50">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-8">
            {/* Header */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
              <p className="text-slate-600">Your unified health story at a glance</p>
            </motion.div>

            {/* Unified Health Story Chart */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Unified Health Story
                  </h2>
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm text-slate-600 block mb-1">Primary Metric</label>
                      <Select value={metric1} onValueChange={setMetric1}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sleep_duration">Sleep Duration</SelectItem>
                          <SelectItem value="steps">Steps</SelectItem>
                          <SelectItem value="active_calories">Active Calories</SelectItem>
                          <SelectItem value="active_hours">Active Hours</SelectItem>
                          <SelectItem value="floors_climbed">Floors Climbed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 block mb-1">Secondary Metric</label>
                      <Select value={metric2} onValueChange={setMetric2}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="heart_rate">Heart Rate</SelectItem>
                          <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                          <SelectItem value="respiratory_rate">Respiratory Rate</SelectItem>
                          <SelectItem value="hrv">Heart Rate Variability</SelectItem>
                          <SelectItem value="vo2_max">VO2 Max</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {loadingHealth ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : error ? (
                  <div className="h-[300px] flex items-center justify-center text-slate-600">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                      <p>{error}</p>
                      <Button onClick={loadHealthData} variant="outline" className="mt-4">
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : healthData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-slate-600">
                    <p>No health data available. Sync your data to get started.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={healthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" />
                      <YAxis yAxisId="left" stroke="#0d9488" />
                      <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey={metric1}
                        fill="#0d9488"
                        name={metric1.replace("_", " ")}
                        radius={[8, 8, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey={metric2}
                        stroke="#3b82f6"
                        strokeWidth={3}
                        name={metric2.replace("_", " ")}
                        dot={{ fill: "#3b82f6", r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </motion.div>

            {/* AI Insight Feed */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">AI Insight Feed</h2>
                <Button
                  onClick={handleRefreshInsights}
                  disabled={loadingInsights}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingInsights ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {loadingInsights ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6" />
                    </Card>
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <AnimatePresence>
                    {insights.length === 0 ? (
                      <Card className="p-12 text-center text-slate-600">
                        <Brain className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                        <p>No insights available yet. The AI is analyzing your data...</p>
                      </Card>
                    ) : (
                      insights.map((insight, index) => {
                        const style = getInsightStyle(insight.type);
                        const IconComponent = style.icon;

                        return (
                          <motion.div key={index} variants={staggerItem}>
                            <Card className="p-6 hover:shadow-lg transition-shadow">
                              <div className="flex gap-4">
                                <div className={`w-12 h-12 ${style.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                  <IconComponent className={`w-6 h-6 ${style.color}`} />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    {insight.title}
                                  </h3>
                                  <p className="text-slate-600 whitespace-pre-wrap">{insight.description}</p>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
