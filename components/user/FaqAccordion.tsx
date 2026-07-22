"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  faqData: FaqItem[];
}

export default function FaqAccordion({ faqData }: FaqAccordionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {faqData.map((item, idx) => {
        const isOpen = openFaq === idx;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden transition-all duration-300"
          >
            <button
              onClick={() => toggleFaq(idx)}
              className="w-full flex items-center justify-between gap-4 p-6 font-bold text-slate-900 text-left hover:text-blue-600 transition-colors"
            >
              <span className="text-sm sm:text-base">{item.q}</span>
              <ChevronDown
                className={`size-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                  isOpen ? "transform rotate-180 text-blue-600" : ""
                }`}
              />
            </button>
            <div
              className={`transition-all duration-300 ease-in-out ${
                isOpen ? "max-h-[300px] border-t border-slate-100" : "max-h-0"
              } overflow-hidden`}
            >
              <div className="p-6 text-slate-500 font-medium text-xs sm:text-sm leading-relaxed bg-slate-50/30">
                {item.a}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
