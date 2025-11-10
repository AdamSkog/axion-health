import { Variants } from "framer-motion";

// Fade in and slide up animation for page loads
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

// Stagger container for list animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

// Item animation for staggered lists
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
};

// Pulse effect for skeleton loaders
export const pulseEffect = {
  animate: {
    opacity: [0.7, 1, 0.7],
  },
  transition: {
    repeat: Infinity,
    duration: 1.5,
    ease: "easeInOut"
  }
};

// Scale on hover for buttons
export const scaleOnHover = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 }
};

// Scroll animation variant
export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};
