"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom count up hook defined inside the file
function useCountUp(target: number, duration: number = 1500, trigger: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) {
      setCount(0);
      return;
    }

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [target, duration, trigger]);

  return count;
}

interface StatItemProps {
  target: number;
  label: string;
  format: (val: number) => string;
  trigger: boolean;
}

function StatItem({ target, label, format, trigger }: StatItemProps) {
  const count = useCountUp(target, 1500, trigger);

  return (
    <div className="flex flex-col items-center p-6 bg-surface border border-border/40 rounded-2xl text-center shadow-sm hover:border-border/80 transition-colors duration-300">
      <span className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight select-none">
        {format(count)}
      </span>
      <span className="text-sm text-muted-foreground mt-2 font-medium">
        {label}
      </span>
    </div>
  );
}

interface TestimonialCardProps {
  avatar: string;
  name: string;
  role: string;
  quote: string;
  index: number;
}

function TestimonialCard({ avatar, name, role, quote, index }: TestimonialCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ y: 20, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="bg-surface border border-border rounded-2xl p-6 hover:shadow-md hover:shadow-black/5 hover:border-border/60 transition-all duration-300 flex flex-col gap-4"
    >
      {/* Star Rating */}
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
        ))}
      </div>

      {/* Quote */}
      <div className="flex-1 flex flex-col">
        <span className="text-4xl text-primary/30 font-serif leading-none mb-1 select-none">
          &ldquo;
        </span>
        <p className="text-sm text-foreground leading-relaxed -mt-2">
          {quote}
        </p>
      </div>

      {/* Avatar Row */}
      <div className="flex items-center gap-3 mt-auto pt-2 border-t border-border/40">
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary select-none shrink-0">
          {avatar}
        </div>
        <div>
          <div className="text-sm font-medium text-foreground leading-none">
            {name}
          </div>
          <div className="text-xs text-muted-foreground mt-1 leading-none">
            {role}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const testimonialsData = [
  {
    avatar: "AK",
    name: "Ahmet Kaya",
    role: "Yazılım Geliştirici",
    quote: "Hüma'yı kullanmaya başladığımdan beri tarayıcı değiştirmeyi hiç düşünmedim. Hız ve gizlilik konusunda rakipsiz.",
  },
  {
    avatar: "FY",
    name: "Fatma Yıldız",
    role: "Grafik Tasarımcı",
    quote: "Türkçe arayüzü ve yerleşik AI asistanı işimi inanılmaz kolaylaştırdı. Artık her şey parmak uçlarımda.",
  },
  {
    avatar: "MB",
    name: "Mehmet Bulut",
    role: "Öğretmen",
    quote: "Reklamlardan bunalmıştım. Hüma'nın gizlilik kalkanı gerçekten işe yarıyor, internette gezinmek artık çok daha keyifli.",
  },
  {
    avatar: "ZD",
    name: "Zeynep Demir",
    role: "UX Araştırmacısı",
    quote: "Arayüz tasarımı son derece düşünülmüş. Minimal ama güçlü. Türk ekibinin bu işe verdiği emek her pikselde belli.",
  },
  {
    avatar: "CT",
    name: "Can Tuncer",
    role: "Girişimci",
    quote: "Cihazlar arası senkronizasyon sorunsuz çalışıyor. Telefon, tablet ve bilgisayarımda tek bir ekosistem gibi hissettiriyor.",
  },
  {
    avatar: "EA",
    name: "Elif Arslan",
    role: "Gazeteci",
    quote: "Veri gizliliği benim için kritik. Hüma, verilerimi satmayan, güvendiğim tek tarayıcı. Türkiye'nin gururu.",
  },
];

export default function SocialProof() {
  const statsRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: true, margin: "-50px" });

  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-50px" });

  return (
    <section id="social-proof" className="py-24 bg-background relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* PART 1 — STATS */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
          <StatItem
            target={500}
            label="Aktif İndirme"
            format={(val) => `${val}K+`}
            trigger={isStatsInView}
          />
          <StatItem
            target={48}
            label="Kullanıcı Puanı"
            format={(val) => `${(val / 10).toFixed(1)}★`}
            trigger={isStatsInView}
          />
          <StatItem
            target={62}
            label="Yükleme Süresi"
            format={(val) => `${val}ms`}
            trigger={isStatsInView}
          />
          <StatItem
            target={100}
            label="Güvenli ve Gizli"
            format={(val) => `${val}%`}
            trigger={isStatsInView}
          />
        </div>

        {/* PART 2 — TESTIMONIALS HEADER */}
        <motion.div
          ref={headerRef}
          initial={{ y: 20, opacity: 0 }}
          animate={isHeaderInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center mb-16 text-center"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
            Kullanıcı Yorumları
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground whitespace-pre-line leading-tight">
            Hüma Kullananlar{"\n"}
            <span className="text-primary">Ne Diyor?</span>
          </h2>
        </motion.div>

        {/* TESTIMONIALS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonialsData.map((t, idx) => (
            <TestimonialCard
              key={t.name}
              avatar={t.avatar}
              name={t.name}
              role={t.role}
              quote={t.quote}
              index={idx}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
