"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  Sparkles,
  Zap,
  Globe,
  RefreshCw,
  Code2,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  index: number;
  className?: string;
  children: React.ReactNode;
}

function BentoCard({ index, className, children }: BentoCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ y: 20, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className={cn(
        "bg-surface border border-border rounded-2xl p-6 hover:border-border/80 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 overflow-hidden relative flex flex-col justify-between",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export default function Features() {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  // Ref specifically for Card 3 chart animation
  const chartRef = useRef(null);
  const isChartInView = useInView(chartRef, { once: true, margin: "-50px" });

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-background">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* SECTION HEADER */}
        <motion.div
          ref={headerRef}
          initial={{ y: 20, opacity: 0 }}
          animate={isHeaderInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center mb-16 text-center"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
            Özellikler
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground whitespace-pre-line leading-tight">
            Sıradan Tarayıcılardan{"\n"}
            <span className="text-primary">Farklı</span> Olmanın Nedenleri
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto mt-4 leading-relaxed">
            Hüma, yalnızca web'e erişmekle kalmaz — sizi korur, hızlandırır ve
            sizi anlayan bir tarayıcıdır.
          </p>
        </motion.div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* Card 1 — LARGE (Gizlilik Kalkanı) */}
          <BentoCard index={0} className="col-span-12 md:col-span-7 md:row-span-2 min-h-[360px]">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Shield size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Yerleşik Gizlilik Kalkanı
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Reklam engelleyici, izleyici koruma ve şifreli DNS desteğiyle
                verileriniz yalnızca size aittir.
              </p>
            </div>

            {/* Absolute Shield SVG decoration */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute bottom-[-10px] right-[-10px] w-[140px] h-[140px] text-primary opacity-5 pointer-events-none"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>

            {/* Stats Row */}
            <div className="mt-8 pt-4 flex gap-6 border-t border-border/40 relative z-10">
              <div>
                <div className="text-2xl font-bold text-foreground">2.4x</div>
                <div className="text-xs text-muted-foreground">Daha Hızlı</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">99%</div>
                <div className="text-xs text-muted-foreground">İzleyici Engeli</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">0</div>
                <div className="text-xs text-muted-foreground">Veri Satışı</div>
              </div>
            </div>
          </BentoCard>

          {/* Card 2 — TALL (Türkçe AI Asistan) */}
          <BentoCard index={1} className="col-span-12 md:col-span-5 md:row-span-2 min-h-[360px]">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Türkçe AI Asistan
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Türkçe anlayan, Türkçe düşünen yerleşik yapay zeka asistanıyla
                web'de daha akıllıca gezinin.
              </p>
            </div>

            {/* Fake AI chat UI */}
            <div className="mt-6 bg-background rounded-xl border border-border p-4 flex flex-col gap-3">
              {/* User message */}
              <div className="ml-auto bg-primary text-primary-foreground text-xs px-3 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">
                Bu makaleyi özetle
              </div>
              {/* AI message */}
              <div className="bg-surface-elevated text-foreground text-xs px-3 py-2 rounded-2xl rounded-tl-sm max-w-[85%]">
                Bu makale, Türkiye'nin teknoloji...
              </div>
              {/* Typing indicator */}
              <div className="flex gap-1 bg-surface-elevated px-3 py-2 rounded-2xl rounded-tl-sm w-fit mt-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: "0s" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            </div>
          </BentoCard>

          {/* Card 3 — WIDE (Hız) */}
          <BentoCard index={2} className="col-span-12 md:col-span-6 min-h-[240px]">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Zap size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Işık Hızında Performans
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                V8 motoru optimizasyonları ve akıllı önbellek sistemiyle sayfalar
                anında yüklenir.
              </p>
            </div>

            {/* Horizontal bar chart */}
            <div ref={chartRef} className="mt-6 flex flex-col gap-2">
              {/* Row 1: Hüma */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12 shrink-0">Hüma</span>
                <div className="flex-1 bg-surface-elevated rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: isChartInView ? "95%" : "0%",
                      transitionDelay: "200ms",
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground w-10 text-right shrink-0">
                  1.2s
                </span>
              </div>
              {/* Row 2: Chrome */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12 shrink-0">Chrome</span>
                <div className="flex-1 bg-surface-elevated rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-muted-foreground/40 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: isChartInView ? "60%" : "0%",
                      transitionDelay: "200ms",
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground w-10 text-right shrink-0">
                  2.1s
                </span>
              </div>
              {/* Row 3: Firefox */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12 shrink-0">Firefox</span>
                <div className="flex-1 bg-surface-elevated rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-muted-foreground/30 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: isChartInView ? "55%" : "0%",
                      transitionDelay: "200ms",
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground w-10 text-right shrink-0">
                  2.4s
                </span>
              </div>
              {/* Row 4: Safari */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12 shrink-0">Safari</span>
                <div className="flex-1 bg-surface-elevated rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-muted-foreground/20 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: isChartInView ? "50%" : "0%",
                      transitionDelay: "200ms",
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground w-10 text-right shrink-0">
                  2.8s
                </span>
              </div>
            </div>
          </BentoCard>

          {/* Card 4 — SMALL (Türkçe Arayüz) */}
          <BentoCard index={3} className="col-span-12 md:col-span-3 min-h-[240px]">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Globe size={20} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Tam Türkçe</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Menüden ayarlara kadar eksiksiz Türkçe deneyim.
              </p>
            </div>
            
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium w-fit">
              <span>🇹🇷 Yerel Dil Desteği</span>
            </div>
          </BentoCard>

          {/* Card 5 — SMALL (Senkronizasyon) */}
          <BentoCard index={4} className="col-span-12 md:col-span-3 min-h-[240px]">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <RefreshCw size={20} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Cihazlar Arası Sync
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yer imleri, geçmiş ve ayarlar tüm cihazlarınızda.
              </p>
            </div>

            <div className="mt-4 flex items-center select-none">
              <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-muted-foreground">
                <Monitor size={16} />
              </div>
              <div className="w-4 h-px bg-border" />
              <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-muted-foreground">
                <Smartphone size={16} />
              </div>
              <div className="w-4 h-px bg-border" />
              <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-muted-foreground">
                <Tablet size={16} />
              </div>
            </div>
          </BentoCard>

          {/* Card 6 — FULL (Developer Tools) */}
          <BentoCard index={5} className="col-span-12 min-h-[260px]">
            <div className="flex flex-col md:flex-row gap-6 items-start w-full">
              {/* Left Side */}
              <div className="flex-1">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Code2 size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Güçlü Geliştirici Araçları
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Yerleşik DevTools, JSON görüntüleyici ve API test paneli ile
                  geliştiriciler için tasarlandı.
                </p>

                {/* Tag Pills */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {["DevTools", "JSON Viewer", "API Tester", "Console", "Network"].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded-md bg-surface-elevated border border-border text-muted-foreground"
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Right Side */}
              <div className="flex-1 w-full">
                {/* Fake Code Block */}
                <div className="bg-background rounded-xl border border-border overflow-hidden w-full shadow-sm">
                  {/* Header */}
                  <div className="h-8 bg-surface-elevated border-b border-border flex items-center px-3 gap-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: "#FF5F57" }}
                      />
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: "#FEBC2E" }}
                      />
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: "#28C840" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 font-mono">
                      console.js
                    </span>
                  </div>
                  {/* Code Area */}
                  <div className="p-4 font-mono text-xs leading-relaxed select-none overflow-x-auto whitespace-nowrap">
                    <div>
                      <span className="text-muted-foreground">// Hüma DevTools</span>
                    </div>
                    <div>
                      <span className="text-primary">const</span> browser ={" "}
                      <span className="text-green-400">'hüma'</span>;
                    </div>
                    <div>
                      <span className="text-primary">const</span> version ={" "}
                      <span className="text-amber-400">2.0</span>;
                    </div>
                    <div>
                      <span className="text-muted-foreground">console</span>.
                      <span className="text-blue-400">log</span>(
                      <span className="text-green-400">`Hoş geldin, ${"{"}browser{"}"}`</span>
                      );
                    </div>
                    <div className="mt-1">
                      <span className="text-muted-foreground">// → Hoş geldin, hüma</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>

        </div>
      </div>
    </section>
  );
}
