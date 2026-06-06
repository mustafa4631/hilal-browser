import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Cpu, ChevronRight, ShieldCheck, ArrowLeft, Download, ExternalLink } from "lucide-react";
import { GithubRelease, GithubAsset } from "../types";
import { formatBytes, detectOS, getRecommendedAsset } from "../utils/github";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: GithubRelease | null;
  lang: 'tr' | 'en';
  initialAssetId?: number | null;
}

export default function DownloadModal({ isOpen, onClose, release, lang, initialAssetId }: DownloadModalProps) {
  const [downloadedAsset, setDownloadedAsset] = useState<GithubAsset | null>(null);

  const t = {
    tr: {
      alphaTag: "ALPHA YAYIN",
      title: "Hilal'i Yükleyin",
      subtitle: "Güvenli, bağımsız ve yerleşik reklam engelleyicili internet deneyimi.",
      recommended: "Sisteminiz İçin Önerilen",
      downloadBtn: "Hemen İndir",
      otherTargets: "Tüm Platform Sürümleri",
      footerText: "Güvenli kod imzası tarayıcımız tarafından onaylanmıştır. Kaynak kodları GitHub üzerinde açıktır.",
      successTitle: "İndirme Başlatıldı!",
      successDesc: "Dosyanız tarayıcınızın indirme kuyruğuna teslim edildi. İndirme otomatik başlamadıysa,",
      successClick: "buraya tıklayarak",
      successRestart: "tekrar başlatabilirsiniz.",
      backBtn: "Sürümlere Geri Dön",
      osWindowsDetail: "Windows x64 Kurulum Paketi",
      osWinZipDetail: "Windows Taşınabilir ZIP Arşivi",
      osMacDetail: "macOS Evrensel Paket (Intel & Apple Silicon)",
      osDebDetail: "Linux Debian/Ubuntu DEB Paketi",
      osAppImageDetail: "Linux AppImage Çalıştırılabilir Dosyası",
      osTarballDetail: "Linux Taşınabilir tar.gz Arşivi",
      osSrcDetail: "Hilal Kaynak Kodları",
      osOtherDetail: "Geliştirici Derlemesi"
    },
    en: {
      alphaTag: "ALPHA BUILD",
      title: "Install Hilal",
      subtitle: "Secure, independent, and ad-free web browsing experience.",
      recommended: "Recommended for Your System",
      downloadBtn: "Download Now",
      otherTargets: "All Platform Builds",
      footerText: "Secure code signature is verified. Source code is openly auditable on GitHub.",
      successTitle: "Download Initiated!",
      successDesc: "Your file has been sent to the browser's download queue. If it didn't start automatically,",
      successClick: "click here",
      successRestart: "to restart the download.",
      backBtn: "Back to Platform List",
      osWindowsDetail: "Windows x64 Installer Bundle",
      osWinZipDetail: "Windows Portable ZIP Package",
      osMacDetail: "macOS Universal Bundle (Intel & Apple Silicon)",
      osDebDetail: "Linux Debian/Ubuntu DEB Package",
      osAppImageDetail: "Linux AppImage Executable",
      osTarballDetail: "Linux Portable tar.gz Archive",
      osSrcDetail: "Hilal Source Archive",
      osOtherDetail: "Developer Binary Build"
    }
  };

  const activeTranslation = t[lang] || t.tr;
  const activeAssets = release?.assets || [];

  // Find recommended asset
  const os = detectOS();
  const recommendedAsset = getRecommendedAsset(activeAssets, os);

  // If initialAssetId is provided, we can look it up
  const initialAsset = initialAssetId ? activeAssets.find(a => a.id === initialAssetId) : null;
  const primaryAsset = initialAsset || recommendedAsset || (activeAssets.length > 0 ? activeAssets[0] : null);

  useEffect(() => {
    if (!isOpen) {
      setDownloadedAsset(null);
    }
  }, [isOpen]);

  const handleDownloadTrigger = (asset: GithubAsset) => {
    setDownloadedAsset(asset);
    window.location.href = asset.browser_download_url;
  };

  const getAssetDetails = (filename: string) => {
    const lower = filename.toLowerCase();
    const curr = activeTranslation;
    if (lower.endsWith(".exe")) {
      return { os: "Windows", icon: "WIN", desc: curr.osWindowsDetail };
    }
    if (lower.endsWith(".dmg")) {
      return { os: "macOS", icon: "MAC", desc: curr.osMacDetail };
    }
    if (lower.endsWith(".deb")) {
      return { os: "Linux DEB", icon: "LNX", desc: curr.osDebDetail };
    }
    if (lower.endsWith(".appimage")) {
      return { os: "Linux Portable", icon: "LNX", desc: curr.osAppImageDetail };
    }
    if (lower.endsWith(".tar.gz") || lower.endsWith(".tar.xz")) {
      if (lower.includes("source")) {
        return { os: curr.sourceCode, icon: "SRC", desc: curr.osSrcDetail };
      }
      return { os: "Linux Tarball", icon: "LNX", desc: curr.osTarballDetail };
    }
    if (lower.endsWith(".zip")) {
      if (lower.includes("source")) {
        return { os: curr.sourceCode, icon: "SRC", desc: curr.osSrcDetail };
      }
      return { os: "Windows Portable", icon: "WIN", desc: curr.osWinZipDetail };
    }
    return { os: curr.otherVersions, icon: "BIN", desc: curr.osOtherDetail };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-950/60 backdrop-blur-[4px] transition-opacity"
            id="modal-overlay"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 12 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200/40 bg-white/90 dark:border-neutral-850/50 dark:bg-neutral-950/90 shadow-2xl backdrop-blur-xl p-6 md:p-7 transition-colors shadow-black/5 dark:shadow-black/50"
            id="download-modal-card"
          >
            {/* Decorative background ambient glows */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-cobalt/5 dark:bg-cobalt/10 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-neutral-200/40 pb-4.5 dark:border-neutral-850/40 z-10">
              <div>
                <span className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 px-3 py-0.5 text-[8.5px] font-mono font-bold tracking-widest text-neutral-450 dark:text-neutral-500 select-none">
                  {activeTranslation.alphaTag}
                </span>
                <h3 className="mt-2.5 font-serif italic text-xl font-light text-neutral-900 dark:text-white tracking-wide">
                  {activeTranslation.title}
                </h3>
              </div>
              <button
                id="close-modal-btn"
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-400 dark:text-neutral-500 transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="relative mt-5 z-10">
              <AnimatePresence mode="wait">
                {!downloadedAsset ? (
                  <motion.div
                    key="selector-view"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <p className="text-xs leading-relaxed text-neutral-550 dark:text-neutral-400">
                      {activeTranslation.subtitle}
                    </p>

                    {/* Primary Recommended Download Button */}
                    {primaryAsset && (
                      <div className="rounded-2xl border border-cobalt/20 bg-cobalt/[0.03] dark:border-sky-500/20 dark:bg-sky-550/[0.04] p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold tracking-widest text-cobalt dark:text-sky-400 uppercase select-none">
                            {activeTranslation.recommended}
                          </span>
                          <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-500 select-none">
                            {formatBytes(primaryAsset.size)}
                          </span>
                        </div>
                        
                        <div className="mt-3 flex items-start gap-3.5">
                          <span className={`w-9 h-9 flex items-center justify-center rounded-xl text-[10px] font-mono font-bold border ${
                            getAssetDetails(primaryAsset.name).icon === 'WIN' 
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                              : getAssetDetails(primaryAsset.name).icon === 'MAC' 
                                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                : getAssetDetails(primaryAsset.name).icon === 'LNX'
                                  ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                  : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'
                          }`}>
                            {getAssetDetails(primaryAsset.name).icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-neutral-850 dark:text-neutral-100 truncate">
                              {getAssetDetails(primaryAsset.name).os} Build
                            </h4>
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                              {primaryAsset.name}
                            </p>
                          </div>
                        </div>

                        <button
                          id="primary-download-btn"
                          onClick={() => handleDownloadTrigger(primaryAsset)}
                          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-cobalt dark:bg-white text-white dark:text-neutral-950 py-3 text-[10px] font-bold tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-cobalt/10 dark:shadow-none"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>{activeTranslation.downloadBtn}</span>
                        </button>
                      </div>
                    )}

                    {/* All Other Platforms list */}
                    <div>
                      <h4 className="text-[9px] font-mono font-bold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase mb-3 select-none">
                        {activeTranslation.otherTargets}
                      </h4>

                      <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1" id="asset-list">
                        {activeAssets.map((asset) => {
                          const { os, icon, desc } = getAssetDetails(asset.name);
                          // Skip recommended if it's the primary one shown above
                          if (primaryAsset && asset.id === primaryAsset.id) return null;
                          return (
                            <button
                              key={asset.id}
                              id={`download-asset-${asset.id}`}
                              onClick={() => handleDownloadTrigger(asset)}
                              className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200/40 bg-white/40 hover:bg-white dark:border-neutral-850/40 dark:bg-neutral-900/10 dark:hover:bg-neutral-900/30 text-left group transition-all duration-300 hover:scale-[1.01] hover:shadow-sm cursor-pointer"
                            >
                              <div className="flex items-center gap-3.5">
                                <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-[9px] font-mono font-bold border transition-colors ${
                                  icon === 'WIN' 
                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                                    : icon === 'MAC' 
                                      ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                      : icon === 'LNX'
                                        ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                        : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'
                                }`}>
                                  {icon}
                                </span>
                                <div>
                                  <div className="text-xs font-bold text-neutral-850 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
                                    {os} <span className="font-mono text-[9px] font-normal text-neutral-450 dark:text-neutral-500">({asset.name.split('.').pop()?.toUpperCase()})</span>
                                  </div>
                                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                    {desc}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9.5px] font-medium text-neutral-400 dark:text-neutral-500">
                                  {formatBytes(asset.size)}
                                </span>
                                <ChevronRight className="h-4 w-4 text-neutral-350 dark:text-neutral-650 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2.5 text-[9.5px] leading-relaxed text-neutral-400 dark:text-neutral-500 border-t border-neutral-250/20 pt-4 dark:border-neutral-850/40 select-none">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{activeTranslation.footerText}</span>
                    </div>
                  </motion.div>
                ) : (
                  // Success Screen
                  <motion.div
                    key="success-screen"
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    className="flex flex-col items-center justify-center py-6 text-center"
                  >
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-550/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-bounce">
                      <Check className="h-7 w-7 stroke-[3px]" />
                    </div>

                    <h4 className="font-serif italic text-lg font-light text-neutral-900 dark:text-white">
                      {activeTranslation.successTitle}
                    </h4>

                    <p className="mt-4 text-xs text-neutral-550 dark:text-neutral-400 max-w-xs leading-relaxed px-2">
                      {activeTranslation.successDesc}{" "}
                      <a
                        href={downloadedAsset.browser_download_url}
                        className="font-semibold text-cobalt dark:text-sky-400 underline hover:opacity-90"
                      >
                        {activeTranslation.successClick}
                      </a>{" "}
                      {activeTranslation.successRestart}
                    </p>

                    <div className="mt-5 rounded-2xl border border-neutral-250/30 bg-neutral-50/50 dark:border-neutral-850/30 dark:bg-neutral-900/10 p-3 max-w-xs w-full text-left">
                      <div className="text-[9px] font-mono font-bold tracking-widest text-neutral-450 dark:text-neutral-500 uppercase">
                        Dosya Adı / Filename
                      </div>
                      <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1 truncate">
                        {downloadedAsset.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">
                        {formatBytes(downloadedAsset.size)}
                      </div>
                    </div>

                    <button
                      id="reset-modal-btn"
                      onClick={() => setDownloadedAsset(null)}
                      className="mt-8 flex items-center gap-1.5 mx-auto text-[9.5px] font-mono text-neutral-450 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>{activeTranslation.backBtn}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
