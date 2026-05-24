import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Loader2, Cpu, ChevronRight } from "lucide-react";
import { GithubRelease, GithubAsset } from "../types";
import { formatBytes, detectOS, getRecommendedAsset } from "../utils/github";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: GithubRelease | null;
  lang: 'tr' | 'en';
  initialAssetId?: number | null;
}

interface SimulatedStep {
  label: string;
  duration: number; // millisecond duration
}

export default function DownloadModal({ isOpen, onClose, release, lang, initialAssetId }: DownloadModalProps) {
  const [selectedAsset, setSelectedAsset] = useState<GithubAsset | null>(null);
  const [downloadStep, setDownloadStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [downloadCompleted, setDownloadCompleted] = useState<boolean>(false);

  // Localization terms dictionary
  const t = {
    tr: {
      alphaTag: "ALPHA SÜRÜM",
      title: "Hilal'i Keşfedin",
      subtitle: "İşletim sisteminize uygun olan güvenli Hilal Browser Alpha yapısını seçin. uBlock Origin varsayılan olarak entegre edilmiştir.",
      otherPlatforms: "Seçilebilir kurulum paketi bulunamadı. Lütfen ana sayfadaki indirme alanlarını kullanın.",
      footerText: "Güvenli kod imzası tarayıcımız tarafından sağlanır. Kaynak kodları GitHub üzerinden her zaman açıktır.",
      loadingTitle: "Paketiniz Hazırlanıyor",
      loadingFooter: "İndirme tamamlandığında dosya tarayıcınız tarafından kaydedilecektir. Lütfen pencereleri kapatmayın.",
      successTitle: "İndirme Başlatıldı!",
      successDesc: "tarayıcı indirme kuyruğuna teslim edildi.",
      downloadOther: "Başka bir platform için indir",
      osWindowsDetail: "Windows x64 Sürümü (Kurulum Dosyası)",
      osMacDetail: "macOS Intel ve Apple Silicon Sürümü",
      osDebDetail: "Linux DEB Sürümü (64-bit)",
      osAppImageDetail: "Çalıştırılabilir AppImage Paketi",
      osSrcDetail: "Hilal Derlenebilir Kod Arşivi",
      osOtherDetail: "Geliştirici İkili Paketi",
      otherVersions: "Diğer Sürümler",
      sourceCode: "Kaynak Kodu",
      simSteps: [
        { label: "Güvenli bağlantı kuruluyor...", duration: 500 },
        { label: "Paket imzaları doğrulanıyor...", duration: 600 },
        { label: "Hilal Alpha yükleyici arşivi oluşturuluyor (Gecko-128)...", duration: 800 },
        { label: "Sunucu yanıtı optimize ediliyor...", duration: 450 },
        { label: "İndirme başlatılıyor...", duration: 300 }
      ]
    },
    en: {
      alphaTag: "ALPHA RELEASE",
      title: "Discover Hilal",
      subtitle: "Select the secure Hilal Browser Alpha build suitable for your operating system. uBlock Origin is pre-integrated by default.",
      otherPlatforms: "No selectable installation packages found. Please use the homepage links.",
      footerText: "Secure code signature is verified. Source code is always openly visible on GitHub.",
      loadingTitle: "Preparing Your Package",
      loadingFooter: "When the download completes, the file will be saved by your browser automatically. Please do not close windows.",
      successTitle: "Download Started!",
      successDesc: "has been successfully dispatched to your browser's download queue.",
      downloadOther: "Download for another platform",
      osWindowsDetail: "Windows x64 Build (Setup Installer)",
      osMacDetail: "macOS Intel & Apple Silicon Build",
      osDebDetail: "Linux DEB Package (64-bit)",
      osAppImageDetail: "Executable AppImage Package",
      osSrcDetail: "Hilal Compilable Source Code Archive",
      osOtherDetail: "Developer Binary Build",
      otherVersions: "Other Versions",
      sourceCode: "Source Code",
      simSteps: [
        { label: "Establishing secure connection...", duration: 500 },
        { label: "Verifying package signatures...", duration: 600 },
        { label: "Assembling Hilal Alpha bundle (Gecko-128)...", duration: 800 },
        { label: "Optimizing response buffers...", duration: 450 },
        { label: "Initiating download stream...", duration: 300 }
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
      
      // Auto OS understanding and pre-selection
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
        
        // Calculate total progressive progress across steps
        const baseProgress = (downloadStep / simulationSteps.length) * 100;
        const currentProgressContribution = stepProgress / simulationSteps.length;
        setProgress(Math.round(baseProgress + currentProgressContribution));
      }, 30);

      timer = setTimeout(() => {
        clearInterval(stepInterval);
        if (downloadStep < simulationSteps.length - 1) {
          setDownloadStep(prev => prev + 1);
        } else {
          // Last step finished, trigger download!
          setProgress(100);
          setDownloadCompleted(true);
          
          // Small delay before actual browser download trigger
          setTimeout(() => {
            window.location.href = selectedAsset.browser_download_url;
          }, 400);
        }
      }, stepDuration);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [selectedAsset, downloadStep, simulationSteps]);

  // Map file extension to clean title and OS description based on language
  const getAssetDetails = (filename: string) => {
    const lower = filename.toLowerCase();
    const curr = activeTranslation;
    if (lower.endsWith(".exe")) {
      return { os: "Windows", icon: "❖", desc: curr.osWindowsDetail };
    }
    if (lower.endsWith(".dmg")) {
      return { os: "macOS", icon: "", desc: curr.osMacDetail };
    }
    if (lower.endsWith(".deb")) {
      return { os: "Debian/Ubuntu", icon: "🐧", desc: curr.osDebDetail };
    }
    if (lower.endsWith(".appimage")) {
      return { os: "Linux Portable", icon: "📦", desc: curr.osAppImageDetail };
    }
    if (lower.endsWith(".zip") || lower.endsWith(".tar.gz")) {
      return { os: curr.sourceCode, icon: "🗂", desc: curr.osSrcDetail };
    }
    return { os: curr.otherVersions, icon: "⚙", desc: curr.osOtherDetail };
  };

  const activeAssets = release?.assets || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#080B10]/70 backdrop-blur-md transition-opacity"
            id="modal-overlay"
          />

          {/* Modal Content Box */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#e7e2da] bg-[#FAF8F5] p-6 shadow-2xl dark:border-[#1F2937] dark:bg-[#0B0F19] transition-colors"
            id="download-modal-card"
          >
            {/* Soft decorative ambient color dot inside modal */}
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-teal-500/10 blur-xl pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-[#e7e2da]/60 pb-4 dark:border-[#1F2937]/60">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-teal-700 dark:text-teal-400">
                  {activeTranslation.alphaTag}
                </span>
                <h3 className="mt-1 font-serif text-xl font-medium tracking-tight text-[#1C1917] dark:text-[#F4F4F5]">
                  {activeTranslation.title}
                </h3>
              </div>
              <button
                id="close-modal-btn"
                onClick={onClose}
                className="rounded-full p-2 text-[#1C1917]/50 hover:bg-[#e7e2da]/50 dark:text-[#F4F4F5]/50 dark:hover:bg-[#1F2937]/50 transition-colors"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body state switcher */}
            <div className="relative mt-4">
              {!selectedAsset ? (
                // Asset List Select Area
                <div>
                  <p className="text-sm leading-relaxed text-[#1C1917]/70 dark:text-[#E2E8F0]/70 mb-4">
                    {activeTranslation.subtitle}
                  </p>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1" id="asset-list">
                    {activeAssets.length > 0 ? (
                      activeAssets.map((asset) => {
                        const { os, icon, desc } = getAssetDetails(asset.name);
                        return (
                          <button
                            key={asset.id}
                            id={`download-asset-${asset.id}`}
                            onClick={() => setSelectedAsset(asset)}
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-[#e7e2da] bg-[#FBF9F4] text-left hover:border-teal-600/50 hover:bg-white dark:border-[#1F2937] dark:bg-[#0B0F19] dark:hover:border-teal-500/50 dark:hover:bg-[#111827] group transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl select-none">{icon}</span>
                              <div>
                                <div className="text-sm font-semibold text-[#1C1917] dark:text-[#F4F4F5]">
                                  {os} ({asset.name.split('.').pop()?.toUpperCase()})
                                </div>
                                <div className="text-xs text-[#1C1917]/60 dark:text-[#F4F4F5]/60">
                                  {desc}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-[#1C1917]/40 dark:text-[#F4F4F5]/40">
                                {formatBytes(asset.size)}
                              </span>
                              <ChevronRight className="h-4 w-4 text-[#1C1917]/30 group-hover:text-teal-600 dark:text-[#F4F4F5]/30 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      // No explicit release asset list placeholder (fallback)
                      <div className="py-8 text-center text-sm text-[#1C1917]/40 dark:text-[#F4F4F5]/40">
                        {activeTranslation.otherPlatforms}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-[11px] leading-relaxed text-[#1C1917]/50 dark:text-[#F4F4F5]/50 border-t border-[#e7e2da]/40 pt-3 dark:border-[#1F2937]/40">
                    <Cpu className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span>{activeTranslation.footerText}</span>
                  </div>
                </div>
              ) : (
                // Downloading Progress Area
                <div className="py-6 text-center" id="downloading-progress">
                  <AnimatePresence mode="wait">
                    {!downloadCompleted ? (
                      <motion.div
                        key="loading-spinner"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center justify-center"
                      >
                        <div className="relative mb-6">
                          <Loader2 className="h-12 w-12 animate-spin text-teal-600 dark:text-teal-400" />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-semibold text-teal-700 dark:text-teal-300">
                            {progress}%
                          </span>
                        </div>

                        <h4 className="font-serif text-lg font-medium text-[#1C1917] dark:text-[#F4F4F5]">
                          {activeTranslation.loadingTitle}
                        </h4>
                        
                        <p className="mt-1.5 h-6 text-sm italic text-[#1C1917]/70 dark:text-[#E2E8F0]/70">
                          {simulationSteps[downloadStep]?.label}
                        </p>

                        {/* Custom Outer Bar */}
                        <div className="mt-6 w-full max-w-xs overflow-hidden rounded-full bg-[#e7e2da] dark:bg-[#1E293B]">
                          <motion.div
                            className="h-2 rounded-full bg-gradient-to-r from-teal-600 to-teal-400"
                            style={{ width: `${progress}%` }}
                            transition={{ ease: "easeInOut" }}
                          />
                        </div>

                        <p className="mt-8 text-xs text-[#1C1917]/40 dark:text-[#F4F4F5]/40 max-w-xs">
                          {activeTranslation.loadingFooter}
                        </p>

                        <button
                          id="change-on-loading-btn"
                          onClick={() => setSelectedAsset(null)}
                          className="mt-4 text-xs font-semibold text-teal-600 hover:text-teal-500 underline dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                        >
                          {activeTranslation.downloadOther}
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="success-screen"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center justify-center py-4"
                      >
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                          <Check className="h-7 w-7 stroke-[3px]" />
                        </div>

                        <h4 className="font-serif text-xl font-semibold text-[#1C1917] dark:text-[#F4F4F5]">
                          {activeTranslation.successTitle}
                        </h4>

                        <p className="mt-2 text-sm text-[#1C1917]/70 dark:text-[#E2E8F0]/70 max-w-sm">
                          <span className="strong font-semibold text-teal-600 dark:text-teal-400">{selectedAsset.name}</span> {activeTranslation.successDesc}
                        </p>

                        <button
                          id="reset-modal-btn"
                          onClick={() => setSelectedAsset(null)}
                          className="mt-6 text-xs font-semibold text-teal-700 underline hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300"
                        >
                          {activeTranslation.downloadOther}
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
