"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Linkedin, Instagram, CheckCircle } from "lucide-react";

const footerColumns = [
  {
    title: "Ürün",
    links: [
      { name: "Özellikler", href: "/#features" },
      { name: "İndir", href: "/download" },
      { name: "Yol Haritası", href: "#" },
      { name: "Beta Programı", href: "#" },
    ],
  },
  {
    title: "Kaynaklar",
    links: [
      { name: "SSS", href: "#" },
      { name: "Topluluk", href: "#" },
      { name: "API", href: "#" },
    ],
  },
  {
    title: "Şirket",
    links: [
      { name: "Hakkında", href: "/about" },
      { name: "Kariyer", href: "#" },
      { name: "Basın", href: "#" },
      { name: "İletişim", href: "#" },
      { name: "Gizlilik", href: "#" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { name: "Kullanım Koşulları", href: "#" },
      { name: "Gizlilik Politikası", href: "#" },
      { name: "Çerez Politikası", href: "#" },
      { name: "KVKK", href: "#" },
      { name: "Güvenlik", href: "#" },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email.includes("@") && email.includes(".")) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <motion.footer
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="border-t border-border bg-background pt-16 pb-8"
    >
      {/* PART 1 — MAIN GRID */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-4 w-fit">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center select-none shadow-sm">
                <span className="text-primary-foreground font-bold text-sm leading-none">
                  H
                </span>
              </div>
              <span className="font-semibold text-foreground text-lg tracking-tight">
                Hüma
              </span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px] whitespace-pre-line mt-2">
              {"Türkiye'nin güvenli, hızlı ve\nakıllı yerli tarayıcısı."}
            </p>

            {/* Social Links */}
            <div className="mt-6 flex gap-3">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/60 transition-all duration-200"
                aria-label="X (Twitter)"
              >
                <span className="text-xs font-bold leading-none">X</span>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/60 transition-all duration-200"
                aria-label="GitHub"
              >
                <Github size={14} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/60 transition-all duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin size={14} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/60 transition-all duration-200"
                aria-label="Instagram"
              >
                <Instagram size={14} />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {footerColumns.map((col) => (
            <div key={col.title} className="col-span-1 md:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* PART 2 — NEWSLETTER STRIP */}
      <div className="border-y border-border py-8 mb-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left text */}
          <div className="text-center md:text-left">
            <div className="text-sm font-semibold text-foreground">
              Güncellemelerden haberdar olun
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Yeni özellikler ve sürümler için bültenimize abone olun.
            </div>
          </div>

          {/* Right input + button */}
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
              placeholder="eposta@adresiniz.com"
              className="w-64 h-9 px-3 rounded-lg text-sm bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
            />

            {subscribed ? (
              <div className="h-9 px-4 rounded-lg flex items-center gap-1.5">
                <CheckCircle size={14} className="text-green-500" />
                <span className="text-sm text-green-500 font-medium">
                  Teşekkürler!
                </span>
              </div>
            ) : (
              <button
                onClick={handleSubscribe}
                className="h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
              >
                Abone Ol
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PART 3 — BOTTOM BAR */}
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground">
          © 2025 Hüma Browser. Tüm hakları saklıdır.
        </span>

        <span className="text-xs text-muted-foreground">
          Türkiye'de 🇹🇷 ile yapıldı
        </span>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-border text-xs text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          v2.0.1 — Kararlı
        </div>
      </div>
    </motion.footer>
  );
}
