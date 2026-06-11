"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "İndir", path: "/download" },
  { name: "Özellikler", path: "/#features" },
  { name: "Hakkında", path: "/about" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on pathname change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path.startsWith("/#")) {
      return false;
    }
    return pathname === path;
  };

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200 bg-background/80 backdrop-blur-md border-b",
        scrolled
          ? "border-border shadow-sm"
          : "border-border/40"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* LEFT - Logo */}
          <Link href="/" className="flex items-center gap-2 group transition-transform duration-200 hover:scale-[1.02]">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center select-none shadow-sm">
              <span className="text-primary-foreground font-bold text-sm leading-none">H</span>
            </div>
            <span className="font-semibold text-foreground text-lg tracking-tight">Hüma</span>
          </Link>

          {/* CENTER - Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={cn(
                  "text-sm transition-colors duration-200 hover:text-foreground",
                  isActive(link.path)
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* RIGHT - Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {/* Desktop Action Button */}
            <Link
              href="/download"
              className="hidden md:inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity duration-200 shadow-sm"
            >
              İndir
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -mr-2 rounded-lg text-foreground hover:bg-surface-elevated transition-colors md:hidden cursor-pointer"
              aria-label="Menüyü Aç"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-full left-0 w-full bg-surface border-b border-border overflow-hidden md:hidden shadow-lg"
          >
            <nav className="flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={cn(
                    "py-3 px-6 text-sm border-b border-border/40 last:border-0 transition-colors hover:bg-surface-elevated",
                    isActive(link.path)
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="px-6 py-4">
                <Link
                  href="/download"
                  className="flex w-full items-center justify-center bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                >
                  İndir
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
