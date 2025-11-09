"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { createJournalEntry, getJournalEntries, type JournalEntry as APIJournalEntry } from "@/lib/api";
import { Save, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface JournalEntry {
  id: string;
  date: Date;
  content: string;
}

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [content, setContent] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load journal entries on mount
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await getJournalEntries();

      // Convert API entries to local format
      const formattedEntries: JournalEntry[] = response.entries.map((entry: APIJournalEntry) => ({
        id: entry.id,
        date: new Date(entry.date),
        content: entry.content,
      }));

      setEntries(formattedEntries);
      setError(null);
    } catch (err) {
      console.error("Error loading journal entries:", err);
      setError(err instanceof Error ? err.message : "Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!content.trim() || !selectedDate) return;

    setSaving(true);

    try {
      // Save to backend (triggers RAG ingestion)
      const response = await createJournalEntry({
        date: selectedDate.toISOString().split("T")[0], // YYYY-MM-DD format
        content: content.trim(),
      });

      // Add to local state
      const newEntry: JournalEntry = {
        id: response.entry.id,
        date: new Date(response.entry.date),
        content: response.entry.content,
      };

      setEntries([newEntry, ...entries]);
      setContent("");
      setError(null);
    } catch (err) {
      console.error("Error saving journal entry:", err);
      setError(err instanceof Error ? err.message : "Failed to save entry");
    } finally {
      setSaving(false);
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
          <div className="max-w-6xl mx-auto p-8">
            {/* Header */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Journal</h1>
              <p className="text-slate-600">
                Capture your daily experiences, symptoms, and observations
              </p>
            </motion.div>

            {/* Entry Creation Section */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <Card className="p-6 mb-8">
                <div className="grid md:grid-cols-[300px,1fr] gap-6">
                  {/* Calendar */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarIcon className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">Select Date</h3>
                    </div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                    />
                  </div>

                  {/* Entry Form */}
                  <div className="flex flex-col">
                    <div className="mb-4">
                      <h3 className="font-semibold text-slate-900 mb-2">
                        Entry for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "..."}
                      </h3>
                      <p className="text-sm text-slate-600">
                        How are you feeling today? Any notes on diet, stress, medications, or exercise?
                      </p>
                    </div>

                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Today I felt..."
                      className="flex-1 min-h-[200px] resize-none"
                    />

                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={handleSaveEntry}
                        disabled={!content.trim() || saving}
                        className="bg-teal-600 hover:bg-teal-700 gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? "Saving..." : "Save Entry"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Recent Entries */}
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">Recent Entries</h2>

              {error && (
                <Card className="p-4 mb-4 bg-red-50 border-red-200">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <p>{error}</p>
                  </div>
                </Card>
              )}

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6">
                      <Skeleton className="h-6 w-48 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6" />
                    </Card>
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-slate-500">No journal entries yet. Start by creating your first entry above!</p>
                </Card>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <AnimatePresence>
                    {entries.map((entry) => (
                      <motion.div
                        key={entry.id}
                        variants={staggerItem}
                        layout
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Card className="p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-teal-600" />
                              <span className="font-semibold text-slate-900">
                                {format(entry.date, "EEEE, MMMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
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
