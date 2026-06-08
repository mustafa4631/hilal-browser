import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, Monitor, Command, Terminal, CheckCircle2, Search } from "lucide-react";
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Translations
  const t = {
    tr: {
      searchPlaceholder: "Hilal kurulum paketini seçin...",
      recommended: "Önerilen",
      other: "Diğer Platformlar",
      successTitle: "İndirme Başlatıldı",
      successDesc: "Dosya indirme kuyruğuna eklendi.",
      restart: "Tekrar Başlat",
      safe: "Kaynak GitHub'da",
      navHint: "gezin",
      selectHint: "seç",
      closeHint: "kapat"
    },
    en: {
      searchPlaceholder: "Select Hilal installation package...",
      recommended: "Recommended",
      other: "Other Platforms",
      successTitle: "Download Initiated",
      successDesc: "File has been added to your download queue.",
      restart: "Restart",
      safe: "Source on GitHub",
      navHint: "navigate",
      selectHint: "select",
      closeHint: "close"
    }
  };

  const activeTranslation = t[lang] || t.tr;
  const activeAssets = release?.assets || [];

  const os = detectOS();
  const recommendedAsset = getRecommendedAsset(activeAssets, os);
  const initialAsset = initialAssetId ? activeAssets.find(a => a.id === initialAssetId) : null;
  const primaryAsset = initialAsset || recommendedAsset || (activeAssets.length > 0 ? activeAssets[0] : null);

  const displayAssets = [
    ...(primaryAsset ? [primaryAsset] : []),
    ...activeAssets.filter(a => !primaryAsset || a.id !== primaryAsset.id)
  ];

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setDownloadedAsset(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || downloadedAsset) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % displayAssets.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + displayAssets.length) % displayAssets.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const asset = displayAssets[selectedIndex];
        if (asset) {
          handleDownload(asset);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, displayAssets, selectedIndex, downloadedAsset]);

  const handleDownload = (asset: GithubAsset) => {
    setDownloadedAsset(asset);
    window.location.href = asset.browser_download_url;
  };

  const getAssetDetails = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".exe")) return { title: "Windows Installer", type: "EXE", icon: <Monitor className="w-5 h-5"/> };
    if (lower.endsWith(".zip")) return { title: "Windows Portable", type: "ZIP", icon: <Monitor className="w-5 h-5"/> };
    if (lower.endsWith(".dmg")) return { title: "macOS Universal", type: "DMG", icon: <Command className="w-5 h-5"/> };
    if (lower.endsWith(".deb")) return { title: "Linux DEB", type: "DEB", icon: <Terminal className="w-5 h-5"/> };
    if (lower.endsWith(".appimage")) return { title: "Linux AppImage", type: "AppImage", icon: <Terminal className="w-5 h-5"/> };
    if (lower.endsWith(".tar.gz") || lower.endsWith(".tar.xz")) return { title: "Linux Archive", type: "TAR", icon: <Terminal className="w-5 h-5"/> };
    return { title: "Developer Build", type: "BIN", icon: <Terminal className="w-5 h-5"/> };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] sm:pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -20, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, y: -10, filter: "blur(5px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-2xl bg-white/90 dark:bg-[#111111]/90 border border-black/10 dark:border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden backdrop-blur-3xl flex flex-col"
            style={{ maxHeight: "70vh" }}
          >
            <div className="flex items-center gap-4 px-6 py-5 border-b border-neutral-200/50 dark:border-white/10 bg-white/50 dark:bg-black/50">
              {downloadedAsset ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-pulse" />
              ) : (
                <Search className="w-6 h-6 text-neutral-400" />
              )}
              
              <input 
                 ref={inputRef}
                 readOnly
                 value={downloadedAsset ? activeTranslation.successTitle : activeTranslation.searchPlaceholder}
                 className="w-full bg-transparent text-xl sm:text-2xl font-medium text-neutral-900 dark:text-white outline-none cursor-default"
              />
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest hidden sm:flex">
                <span className="px-2 py-1 rounded bg-neutral-100 dark:bg-white/10 border border-neutral-200/50 dark:border-white/5 shadow-sm">
                  ESC
                </span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!downloadedAsset ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col overflow-y-auto custom-scrollbar"
                >
                  <div className="p-3">
                    {primaryAsset && (
                      <div className="mb-4">
                        <div className="px-3 py-2 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                          {activeTranslation.recommended}
                        </div>
                        <button 
                          onMouseEnter={() => setSelectedIndex(0)}
                          onClick={() => handleDownload(primaryAsset)}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all cursor-pointer ${
                            selectedIndex === 0 
                              ? 'bg-indigo-500 dark:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.01]' 
                              : 'text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`${selectedIndex === 0 ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`}>
                              {getAssetDetails(primaryAsset.name).icon}
                            </div>
                            <div className="text-left">
                              <div className="text-base font-medium">
                                {getAssetDetails(primaryAsset.name).title}
                              </div>
                              <div className={`text-xs mt-0.5 font-mono ${selectedIndex === 0 ? 'text-white/80' : 'text-neutral-500'}`}>
                                {primaryAsset.name} • {formatBytes(primaryAsset.size)}
                              </div>
                            </div>
                          </div>
                          
                          {selectedIndex === 0 && (
                            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono">
                              <span className="bg-black/20 dark:bg-black/40 px-2 py-1 rounded flex items-center gap-1">
                                ↵ Enter
                              </span>
                            </div>
                          )}
                        </button>
                      </div>
                    )}

                    {displayAssets.length > 1 && (
                      <div>
                        <div className="px-3 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          {activeTranslation.other}
                        </div>
                        <div className="space-y-1">
                          {displayAssets.map((asset, index) => {
                            if (index === 0) return null;
                            const isSelected = selectedIndex === index;
                            
                            return (
                              <button 
                                key={asset.id}
                                onMouseEnter={() => setSelectedIndex(index)}
                                onClick={() => handleDownload(asset)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white scale-[1.01]' 
                                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="text-neutral-400">
                                    {getAssetDetails(asset.name).icon}
                                  </div>
                                  <div className="text-left">
                                    <div className="text-sm font-medium">
                                      {getAssetDetails(asset.name).title}
                                    </div>
                                    <div className="text-[10px] mt-0.5 font-mono text-neutral-400">
                                      {asset.name} • {formatBytes(asset.size)}
                                    </div>
                                  </div>
                                </div>
                                
                                {isSelected && (
                                  <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                                    <span className="bg-neutral-200 dark:bg-black/40 px-2 py-1 rounded flex items-center gap-1">
                                      ↵ Enter
                                    </span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  className="flex flex-col items-center justify-center py-16 px-6 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
                    <Download className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-serif text-neutral-900 dark:text-white mb-3">
                    {activeTranslation.successTitle}
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 max-w-[300px] mb-8">
                    {activeTranslation.successDesc}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setDownloadedAsset(null)}
                      className="px-6 py-2.5 rounded-full border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors font-medium text-sm"
                    >
                      {activeTranslation.restart}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!downloadedAsset && (
              <div className="px-6 py-3 bg-neutral-50/80 dark:bg-white/[0.02] border-t border-neutral-200/50 dark:border-white/5 flex items-center justify-between text-[11px] text-neutral-500">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {activeTranslation.safe}
                </div>
                <div className="hidden sm:flex gap-5 font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="flex gap-0.5">
                      <kbd className="bg-neutral-200 dark:bg-white/10 px-1.5 py-0.5 rounded">↑</kbd>
                      <kbd className="bg-neutral-200 dark:bg-white/10 px-1.5 py-0.5 rounded">↓</kbd>
                    </span>
                    {activeTranslation.navHint}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="bg-neutral-200 dark:bg-white/10 px-1.5 py-0.5 rounded">↵</kbd>
                    {activeTranslation.selectHint}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
