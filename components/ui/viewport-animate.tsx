"use client";

import { motion, useInView, Variants } from "framer-motion";
import { useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ViewportAnimateProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  direction?: "up" | "down" | "left" | "right" | "fade";
  distance?: number;
}

export function ViewportAnimate({
  children,
  className,
  delay = 0,
  duration = 0.6,
  once = true,
  direction = "up",
  distance = 40,
}: ViewportAnimateProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-100px" });

  const getInitialPosition = () => {
    switch (direction) {
      case "up": return { y: distance, opacity: 0 };
      case "down": return { y: -distance, opacity: 0 };
      case "left": return { x: distance, opacity: 0 };
      case "right": return { x: -distance, opacity: 0 };
      case "fade": return { opacity: 0 };
      default: return { y: distance, opacity: 0 };
    }
  };

  const getFinalPosition = () => {
    switch (direction) {
      case "up":
      case "down": return { y: 0, opacity: 1 };
      case "left":
      case "right": return { x: 0, opacity: 1 };
      case "fade": return { opacity: 1 };
      default: return { y: 0, opacity: 1 };
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={getInitialPosition()}
      animate={isInView ? getFinalPosition() : getInitialPosition()}
      transition={{
        duration,
        delay,
        ease: [0.33, 1, 0.68, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

interface ViewportStaggerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delay?: number;
  once?: boolean;
}

export function ViewportStagger({
  children,
  className,
  staggerDelay = 0.1,
  delay = 0,
  once = true,
}: ViewportStaggerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-100px" });

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

interface ViewportStaggerItemProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "fade";
  distance?: number;
  duration?: number;
}

export function ViewportStaggerItem({
  children,
  className,
  direction = "up",
  distance = 40,
  duration = 0.6,
}: ViewportStaggerItemProps) {
  const getVariants = (): Variants => {
    const hidden: any = { opacity: 0 };
    const visible: any = { opacity: 1, transition: { duration, ease: [0.33, 1, 0.68, 1] } };

    switch (direction) {
      case "up":
        hidden.y = distance;
        visible.y = 0;
        break;
      case "down":
        hidden.y = -distance;
        visible.y = 0;
        break;
      case "left":
        hidden.x = distance;
        visible.x = 0;
        break;
      case "right":
        hidden.x = -distance;
        visible.x = 0;
        break;
      case "fade":
      default:
        break;
    }

    return { hidden, visible };
  };

  return (
    <motion.div className={className} variants={getVariants()}>
      {children}
    </motion.div>
  );
}
