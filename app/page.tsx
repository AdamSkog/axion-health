"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimatedSection } from "@/components/AnimatedSection";
import { fadeInUp, scaleOnHover } from "@/lib/animations";
import {
  Activity,
  Brain,
  Shield,
  TrendingUp,
  Heart,
  BarChart3
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6">
            Health Telemetry,{" "}
            <span className="text-teal-600">Reimagined</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
            Stop drowning in data. Start understanding your health. Axion Health
            unifies your fitness, sleep, and nutrition data into one clear story,
            powered by your personal AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div {...scaleOnHover}>
              <Link href="/auth">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 text-lg">
                  Get Started
                </Button>
              </Link>
            </motion.div>
            <motion.div {...scaleOnHover}>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-20 bg-white">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">
            How It Works
          </h2>
          <p className="text-center text-slate-600 mb-16 max-w-2xl mx-auto">
            Three simple steps to unlock insights from your health data
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Unify Data",
                description: "Connect your health sources and journal entries in one secure platform",
                icon: Activity
              },
              {
                step: "2",
                title: "Add Context",
                description: "Log daily experiences, medications, and lifestyle factors that matter",
                icon: Brain
              },
              {
                step: "3",
                title: "Get Insights",
                description: "Receive AI-powered insights that connect the dots in your health story",
                icon: TrendingUp
              }
            ].map((item, index) => (
              <Card key={index} className="p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-teal-600" />
                </div>
                <div className="text-3xl font-bold text-teal-600 mb-2">{item.step}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Features Preview Section */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-center text-slate-600 mb-16 max-w-2xl mx-auto">
            AI-native tools that understand your unique health journey
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Anomaly Detection",
                description: "Advanced ML algorithms identify unusual patterns in your metrics before they become problems",
                icon: Activity
              },
              {
                title: "Correlation Discovery",
                description: "Uncover hidden relationships between sleep, diet, exercise, and how you feel",
                icon: BarChart3
              },
              {
                title: "Predictive Forecasting",
                description: "Time-series models predict future trends so you can take proactive action",
                icon: TrendingUp
              },
              {
                title: "Research Integration",
                description: "Connect your personal data with the latest health research for evidence-based insights",
                icon: Brain
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Security & Privacy Section */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-20 bg-slate-900 rounded-3xl my-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Your Data is Yours. Period.
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              We are built on a privacy-first architecture. Your data is encrypted,
              siloed, and analyzed by your personal AI agent. We will never sell or
              share your health information.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              {[
                "End-to-end encryption",
                "Zero data sharing",
                "Full data ownership"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-teal-400 flex-shrink-0" />
                  <span className="text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Ready to reimagine your health?
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Join the future of personalized health insights. Get started in minutes.
          </p>
          <motion.div {...scaleOnHover}>
            <Link href="/auth">
              <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 text-lg">
                Get Started Now
              </Button>
            </Link>
          </motion.div>
        </section>
      </AnimatedSection>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-slate-200">
        <p className="text-center text-slate-500">
          © 2024 Axion Health. Built for Palo Alto Networks R&D Hackathon.
        </p>
      </footer>
    </main>
  );
}
