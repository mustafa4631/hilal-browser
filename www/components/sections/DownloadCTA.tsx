"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Monitor,
  Laptop,
  Terminal,
  ShieldCheck,
  Lock,
  Zap,
  Star,
} from "lucide-react";

export default function DownloadCTA() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  const contentVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.7,
        ease: "easeOut",
      },
    },
  } as const;

  const buttonVariants = (delay: number) => ({
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        delay,
        ease: "easeOut",
      },
    },
  } as const);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-32 px-6 bg-surface-elevated border-t border-border"
    >
      {/* BACKGROUND EFFECTS */}
      {/* 1. Large Radial Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full -z-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(107, 70, 255, 0.12) 0%, transparent 70%)",
        }}
      />

      {/* 2. Grid Pattern */}
      <div
        className="absolute inset-0 -z-10 text-foreground/[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='currentColor' stroke-width='1'/%3E%3C/svg%3E\")",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        {/* Eyebrow Pill */}
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 border border-border bg-background/60 text-xs font-medium text-muted-foreground select-none"
        >
          <span>✦ Ücretsiz & Açık Kaynak</span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          variants={contentVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.05] whitespace-pre-line mb-4"
        >
          Bugün İndir,{"\n"}
          <span className="text-primary">Farkı</span> Hemen Hisset
        </motion.h2>

        {/* Subtext */}
        <motion.p
          variants={contentVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-base text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed"
        >
          Hüma Browser'ı indirmek ücretsizdir. Reklam yok, abonelik yok, gizli
          ücret yok.
        </motion.p>

        {/* OS Download buttons row */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center select-none">
          {/* Windows Download */}
          <motion.div
            variants={buttonVariants(0.1)}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <Link
              href="/download"
              className="px-6 py-3 rounded-xl flex items-center gap-3 bg-primary hover:opacity-90 transition-all duration-200 shadow-sm w-56 text-left"
            >
              <Monitor size={18} className="text-primary-foreground shrink-0" />
              <div>
                <div className="text-[10px] text-primary-foreground/70 leading-tight">
                  Windows için indir
                </div>
                <div className="text-sm font-semibold text-primary-foreground leading-tight">
                  Windows 10/11
                </div>
              </div>
            </Link>
          </motion.div>

          {/* macOS Download */}
          <motion.div
            variants={buttonVariants(0.2)}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <Link
              href="/download"
              className="px-6 py-3 rounded-xl flex items-center gap-3 bg-surface border border-border hover:border-border/60 transition-all duration-200 shadow-sm w-56 text-left"
            >
              <Laptop size={18} className="text-muted-foreground shrink-0" />
              <div>
                <div className="text-[10px] text-muted-foreground leading-tight">
                  macOS için indir
                </div>
                <div className="text-sm font-semibold text-foreground leading-tight">
                  macOS 12+
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Linux Download */}
          <motion.div
            variants={buttonVariants(0.3)}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <Link
              href="/download"
              className="px-6 py-3 rounded-xl flex items-center gap-3 bg-surface border border-border hover:border-border/60 transition-all duration-200 shadow-sm w-56 text-left"
            >
              <Terminal size={18} className="text-muted-foreground shrink-0" />
              <div>
                <div className="text-[10px] text-muted-foreground leading-tight">
                  Linux için indir
                </div>
                <div className="text-sm font-semibold text-foreground leading-tight">
                  Ubuntu / Debian
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Trust Badges */}
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-12 flex flex-wrap gap-6 justify-center select-none"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <ShieldCheck size={14} />
            <span>Virüs taramalı</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Lock size={14} />
            <span>Açık kaynak</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Zap size={14} />
            <span>10MB kurulum</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Star size={14} />
            <span>4.8 yıldız</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
