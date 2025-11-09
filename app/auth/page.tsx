"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { fadeInUp, scaleOnHover } from "@/lib/animations";
import { Activity, Mail, CheckCircle } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Starting signin with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Signin response:", { data, error });

      if (error) throw error;

      if (data.user) {
        console.log("Signin successful, user:", data.user.id);
        // Keep loading state to show redirect overlay
        router.push("/dashboard");
      } else {
        console.warn("Signin completed but no user returned");
        setError("Signin completed but authentication status unclear.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Signin error:", err);
      setError(err.message || "An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Starting signup with email:", email);

      if (!email || !password) {
        setError("Email and password are required");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log("Signup response:", { data, error });

      if (error) {
        console.error("Signup error from Supabase:", error);
        throw error;
      }

      if (data.user) {
        console.log("Signup successful, user created:", data.user.id);
        // Check if session was created immediately
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("Current session after signup:", sessionData);

        if (sessionData.session) {
          console.log("User authenticated immediately, redirecting to dashboard");
          router.push("/dashboard");
        } else {
          console.log("Email confirmation required. User created but not authenticated.");
          // Show confirmation screen
          setPendingConfirmation(true);
          setConfirmationEmail(email);
          setEmail("");
          setPassword("");
        }
      } else {
        console.warn("Signup completed but no user returned");
        setError("Account creation process unclear. Please check your email and try signing in.");
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      {/* Full-page loading overlay during redirect */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-white">Signing you in...</h3>
            <p className="text-sm text-slate-300 mt-2">Redirecting to dashboard</p>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">Axion Health</span>
          </div>
          <p className="text-slate-600">Your personal health intelligence</p>
        </div>

        {/* Email Confirmation Pending Screen */}
        {pendingConfirmation && (
          <Card className="p-8 bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </motion.div>

            <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
              Confirm Your Email
            </h2>
            <p className="text-center text-slate-600 mb-6">
              {`We've sent a confirmation email to:`}
            </p>

            <div className="bg-white border border-teal-200 rounded-lg p-4 mb-6 text-center">
              <p className="font-medium text-slate-900">{confirmationEmail}</p>
            </div>

            <div className="space-y-3 mb-6 text-slate-700 text-sm">
              <p className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <span>Check your inbox for the confirmation email</span>
              </p>
              <p className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <span>Click the link in the email to activate your account</span>
              </p>
              <p className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <span>Return here and sign in with your email and password</span>
              </p>
            </div>

            <p className="text-center text-xs text-slate-500 mb-6">
              {`Don't see the email? Check your spam folder or wait a moment and refresh.`}
            </p>

            <motion.div {...scaleOnHover}>
              <Button
                onClick={() => {
                  setPendingConfirmation(false);
                  setConfirmationEmail("");
                }}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                Back to Sign In
              </Button>
            </motion.div>
          </Card>
        )}

        {/* Login/Signup Forms */}
        {!pendingConfirmation && (
          <Card className="p-8">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label htmlFor="signin-email" className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="signin-password" className="block text-sm font-medium text-slate-700 mb-1">
                      Password
                    </label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <motion.div {...scaleOnHover}>
                    <Button
                      type="submit"
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </motion.div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1">
                      Password
                    </label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <motion.div {...scaleOnHover}>
                    <Button
                      type="submit"
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Sign Up"}
                    </Button>
                  </motion.div>
                </form>
              </TabsContent>
            </Tabs>
            </Card>
          )}

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-slate-600 hover:text-slate-900">
            ← Back to home
          </a>
        </div>
      </motion.div>
    </div>
  );
}
