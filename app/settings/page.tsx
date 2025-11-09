"use client";

import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { fadeInUp } from "@/lib/animations";
import { User, Database, Shield, LogOut, Activity } from "lucide-react";

export default function SettingsPage() {
  const { user, signOut } = useAuth();

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
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Settings</h1>
              <p className="text-slate-600">Manage your account and data sources</p>
            </motion.div>

            <div className="space-y-6">
              {/* Account Section */}
              <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-slate-900 mb-3">Account</h2>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Email</p>
                          <p className="text-slate-900 font-medium">{user?.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Account Status</p>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            Active
                          </Badge>
                        </div>
                        <div className="pt-3">
                          <Button
                            onClick={signOut}
                            variant="destructive"
                            className="gap-2"
                          >
                            <LogOut className="w-4 h-4" />
                            Log Out
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Data Sources Section */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-slate-900 mb-3">Data Sources</h2>
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Activity className="w-5 h-5 text-teal-600" />
                              <p className="font-medium text-slate-900">Sahha Sandbox</p>
                            </div>
                            <Badge variant="outline" className="bg-white">
                              Connected
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">
                            Health metrics including sleep, heart rate, steps, and more
                          </p>
                        </div>

                        <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg">
                          <p className="text-sm text-slate-600">
                            <strong>Note:</strong> This demo uses the Sahha Sandbox API to provide realistic mock health data.
                            In production, you would connect to real health data aggregators like Google Fit, Apple HealthKit,
                            or wearable devices.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Privacy & Security Section */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-slate-900 mb-3">
                        Privacy & Security
                      </h2>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">End-to-end encryption</p>
                            <p className="text-sm text-slate-600">Your health data is encrypted at rest and in transit</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">Zero data sharing</p>
                            <p className="text-sm text-slate-600">We never sell or share your personal health information</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">Full data ownership</p>
                            <p className="text-sm text-slate-600">You maintain complete control and ownership of your data</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Footer Info */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6 bg-slate-900 text-white">
                  <div className="text-center">
                    <p className="text-slate-300 mb-2">Axion Health v1.0.0</p>
                    <p className="text-sm text-slate-400">
                      Built for Palo Alto Networks R&D Hackathon
                    </p>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
