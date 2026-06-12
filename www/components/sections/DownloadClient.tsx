"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Monitor,
  Laptop,
  Terminal,
  Download,
  ShieldCheck,
  ChevronDown,
  Copy,
  Check,
  HardDrive,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DetectedOS = "Windows" | "macOS" | "Linux" | null;

const faqData = [
  {
    q: "Hüma Browser ücretsiz mi?",
    a: "Evet, Hüma Browser tamamen ücretsizdir ve her zaman ücretsiz kalacaktır. Açık kaynak lisansı altında geliştirilmektedir.",
  },
  {
    q: "Verilerimi kimlerle paylaşıyorsunuz?",
    a: "Hiç kimseyle. Hüma, kullanıcı verilerini toplamaz, saklamaz veya üçüncü taraflarla paylaşmaz. Gizlilik politikamız bunun güvencesidir.",
  },
  {
    q: "Chrome eklentileri çalışır mı?",
    a: "Evet, Hüma Browser Chromium tabanlı olduğu için Chrome Web Mağazası'ndaki tüm eklentilerle uyumludur.",
  },
  {
    q: "Mevcut tarayıcımdan verileri aktarabilir miyim?",
    a: "Evet, kurulum sırasında Chrome, Firefox, Edge ve Safari'den yer imlerinizi, şifrelerinizi ve geçmişinizi tek tıkla aktarabilirsiniz.",
  },
  {
    q: "Beta programına nasıl katılabilirim?",
    a: "Web sitemiz üzerinden beta başvuru formunu doldurabilirsiniz. Beta kullanıcıları yeni özelliklere erken erişim hakkı kazanır.",
  },
];

const systemRequirements = [
  {
    os: "Windows",
    rows: [
      { label: "İşletim Sistemi", value: "Windows 10 (64-bit) veya üzeri" },
      { label: "İşlemci", value: "1.6 GHz veya daha hızlı" },
      { label: "RAM", value: "Minimum 4 GB" },
      { label: "Disk", value: "200 MB boş alan" },
      { label: "GPU", value: "DirectX 11 uyumlu" },
    ],
  },
  {
    os: "macOS",
    rows: [
      { label: "İşletim Sistemi", value: "macOS 12 Monterey veya üzeri" },
      { label: "İşlemci", value: "Apple Silicon veya Intel Core i5+" },
      { label: "RAM", value: "Minimum 8 GB" },
      { label: "Disk", value: "250 MB boş alan" },
      { label: "GPU", value: "Metal uyumlu" },
    ],
  },
  {
    os: "Linux",
    rows: [
      { label: "Dağıtım", value: "Ubuntu 20.04 / Debian 10 veya üzeri" },
      { label: "İşlemci", value: "x86_64 mimarisi" },
      { label: "RAM", value: "Minimum 4 GB" },
      { label: "Disk", value: "180 MB boş alan" },
      { label: "Bağımlılık", value: "GTK 3.20+" },
    ],
  },
];

function OSIcon({ os, size = 28 }: { os: DetectedOS; size?: number }) {
  switch (os) {
    case "Windows":
      return <Monitor size={size} className="text-primary" />;
    case "macOS":
      return <Laptop size={size} className="text-primary" />;
    case "Linux":
      return <Terminal size={size} className="text-primary" />;
    default:
      return <Download size={size} className="text-primary" />;
  }
}

