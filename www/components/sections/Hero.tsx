"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Download, Play, Globe, RotateCcw, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Hero() {
  const scrollToFeatures = () => {
    const element = document.getElementById("features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden"
    >
      {/* BACKGROUND EFFECTS */}
      {/* 1. Radial Gradient Glow (Dark Mode only) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] -z-10 pointer-events-none dark:block hidden"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at center, rgba(107, 70, 255, 0.15) 0%, transparent 70%)",
        }}
      />

      {/* 2. Grid Pattern (Dark Mode only) */}
      <div
        className="absolute inset-0 -z-10 text-foreground/3 dark:opacity-100 opacity-0 transition-opacity pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='currentColor' stroke-width='1'/%3E%3C/svg%3E\")",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
        {/* 1. BADGE */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6 shadow-sm"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
          </span>
          <span>Türkiye'nin İlk Yerli Tarayıcısı</span>
        </motion.div>

        {/* 2. HEADLINE */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-foreground leading-[1.05] whitespace-pre-line mb-6"
        >
          Web'i <span className="text-primary">Senin</span>{"\n"}Koşullarında Keşfet
        </motion.h1>

        {/* 3. SUBHEADLINE */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8"
        >
          Hüma, gizliliğinizi ön planda tutan, Türkçe desteğiyle öne çıkan ve her
          cihazda kusursuz çalışan modern bir tarayıcıdır.
        </motion.p>

        {/* 4. CTA BUTTONS */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="flex items-center gap-3 justify-center mb-16"
        >
          {/* Primary CTA */}
          <Link
            href="/download"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium text-sm hover:opacity-90 hover:scale-[1.02] transition-all duration-200 shadow-sm"
          >
            <Download size={16} />
            Hemen İndir
          </Link>

          {/* Secondary CTA */}
          <button
            onClick={scrollToFeatures}
            className="inline-flex items-center gap-2 bg-surface-elevated text-foreground border border-border px-6 py-3 rounded-xl font-medium text-sm hover:bg-surface-elevated/80 hover:scale-[1.02] transition-all duration-200 shadow-sm cursor-pointer"
          >
            <Play size={16} />
            Nasıl Çalışır?
          </button>
        </motion.div>

        {/* 5. BROWSER MOCKUP */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/20"
        >
          {/* Browser Chrome */}
          <div className="h-10 bg-surface-elevated border-b border-border flex items-center justify-between px-4 gap-3">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#FF5F57" }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#FEBC2E" }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#28C840" }}
              />
            </div>

            {/* URL Bar */}
            <div className="w-48 sm:w-64 h-6 bg-background rounded-md border border-border px-2 flex items-center gap-1.5 justify-center">
              <Globe size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground select-none">
                huma.com.tr
              </span>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-2">
              <RotateCcw size={14} className="text-muted-foreground" />
              <Settings size={14} className="text-muted-foreground" />
            </div>
          </div>

          {/* Browser Viewport */}
          <div className="aspect-[16/10] bg-background relative overflow-hidden flex text-left">
            {/* Sidebar Left */}
            <div className="w-36 sm:w-48 h-full bg-surface border-r border-border flex flex-col p-3 gap-4 shrink-0 select-none">
              {/* Fake logo */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/20 shrink-0" />
                <div className="w-16 h-2 rounded bg-muted/60" />
              </div>
              {/* Nav items */}
              <div className="flex flex-col gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-full h-8 flex items-center px-3 gap-2 rounded-md",
                      i === 0 ? "bg-primary/10" : ""
                    )}
                  >
                    <div className="w-4 h-4 rounded bg-muted-foreground/20 shrink-0" />
                    <div className="w-16 sm:w-20 h-2 rounded bg-muted/60" />
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4 overflow-hidden select-none">
              <div className="w-36 sm:w-48 h-4 rounded-full bg-foreground/20" />
              <div className="w-24 sm:w-32 h-2 rounded-full bg-muted/40" />
              <div className="w-full h-px bg-border mt-1" />

              {/* Card Grid */}
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 sm:h-20 rounded-xl bg-surface-elevated border border-border p-3 flex flex-col justify-between"
                  >
                    <div className="w-full h-2 rounded bg-muted/40" />
                    <div className="w-3/4 h-2 rounded bg-muted/20" />
                  </div>
                ))}
              </div>

              {/* Text Lines */}
              <div className="flex flex-col gap-2 mt-2">
                <div className="w-full h-2 rounded bg-muted/30" />
                <div className="w-5/6 h-2 rounded bg-muted/20" />
                <div className="w-4/6 h-2 rounded bg-muted/20" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
