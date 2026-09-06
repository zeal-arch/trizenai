"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, MotionConfig } from "motion/react";

interface AccordionItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [supportsHover] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(hover: hover)").matches
      : false,
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-2.5 w-full">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const contentId = `faq-content-${index}`;
          const triggerId = `faq-trigger-${index}`;

          return (
            <motion.div
              key={index}
              layout
              className="w-full overflow-hidden"
              style={{ borderRadius: 16 }}
              animate={{ backgroundColor: isOpen ? "#c9cbff" : "#d8d2f8" }}
              whileHover={
                supportsHover
                  ? { backgroundColor: isOpen ? "#c9cbff" : "#b6b8fa" }
                  : undefined
              }
              transition={{
                layout: {
                  type: "spring",
                  visualDuration: 0.35,
                  bounce: 0.5,
                },
                backgroundColor: { duration: 0.25, ease: "easeInOut" },
              }}
            >
              <motion.button
                layout
                type="button"
                id={triggerId}
                aria-expanded={isOpen}
                aria-controls={contentId}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-4 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-5 cursor-pointer select-none text-left bg-transparent"
              >
                <div className="flex w-full items-center justify-between text-left gap-4">
                  <span className="text-sm sm:text-base md:text-base lg:text-lg font-normal leading-snug text-balance md:pr-4">
                    {item.question}
                  </span>
                  <motion.div
                    initial={false}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="shrink-0 text-[#7479cc]"
                  >
                    <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6" />
                  </motion.div>
                </div>
              </motion.button>

              {isOpen && (
                <motion.div
                  id={contentId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    opacity: { duration: 0.15, ease: "easeOut" },
                  }}
                >
                  <p className="px-4 pb-3 sm:px-6 sm:pb-3 lg:px-8 lg:pb-5 text-sm text-[#282245] leading-relaxed text-pretty">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </MotionConfig>
  );
}
