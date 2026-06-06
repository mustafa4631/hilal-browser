import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Loader2, Cpu, ChevronRight, ShieldCheck, ArrowLeft, Terminal } from "lucide-react";
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
  const [selectedAsset, setSelectedAsset] = useState<GithubAsset | null>(null);
  const [downloadStep, setDownloadStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [downloadCompleted, setDownloadCompleted] = useState<boolean>(false);

  const t = {
    tr: {
      alphaTag: "ALPHA YAYIN",
      title: "Hilal'i Yükleyin",
      subtitle: "Sisteminiz için optimize edilmiş güvenli Hilal Browser Alpha paketini belirleyin. uBlock Origin varsayılan olarak dahili gelir.",
      otherPlatforms: "Uygun kurulum paketi listelenemedi. Lütfen ana sayfa üzerindeki indirme linklerini kullanın.",
      footerText: "Güvenli kod imzası tarayıcımız tarafından onaylanmıştır. Kaynak kodları GitHub üzerinden açıktır.",
      loadingTitle: "Yükleme Dosyası Hazırlanıyor",
      loadingFooter: "Dosya indirme kuyruğuna aktarıldığında tarayıcınız tarafından kaydedilecektir. Lütfen bu pencereyi kapatmayın.",
      successTitle: "İndirme Başlatıldı",
      successDesc: "dosyası tarayıcınızın indirme kuyruğuna başarıyla teslim edildi.",
      downloadOther: "Diğer platform sürümlerini gör",
      osWindowsDetail: "Windows x64 Installer",
      osWinZipDetail: "Windows taşınabilir ZIP paketi",
      osMacDetail: "macOS Universal (Apple Silicon & Intel)",
      osDebDetail: "Linux Debian/Ubuntu DEB",
      osAppImageDetail: "Linux AppImage Çalıştırılabilir Paket",
      osTarballDetail: "Linux tar.gz taşınabilir arşivi",
      osSrcDetail: "Hilal Kaynak Kodu Arşivi",
      osOtherDetail: "Geliştirici İkili Dosyası",
      otherVersions: "Diğer Platformlar",
      sourceCode: "Kaynak Kodu",
      simSteps: [
        { label: "Güvenli bağlantı kuruluyor...", duration: 350 },
        { label: "Paket imzaları doğrulanıyor...", duration: 400 },
        { label: "Hilal Alpha paketi derleniyor (Gecko-128)...", duration: 500 },
        { label: "İndirme akışı başlatılıyor...", duration: 250 }
      ]
    },
    en: {
      alphaTag: "ALPHA BUILD",
      title: "Install Hilal",
      subtitle: "Select the secure Hilal Browser Alpha bundle built for your platform. uBlock Origin is integrated by default.",
      otherPlatforms: "No selectable packages found. Please use the homepage links.",
      footerText: "Secure code signature is verified. Source code is openly auditable on GitHub.",
      loadingTitle: "Preparing Package Stream",
      loadingFooter: "Once the stream initializes, the file will be saved by your browser. Please do not close this window.",
      successTitle: "Download Initiated",
      successDesc: "has been successfully dispatched to your browser's download queue.",
      downloadOther: "View other platform builds",
      osWindowsDetail: "Windows x64 Installer",
      osWinZipDetail: "Windows portable ZIP package",
      osMacDetail: "macOS Universal (Apple Silicon & Intel)",
      osDebDetail: "Linux Debian/Ubuntu DEB",
      osAppImageDetail: "Linux AppImage Executable Package",
      osTarballDetail: "Linux tar.gz portable archive",
      osSrcDetail: "Hilal Source Archive",
      osOtherDetail: "Developer Binary Build",
      otherVersions: "Other Targets",
      sourceCode: "Source Code",
      simSteps: [
        { label: "Establishing secure connection...", duration: 350 },
        { label: "Verifying package signatures...", duration: 400 },
        { label: "Assembling Hilal Alpha bundle (Gecko-128)...", duration: 500 },
        { label: "Initiating download stream...", duration: 250 }
      ]
    }
  };

  const activeTranslation = t[lang] || t.tr;
  const simulationSteps = activeTranslation.simSteps;

  useEffect(() => {
    if (!isOpen) {
      setSelectedAsset(null);
      setDownloadStep(0);
      setProgress(0);
      setDownloadCompleted(false);
    } else {
      const activeAssets = release?.assets || [];
      if (initialAssetId) {
        const found = activeAssets.find(a => a.id === initialAssetId);
        if (found) {
          setSelectedAsset(found);
          return;
        }
      }
      
      const os = detectOS();
      const recommended = getRecommendedAsset(activeAssets, os);
      if (recommended) {
        setSelectedAsset(recommended);
      }
    }
  }, [isOpen, initialAssetId, release]);

  useEffect(() => {
    let timer: any;
    if (selectedAsset && downloadStep < simulationSteps.length) {
      const currentStepObj = simulationSteps[downloadStep];
      const stepDuration = currentStepObj.duration;
      const startTime = Date.now();

      const stepInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const stepProgress = Math.min((elapsed / stepDuration) * 100, 100);
        const baseProgress = (downloadStep / simulationSteps.length) * 100;
        const currentProgressContribution = stepProgress / simulationSteps.length;
        setProgress(Math.round(baseProgress + currentProgressContribution));
      }, 25);

      timer = setTimeout(() => {
        clearInterval(stepInterval);
        if (downloadStep < simulationSteps.length - 1) {
          setDownloadStep(prev => prev + 1);
        } else {
          setProgress(100);
          setDownloadCompleted(true);
          
          setTimeout(() => {
            window.location.href = selectedAsset.browser_download_url;
          }, 300);
        }
      }, stepDuration);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [selectedAsset, downloadStep, simulationSteps]);

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

  const activeAssets = release?.assets || [];

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
              {!selectedAsset ? (
                // Platform build lists
                <div className="animate-fade-in">
                  <p className="text-xs leading-relaxed text-neutral-550 dark:text-neutral-400 mb-5">
                    {activeTranslation.subtitle}
                  </p>

                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 select-none" id="asset-list">
                    {activeAssets.length > 0 ? (
                      activeAssets.map((asset) => {
                        const { os, icon, desc } = getAssetDetails(asset.name);
                        return (
                          <button
                            key={asset.id}
                            id={`download-asset-${asset.id}`}
                            onClick={() => setSelectedAsset(asset)}
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-neutral-200/40 bg-white/40 hover:bg-white dark:border-neutral-850/40 dark:bg-neutral-900/10 dark:hover:bg-neutral-900/30 text-left group transition-all duration-300 hover:scale-[1.01] hover:shadow-sm cursor-pointer"
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
                                <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
                                  {os} <span className="font-mono text-[9px] text-neutral-450 dark:text-neutral-500">({asset.name.split('.').pop()?.toUpperCase()})</span>
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
                      })
                    ) : (
                      <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                        {activeTranslation.otherPlatforms}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-2.5 text-[9.5px] leading-relaxed text-neutral-400 dark:text-neutral-500 border-t border-neutral-250/20 pt-4 dark:border-neutral-850/40">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{activeTranslation.footerText}</span>
                  </div>
                </div>
              ) : (
                // Simulation Loader
                <div className="py-4 text-center" id="downloading-progress">
                  <AnimatePresence mode="wait">
                    {!downloadCompleted ? (
                      <motion.div
                        key="loading-spinner"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex flex-col items-center justify-center"
                      >
                        <div className="relative mb-6 flex items-center justify-center">
                          {/* Pulsing glow behind spinner */}
                          <div className="absolute w-12 h-12 rounded-full bg-cobalt/10 dark:bg-cobalt/20 blur-xl animate-pulse" />
                          <Loader2 className="h-12 w-12 animate-spin text-cobalt dark:text-sky-450" />
                          <span className="absolute font-mono text-[10px] font-bold text-neutral-700 dark:text-neutral-200">
                            {progress}%
                          </span>
                        </div>

                        <h4 className="font-sans text-xs font-bold tracking-wider uppercase text-neutral-900 dark:text-white">
                          {activeTranslation.loadingTitle}
                        </h4>
                        
                        <p className="mt-1 h-5 text-xs text-neutral-450 dark:text-neutral-500 italic">
                          {simulationSteps[downloadStep]?.label}
                        </p>

                        {/* Progress Bar Container */}
                        <div className="mt-6 w-full max-w-[260px] overflow-hidden rounded-full bg-neutral-200/60 dark:bg-neutral-900/60 p-0.5 border border-neutral-200/10 dark:border-neutral-800/10">
                          <motion.div
                            className="h-1.5 rounded-full bg-gradient-to-r from-cobalt to-sky-400 shadow-[0_0_8px_rgba(15,62,231,0.4)]"
                            style={{ width: `${progress}%` }}
                            transition={{ ease: "easeInOut" }}
                          />
                        </div>

                        <p className="mt-6 text-[9.5px] leading-relaxed text-neutral-400 dark:text-neutral-500 max-w-[260px] mx-auto select-none">
                          {activeTranslation.loadingFooter}
                        </p>

                        <button
                          id="change-on-loading-btn"
                          onClick={() => setSelectedAsset(null)}
                          className="mt-6 flex items-center gap-1.5 mx-auto text-[9.5px] font-mono text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          <span>{activeTranslation.downloadOther}</span>
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="success-screen"
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center justify-center py-2"
                      >
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500 dark:bg-green-950/20 dark:text-green-400 border border-green-500/20 dark:border-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.15)] animate-bounce">
                          <Check className="h-6 w-6 stroke-[3px]" />
                        </div>

                        <h4 className="font-serif italic text-lg font-light text-neutral-900 dark:text-white">
                          {activeTranslation.successTitle}
                        </h4>

                        <p className="mt-3.5 text-xs text-neutral-550 dark:text-neutral-400 max-w-xs leading-relaxed px-2">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 break-all">{selectedAsset.name}</span> {activeTranslation.successDesc}
                        </p>

                        <button
                          id="reset-modal-btn"
                          onClick={() => setSelectedAsset(null)}
                          className="mt-8 flex items-center gap-1.5 mx-auto text-[9.5px] font-mono text-neutral-450 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          <span>{activeTranslation.downloadOther}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
