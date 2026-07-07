"use client";

import { useState } from "react";
import Image from "next/image";
import { HelpCircle, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
  gradient: string;
  borderColor: string;
  accentColor: string;
  iconName: string;
  image: string;
}

export default function AboutFaqClient({ faqs }: { faqs: FaqItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-stretch">
      {/* Left: Questions List (Tabs) */}
      <div className="w-full lg:w-5/12 flex flex-col gap-3">
        {faqs.map((faq, idx) => {
          const isActive = idx === activeIndex;
          // Dynamically get the lucide icon component
          const IconComponent = (Icons as any)[faq.iconName] || HelpCircle;

          return (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 group ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                  : "bg-white text-slate-800 border-slate-200/60 hover:border-slate-350 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex items-center justify-center size-9 rounded-xl shrink-0 transition-colors ${
                    isActive ? "bg-white/20 text-white" : faq.accentColor
                  }`}
                >
                  <IconComponent className="size-4.5" />
                </div>
                <span className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
                  {faq.q}
                </span>
              </div>
              <ChevronRight
                className={`size-4 shrink-0 transition-transform ${
                  isActive ? "translate-x-0.5 text-white" : "text-slate-400 group-hover:translate-x-0.5"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Right: Active Detail Showcase Card */}
      <div className="flex-1 flex">
        <div className="w-full rounded-[2rem] border border-slate-200/60 bg-white p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div>
            {/* Aspect-video top image container - showing the image in full */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-50 mb-6 border border-slate-100 shadow-inner">
              <Image
                src={faqs[activeIndex].image}
                alt={faqs[activeIndex].q}
                fill
                className="object-cover animate-in fade-in duration-700"
                sizes="(max-width: 1024px) 100vw, 600px"
                priority
              />
            </div>

            {/* Question Badge / Header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
                Question 0{activeIndex + 1}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                JOBDADDY AI FAQ
              </span>
            </div>

            {/* Question Title */}
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug mb-4">
              {faqs[activeIndex].q}
            </h3>

            {/* Detailed Answer */}
            <p className="text-sm text-slate-600 leading-relaxed font-semibold">
              {faqs[activeIndex].a}
            </p>
          </div>

          {/* Footer decoration */}
          <div className="mt-8 pt-4 border-t border-slate-100/50 flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span>ACTIVE SHOWCASE</span>
            <span>AI Talents Ecosystem</span>
          </div>
        </div>
      </div>
    </div>
  );
}
