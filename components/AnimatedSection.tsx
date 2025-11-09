"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { scrollReveal } from "@/lib/animations";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedSection({ children, className = "" }: AnimatedSectionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={scrollReveal}
      className={className}
    >
      {children}
    </motion.div>
  );
}
