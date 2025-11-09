"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function NavigationLoading() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Detect route changes using pathname
  useEffect(() => {
    const handleStart = () => {
      setIsVisible(true);
    };

    const handleStop = () => {
      setTimeout(() => setIsVisible(false), 300);
    };

    // Use popstate event and link clicks to detect navigation
    const handlePopState = handleStart;

    window.addEventListener("popstate", handlePopState);

    // Intercept link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (target && target.href && !target.target) {
        const href = target.getAttribute("href");
        if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
          handleStart();
        }
      }
    };

    document.addEventListener("click", handleLinkClick);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  // Auto-hide after 2 seconds as fallback
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-blue-500 z-50 origin-left"
      style={{
        boxShadow: "0 0 8px rgba(20, 184, 166, 0.6)",
      }}
    />
  );
}
