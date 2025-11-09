"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { Save, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface JournalEntry {
  id: string;
  date: Date;
  content: string;
}

// Mock existing entries
const mockEntries: JournalEntry[] = [
  {
    id: "1",
    date: new Date(2024, 10, 7),
    content: "Started my new running routine today. Felt great! Also noticed I slept better after avoiding caffeine past 2pm.",
  },
  {
    id: "2",
    date: new Date(2024, 10, 6),
    content: "Feeling a bit stressed with work deadlines. Heart rate seems higher than usual. Need to focus on breathing exercises.",
  },
  {
    id: "3",
    date: new Date(2024, 10, 5),
    content: "Great day! 8 hours of sleep, morning workout, and healthy meals. This is the baseline I want to maintain.",
  },
];

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [content, setContent] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>(mockEntries);
  const [saving, setSaving] = useState(false);

  const handleSaveEntry = async () => {
    if (!content.trim() || !selectedDate) return;

    setSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: selectedDate,
      content: content,
    };

    setEntries([newEntry, ...entries]);
    setContent("");
    setSaving(false);
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
                        <p className="text-slate-700 leading-relaxed">{entry.content}</p>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {entries.length === 0 && (
                <Card className="p-12 text-center">
                  <p className="text-slate-500">No journal entries yet. Start by creating your first entry above!</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
