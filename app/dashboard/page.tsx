"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";
import { RefreshCw, TrendingUp, AlertCircle, Activity } from "lucide-react";
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

// Mock data - in production, this would come from the API
const mockHealthData = [
  { date: "Mon", sleep: 7.5, heartRate: 68 },
  { date: "Tue", sleep: 6.2, heartRate: 72 },
  { date: "Wed", sleep: 8.1, heartRate: 65 },
  { date: "Thu", sleep: 5.8, heartRate: 75 },
  { date: "Fri", sleep: 7.0, heartRate: 70 },
  { date: "Sat", sleep: 8.5, heartRate: 64 },
  { date: "Sun", sleep: 7.8, heartRate: 67 },
];

const mockInsights = [
  {
    id: "1",
    type: "anomaly",
    title: "Elevated Heart Rate Detected",
    description: "Your resting heart rate has been elevated for three consecutive days. This could be related to stress or changes in your routine.",
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    id: "2",
    type: "correlation",
    title: "Sleep-Diet Correlation Found",
    description: "We've noticed on days you get less than 6 hours of sleep, your craving for high-sugar foods increases by 40%.",
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: "3",
    type: "correlation",
    title: "Exercise Impact on Sleep",
    description: "Your sleep quality improves by 25% on days when you exercise for at least 30 minutes.",
    icon: Activity,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
];

export default function DashboardPage() {
  const [metric1, setMetric1] = useState("sleep");
  const [metric2, setMetric2] = useState("heartRate");
  const [insights, setInsights] = useState(mockInsights);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const handleRefreshInsights = async () => {
    setLoadingInsights(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoadingInsights(false);
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
                          <SelectItem value="sleep">Sleep Duration</SelectItem>
                          <SelectItem value="steps">Steps</SelectItem>
                          <SelectItem value="calories">Calories</SelectItem>
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
                          <SelectItem value="heartRate">Heart Rate</SelectItem>
                          <SelectItem value="weight">Weight</SelectItem>
                          <SelectItem value="bloodPressure">Blood Pressure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={mockHealthData}>
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
                      dataKey="sleep"
                      fill="#0d9488"
                      name="Sleep (hours)"
                      radius={[8, 8, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Heart Rate (bpm)"
                      dot={{ fill: "#3b82f6", r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
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
                    {insights.map((insight) => (
                      <motion.div key={insight.id} variants={staggerItem}>
                        <Card className="p-6 hover:shadow-lg transition-shadow">
                          <div className="flex gap-4">
                            <div className={`w-12 h-12 ${insight.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <insight.icon className={`w-6 h-6 ${insight.color}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                {insight.title}
                              </h3>
                              <p className="text-slate-600">{insight.description}</p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
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