export default function DownloadClient() {
  const [detectedOS, setDetectedOS] = useState<DetectedOS>(null);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showBrew, setShowBrew] = useState(false);

  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true, margin: "-50px" });

  useEffect(() => {
    const ua = navigator.userAgent;
    if (ua.includes("Win")) setDetectedOS("Windows");
    else if (ua.includes("Mac")) setDetectedOS("macOS");
    else if (ua.includes("Linux")) setDetectedOS("Linux");
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      "a3f8c2d1e9b047f6c3a8d2e1f9b047a3f8c2d1e9b047f6c3a8d2e1f9b04712"
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* ───── 1. PAGE HERO ───── */}
      <section className="pt-32 pb-16 text-center max-w-5xl mx-auto px-6">
        <motion.div
          ref={heroRef}
          initial={{ y: 20, opacity: 0 }}
          animate={isHeroInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
            İndir
          </span>

          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-foreground whitespace-pre-line leading-[1.05] mb-4">
            Hüma'yı Cihazına{"\n"}Kur ve <span className="text-primary">Başla</span>
          </h1>

          <p className="text-base text-muted-foreground mt-4">
            Tüm platformlarda ücretsiz. Kurulum 2 dakika.
          </p>

          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            <span className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs px-3 py-1 rounded-full font-medium">
              v2.0.1 Kararlı Sürüm
            </span>
            <span className="w-px h-4 bg-border hidden sm:block" />
            <span className="text-xs text-muted-foreground">
              Son güncelleme: 8 Haziran 2025
            </span>
            <span className="w-px h-4 bg-border hidden sm:block" />
            <span className="text-xs text-muted-foreground">Açık kaynak</span>
          </div>
        </motion.div>
      </section>

      {/* ───── 2. OS DETECTION BANNER ───── */}
      <div className="max-w-5xl mx-auto px-6">
        <AnimatePresence>
          {detectedOS && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mb-8 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3 flex-wrap sm:flex-nowrap"
            >
              <div className="w-8 h-8 shrink-0">
                <OSIcon os={detectedOS} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">
                  Sisteminiz algılandı: {detectedOS}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Aşağıdaki {detectedOS} sürümü sizin için önerilir.
                </div>
              </div>
              <Link
                href="#"
                className="ml-auto bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shrink-0"
              >
                Hemen İndir
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───── 3. PLATFORM CARDS ───── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* WINDOWS */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0, ease: "easeOut" }}
            className={cn(
              "bg-surface border rounded-2xl p-6 hover:shadow-lg hover:shadow-black/5 hover:border-primary/20 transition-all duration-300 flex flex-col",
              detectedOS === "Windows"
                ? "border-primary/40 bg-primary/[0.02] ring-1 ring-primary/20"
                : "border-border"
            )}
          >
            <Monitor size={28} className="text-primary" />
            <h3 className="text-xl font-semibold text-foreground mt-3">Windows</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Windows 10 ve üzeri
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Download size={12} className="shrink-0" />
                <span>64-bit kurulum dosyası</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <HardDrive size={12} className="shrink-0" />
                <span>48 MB</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cpu size={12} className="shrink-0" />
                <span>x64 / ARM64</span>
              </div>
            </div>

            <Link
              href="#"
              className="mt-6 mt-auto w-full py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Download size={16} />
              İndir (.exe)
            </Link>
            <Link
              href="#"
              className="text-xs text-muted-foreground text-center mt-2 hover:text-foreground transition-colors"
            >
              Portable sürüm →
            </Link>
          </motion.div>

          {/* MACOS */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className={cn(
              "bg-surface border rounded-2xl p-6 hover:shadow-lg hover:shadow-black/5 hover:border-primary/20 transition-all duration-300 flex flex-col",
              detectedOS === "macOS"
                ? "border-primary/40 bg-primary/[0.02] ring-1 ring-primary/20"
                : "border-border"
            )}
          >
            <Laptop size={28} className="text-primary" />
            <h3 className="text-xl font-semibold text-foreground mt-3">macOS</h3>
            <p className="text-xs text-muted-foreground mt-1">
              macOS 12 Monterey ve üzeri
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Download size={12} className="shrink-0" />
                <span>Evrensel binary (Apple Silicon + Intel)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <HardDrive size={12} className="shrink-0" />
                <span>52 MB</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cpu size={12} className="shrink-0" />
                <span>M1 / M2 / M3 + Intel</span>
              </div>
            </div>

            <Link
              href="#"
              className="mt-6 mt-auto w-full py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Download size={16} />
              İndir (.dmg)
            </Link>
            <div
              className="relative text-center mt-2"
              onMouseEnter={() => setShowBrew(true)}
              onMouseLeave={() => setShowBrew(false)}
            >
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Homebrew ile kur →
              </span>
              <AnimatePresence>
                {showBrew && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-surface-elevated border border-border rounded-lg px-3 py-1.5 font-mono text-xs text-foreground whitespace-nowrap z-10 shadow-lg"
                  >
                    brew install --cask huma-browser
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* LINUX */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className={cn(
              "bg-surface border rounded-2xl p-6 hover:shadow-lg hover:shadow-black/5 hover:border-primary/20 transition-all duration-300 flex flex-col",
              detectedOS === "Linux"
                ? "border-primary/40 bg-primary/[0.02] ring-1 ring-primary/20"
                : "border-border"
            )}
          >
            <Terminal size={28} className="text-primary" />
            <h3 className="text-xl font-semibold text-foreground mt-3">Linux</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Ubuntu 20.04+ / Debian 10+
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Download size={12} className="shrink-0" />
                <span>DEB ve RPM paketleri</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <HardDrive size={12} className="shrink-0" />
                <span>45 MB</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cpu size={12} className="shrink-0" />
                <span>x64</span>
              </div>
            </div>

            <Link
              href="#"
              className="mt-6 mt-auto w-full py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Download size={16} />
              İndir (.deb)
            </Link>
            <div className="flex gap-3 justify-center mt-2">
              <Link
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                .rpm paketi →
              </Link>
              <Link
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                AUR →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ───── 4. SYSTEM REQUIREMENTS ───── */}
      <section className="py-16 border-t border-border max-w-5xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">
          Sistem Gereksinimleri
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {systemRequirements.map((platform) => (
            <div key={platform.os}>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {platform.os}
              </h3>
              <div className="flex flex-col gap-3">
                {platform.rows.map((row) => (
                  <div key={row.label} className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">
                      {row.label}
                    </span>
                    <span className="text-xs text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── 5. SECURITY BLOCK ───── */}
      <section className="py-12 border-t border-border max-w-5xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <ShieldCheck size={32} className="text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Güvenli İndirme
          </h2>
          <p className="text-sm text-muted-foreground">
            Tüm dosyalar SHA-256 ile imzalanmış ve VirusTotal tarafından
            taranmıştır.
          </p>

          <div className="mt-6 max-w-lg mx-auto bg-surface border border-border rounded-xl p-4 text-left">
            <div className="text-xs text-muted-foreground mb-2">
              SHA-256 (Windows x64)
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-foreground break-all flex-1 select-all">
                a3f8c2d1e9b047f6c3a8d2e1f9b047a3f8c2d1e9b047f6c3a8d2e1f9b04712
              </span>
              <button
                onClick={handleCopy}
                className="w-8 h-8 rounded-lg border border-border bg-surface-elevated flex items-center justify-center shrink-0 hover:border-border/60 transition-colors cursor-pointer"
                aria-label="Kopyala"
              >
                {copied ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} className="text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 6. FAQ ACCORDION ───── */}
      <section className="py-16 border-t border-border max-w-2xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">
          Sıkça Sorulan Sorular
        </h2>

        <div>
          {faqData.map((item, idx) => {
            const isOpen = openFAQ === idx;
            return (
              <div
                key={idx}
                className="border-b border-border last:border-0"
              >
                <button
                  onClick={() => setOpenFAQ(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between py-4 text-left cursor-pointer group"
                >
                  <span className="text-sm font-medium text-foreground pr-4">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className="text-muted-foreground shrink-0 transition-transform duration-200"
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-muted-foreground pb-4 leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
