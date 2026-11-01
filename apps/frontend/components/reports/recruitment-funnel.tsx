"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FunnelStage } from "@/lib/types";
import { DEFAULT_FUNNEL_STAGES } from "@/constants/reports.constants";

export type { FunnelStage };


export function RecruitmentFunnel({ stages = DEFAULT_FUNNEL_STAGES }: { stages?: FunnelStage[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full relative">
      {/* DESKTOP & TABLET LAYOUT */}
      <DesktopFunnel stages={stages} hoveredIndex={hoveredIndex} setHoveredIndex={setHoveredIndex} />

      {/* MOBILE LAYOUT */}
      <MobileFunnel stages={stages} hoveredIndex={hoveredIndex} setHoveredIndex={setHoveredIndex} />
    </div>
  );
}

function DesktopFunnel({ stages, hoveredIndex, setHoveredIndex }: { stages: FunnelStage[], hoveredIndex: number | null, setHoveredIndex: (v: number | null) => void }) {
  const N = stages.length;
  const H = 60; // Row height
  const TOTAL_H = N * H;
  const W_TOP = 100; // SVG 100% width at top
  const W_BOT = 25; // SVG 25% width at bottom

  const L = (y: number) => (y / TOTAL_H) * ((W_TOP - W_BOT) / 2);
  const R = (y: number) => W_TOP - (y / TOTAL_H) * ((W_TOP - W_BOT) / 2);

  return (
    <div className="hidden md:flex relative z-0 flex-col w-full bg-transparent">
      {/* The SVG background for center column */}
      <div className="absolute inset-y-0 left-[220px] right-[120px] z-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        <motion.svg
          viewBox={`0 0 100 ${TOTAL_H}`}
          preserveAspectRatio="none"
          className="w-full h-full"
          initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
          <defs>
            {stages.map((s, i) => (
              <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={s.color} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.85} />
              </linearGradient>
            ))}
          </defs>
          {stages.map((_, i) => {
            const y1 = i * H;
            const y2 = (i + 1) * H;
            const p1x = L(y1);
            const p2x = R(y1);
            const p3x = R(y2);
            const p4x = L(y2);
            
            const isHovered = hoveredIndex === i;
            const fillOpacity = hoveredIndex === null || isHovered ? 1 : 0.65;
            const filter = isHovered ? "brightness(1.05)" : "none";

            return (
              <polygon
                key={`slice-${i}`}
                points={`${p1x},${y1} ${p2x},${y1} ${p3x},${y2} ${p4x},${y2}`}
                fill={`url(#grad-${i})`}
                style={{ transition: "all 0.2s ease", filter, fillOpacity }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </motion.svg>
      </div>

      {/* Foreground Content */}
      <TooltipProvider>
        <div className="relative z-10 flex flex-col w-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl border border-border/60">
          {stages.map((stage, i) => (
            <Tooltip key={i} delayDuration={150}>
              <TooltipTrigger asChild>
                <div 
                  className="flex w-full h-[60px] group relative cursor-default"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Left Panel */}
                  <div className="w-[220px] bg-white px-5 flex items-center font-semibold text-[13px] border-b border-border/40 text-foreground transition-colors pointer-events-auto first:rounded-tl-xl last:rounded-bl-xl z-20">
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      {stage.name}
                    </motion.span>
                  </div>
                  
                  {/* Center Panel (Value) */}
                  <div className="flex-1 flex items-center justify-center text-white font-medium text-[15px] pointer-events-none drop-shadow-md z-10">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                    >
                      {stage.value.toLocaleString()}
                    </motion.span>
                  </div>
                  
                  {/* Right Panel (Conv %) */}
                  <div className="w-[120px] bg-white px-5 flex items-center justify-end text-[13px] text-muted-foreground border-b border-border/40 transition-colors pointer-events-auto first:rounded-tr-xl last:rounded-br-xl z-20">
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="font-medium tabular-nums"
                    >
                      {stage.conv}
                    </motion.span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-[12.5px] font-medium">{stage.name}</p>
                <p className="text-[11.5px] text-muted-foreground">{stage.value.toLocaleString()} candidates</p>
                {i > 0 && <p className="text-[11.5px] text-muted-foreground">Conversion: {stage.conv}</p>}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}

function MobileFunnel({ stages, hoveredIndex, setHoveredIndex }: { stages: FunnelStage[], hoveredIndex: number | null, setHoveredIndex: (v: number | null) => void }) {
  const N = stages.length;
  const H = 84; // Taller row to fit 3 lines
  const TOTAL_H = N * H;
  const W_TOP = 100; // SVG 100% width at top
  const W_BOT = 0; // Terminate at a perfect point

  const L = (y: number) => (y / TOTAL_H) * ((W_TOP - W_BOT) / 2);
  const R = (y: number) => W_TOP - (y / TOTAL_H) * ((W_TOP - W_BOT) / 2);

  return (
    <div className="md:hidden relative z-0 flex flex-col w-full bg-transparent">
      {/* The SVG background */}
      <div className="absolute inset-0 z-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        <motion.svg
          viewBox={`0 0 100 ${TOTAL_H}`}
          preserveAspectRatio="none"
          className="w-full h-full"
          initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
          <defs>
            {stages.map((s, i) => (
              <linearGradient key={`m-grad-${i}`} id={`m-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={s.color} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.85} />
              </linearGradient>
            ))}
          </defs>
          {stages.map((_, i) => {
            const y1 = i * H;
            const y2 = (i + 1) * H;
            const p1x = L(y1);
            const p2x = R(y1);
            const p3x = R(y2);
            const p4x = L(y2);
            
            const isHovered = hoveredIndex === i;
            const fillOpacity = hoveredIndex === null || isHovered ? 1 : 0.65;
            const filter = isHovered ? "brightness(1.05)" : "none";

            return (
              <polygon
                key={`m-slice-${i}`}
                points={`${p1x},${y1} ${p2x},${y1} ${p3x},${y2} ${p4x},${y2}`}
                fill={`url(#m-grad-${i})`}
                style={{ transition: "all 0.2s ease", filter, fillOpacity }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </motion.svg>
      </div>

      {/* Foreground Content */}
      <TooltipProvider>
        <div className="relative z-10 flex flex-col w-full">
          {stages.map((stage, i) => {
            const convText = i === 0 ? "100%" : stage.conv;
            return (
              <Tooltip key={`m-tt-${i}`} delayDuration={150}>
                <TooltipTrigger asChild>
                  <div 
                    className="flex flex-col items-center justify-center w-full h-[84px] group relative cursor-default"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <motion.span 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="text-[12.5px] font-semibold text-white/95 drop-shadow-md leading-[1.2]"
                    >
                      {stage.name}
                    </motion.span>
                    
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="text-[20px] font-bold text-white drop-shadow-md leading-[1.2] my-[2px]"
                    >
                      {stage.value.toLocaleString()}
                    </motion.span>
                    
                    <motion.span
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="text-[11.5px] font-medium text-white/85 drop-shadow-md leading-[1.2]"
                    >
                      {convText}
                    </motion.span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-[12.5px] font-medium">{stage.name}</p>
                  <p className="text-[11.5px] text-muted-foreground">{stage.value.toLocaleString()} candidates</p>
                  {i > 0 && <p className="text-[11.5px] text-muted-foreground">Conversion: {stage.conv}</p>}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
