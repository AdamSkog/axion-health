"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";
import {
  fetchHealthData,
  getAIInsights,
  formatHealthDataForChart,
  getMetricCompleteness,
  type AIInsight,
} from "@/lib/api";
import {
  BIOMARKER_METADATA,
  getMetricsWithMostData,
  CHART_COLORS,
  type ChartType,
} from "@/lib/biomarker-metadata";
import { MetricSelector } from "@/components/dashboard/MetricSelector";
import { ChartTypeSelector } from "@/components/dashboard/ChartTypeSelector";
import { VariantToggle } from "@/components/dashboard/VariantToggle";
import { DataQualityIndicator } from "@/components/dashboard/DataQualityIndicator";
import { RefreshCw, AlertCircle, Brain } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
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
      icon: AlertCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    trend: {
      icon: AlertCircle,
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
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [chartType, setChartType] = useState<ChartType>("line");
  const [variantSelections, setVariantSelections] = useState<
    Record<string, string[]>
  >({});
  const [healthData, setHealthData] = useState<any[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"sahha" | "mock" | "mixed">(
    "mock"
  );

  // Determine if initial page load is in progress
  const isInitialLoad = loadingHealth || loadingInsights;
  const loadingStage = loadingHealth
    ? "Loading health data..."
    : "Generating insights...";

  // Fetch health data on mount
  useEffect(() => {
    loadHealthData();
    loadInsights();
  }, []);

  // Set smart defaults when data loads
  useEffect(() => {
    if (healthData.length > 0 && selectedMetrics.length === 0) {
      const defaultMetrics = getMetricsWithMostData(healthData, 2);
      setSelectedMetrics(defaultMetrics);

      // Initialize variant selections
      const variants: Record<string, string[]> = {};
      defaultMetrics.forEach((metric) => {
        const metadata = BIOMARKER_METADATA[metric];
        if (metadata?.variants) {
          variants[metric] = [metric];
        }
      });
      setVariantSelections(variants);
    }
  }, [healthData, selectedMetrics.length]);

  const loadHealthData = async () => {
    try {
      setLoadingHealth(true);
      const response = await fetchHealthData(30); // Increased to 30 days for forecasting (needs 14+ days)
      const formatted = formatHealthDataForChart(response.data);
      setHealthData(formatted);
      // Always display as Sahha for demo purposes
      setDataSource("sahha");
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
      setError(
        err instanceof Error ? err.message : "Failed to load insights"
      );
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleRefreshInsights = async () => {
    await loadInsights();
  };

  // Calculate data completeness and metric count
  const dataCompleteness = useMemo(() => {
    if (selectedMetrics.length === 0 || healthData.length === 0) return 0;

    const totalPossibleValues =
      selectedMetrics.length * healthData.length;
    let filledValues = 0;

    selectedMetrics.forEach((metric) => {
      const variants =
        variantSelections[metric] || [metric];
      variants.forEach((variant) => {
        healthData.forEach((entry) => {
          if (
            entry[variant] !== undefined &&
            entry[variant] !== null
          ) {
            filledValues++;
          }
        });
      });
    });

    return Math.round((filledValues / totalPossibleValues) * 100);
  }, [selectedMetrics, healthData, variantSelections]);

  // Render chart based on selected type
  const renderChart = () => {
    if (!healthData || healthData.length === 0 || selectedMetrics.length === 0) {
      return (
        <div className="h-[400px] flex items-center justify-center text-slate-600">
          <p>Select metrics to display</p>
        </div>
      );
    }

    const metricsToShow = selectedMetrics.flatMap((metric) => {
      const variants = variantSelections[metric] || [metric];
      return variants;
    });

    const commonProps = {
      data: healthData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const lineProps = {
      type: "monotone" as const,
      strokeWidth: 2,
      dot: { r: 3 },
    };

    const barProps = {
      radius: [8, 8, 0, 0] as [number, number, number, number],
      isAnimationActive: true,
    };

    const areaProps = {
      type: "monotone" as const,
      strokeWidth: 2,
      fillOpacity: 0.3,
    };

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
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
              <Legend />
              {metricsToShow.map((metric, idx) => (
                <Line
                  key={metric}
                  dataKey={metric}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  name={BIOMARKER_METADATA[metric]?.label || metric}
                  {...lineProps}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
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
              <Legend />
              {metricsToShow.map((metric, idx) => (
                <Bar
                  key={metric}
                  dataKey={metric}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  name={BIOMARKER_METADATA[metric]?.label || metric}
                  {...barProps}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
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
              <Legend />
              {metricsToShow.map((metric, idx) => (
                <Area
                  key={metric}
                  dataKey={metric}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  name={BIOMARKER_METADATA[metric]?.label || metric}
                  {...areaProps}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const handleVariantChange = (metric: string, variants: string[]) => {
    setVariantSelections({
      ...variantSelections,
      [metric]: variants,
    });
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
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Dashboard
              </h1>
              <p className="text-slate-600">
                Your unified health story at a glance
              </p>
            </motion.div>

            {/* Unified Health Story */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Unified Health Story
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {/* Left: Metric Selection */}
                  <div className="col-span-1 border-r border-gray-200 pr-6">
                    <MetricSelector
                      selectedMetrics={selectedMetrics}
                      onMetricsChange={setSelectedMetrics}
                      availableData={healthData}
                      maxMetrics={4}
                    />

                    <div className="mt-6 space-y-4">
                      <ChartTypeSelector
                        chartType={chartType}
                        onChange={setChartType}
                      />
                    </div>

                    {/* Data Quality */}
                    <div className="mt-6">
                      <DataQualityIndicator
                        dataSource={dataSource}
                        completeness={dataCompleteness}
                        metricsCount={selectedMetrics.length}
                        daysOfData={healthData.length}
                      />
                    </div>
                  </div>

                  {/* Middle: Chart */}
                  <div className="col-span-2">
                    {loadingHealth ? (
                      <div className="h-[400px] flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : error ? (
                      <div className="h-[400px] flex items-center justify-center text-slate-600">
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                          <p>{error}</p>
                          <Button
                            onClick={loadHealthData}
                            variant="outline"
                            className="mt-4"
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>{renderChart()}</>
                    )}
                  </div>
                </div>

                {/* Variant Toggles */}
                {selectedMetrics.length > 0 && (
                  <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
                    {selectedMetrics.map((metric) => {
                      const metadata = BIOMARKER_METADATA[metric];
                      if (!metadata?.variants) return null;

                      return (
                        <VariantToggle
                          key={metric}
                          metric={metric}
                          variants={metadata.variants}
                          selectedVariants={variantSelections[metric] || [metric]}
                          onChange={(variants) =>
                            handleVariantChange(metric, variants)
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* AI Insight Feed */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">
                  AI Insight Feed
                </h2>
                <Button
                  onClick={handleRefreshInsights}
                  disabled={loadingInsights}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loadingInsights ? "animate-spin" : ""}`}
                  />
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
                        <p>
                          No insights available yet. The AI is analyzing your
                          data...
                        </p>
                      </Card>
                    ) : (
                      insights.map((insight, index) => {
                        const style = getInsightStyle(insight.type);
                        const IconComponent = style.icon;

                        return (
                          <motion.div key={index} variants={staggerItem}>
                            <Card className="p-6 hover:shadow-lg transition-shadow">
                              <div className="flex gap-4">
                                <div
                                  className={`w-12 h-12 ${style.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
                                >
                                  <IconComponent
                                    className={`w-6 h-6 ${style.color}`}
                                  />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    {insight.title}
                                  </h3>
                                  <p className="text-slate-600 whitespace-pre-wrap">
                                    {insight.description}
                                  </p>
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
