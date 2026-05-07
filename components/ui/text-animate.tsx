"use client";

import { motion, useInView, Variants } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface TextAnimateProps {
  text: string;
  className?: string;
  once?: boolean;
  delay?: number;
  duration?: number;
  staggerDelay?: number;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  by?: "word" | "line";
}

export function TextAnimate({
  text,
  className,
  once = true,
  delay = 0,
  duration = 0.5,
  staggerDelay = 0.1,
  as: Component = "div",
  by = "word",
}: TextAnimateProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-100px" });

  const items = by === "word" ? text.split(" ") : text.split(". ").filter(Boolean).map(s => s.endsWith(".") ? s : s + ".");

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      y: by === "word" ? 40 : 20,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration,
        ease: [0.33, 1, 0.68, 1],
      },
    },
  };

  if (by === "line") {
    return (
      <Component ref={ref} className={cn("overflow-hidden", className)}>
        <motion.span
          className="inline-flex flex-col"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {items.map((line, index) => (
            <span key={index} className="overflow-hidden inline-block">
              <motion.span
                className="inline-block"
                variants={itemVariants}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </motion.span>
      </Component>
    );
  }

  return (
    <Component ref={ref} className={cn("overflow-hidden", className)}>
      <motion.span
        className="inline-flex flex-wrap"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {items.map((word, index) => (
          <span key={index} className="overflow-hidden inline-block">
            <motion.span
              className="inline-block"
              variants={itemVariants}
            >
              {word}
            </motion.span>
            {index < items.length - 1 && (
              <span className="inline-block">&nbsp;</span>
            )}
          </span>
        ))}
      </motion.span>
    </Component>
  );
}
