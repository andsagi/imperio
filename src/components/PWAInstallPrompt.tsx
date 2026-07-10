/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share, PlusSquare, ArrowUp, Compass, Smartphone, Monitor, Info, CheckCircle2 } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalledNow, setIsInstalledNow] = useState(false);
  const [showIosTutorial, setShowIosTutorial] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone (installed) mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    const isAlreadyInstalled = checkStandalone();

    // Check if user previously dismissed this session or permanently
    const isDismissed = localStorage.getItem('imperio_pwa_dismissed') === 'true';

    // Check for iOS Safari specifically
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // If already installed, don't show prompt
    if (isAlreadyInstalled) return;

    // Listen for Google Chrome / Android / Edge installation prompt trigger
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Delay showing the prompt slightly for better user experience (immediately after load)
      if (!isDismissed) {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS device, we manually trigger the visible banner since beforeinstallprompt is not supported
    if (isIOSDevice && !isAlreadyInstalled && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Fallback: If on standard mobile/desktop where native PWA is supported but prompt hasn't fired yet,
    // we still show a custom prompt to guide them (some browsers have different timings)
    if (!isAlreadyInstalled && !isDismissed && !isIOSDevice) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    // Monitor for successful installation
    const handleAppInstalled = () => {
      console.log('Império PWA was successfully installed!');
      setIsInstalledNow(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      // Clean up dismissal so they can install elsewhere if needed
      localStorage.removeItem('imperio_pwa_dismissed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosTutorial(true);
      return;
    }

    if (!deferredPrompt) {
      // If deferredPrompt is not available, show manual instructions on how to install on Chrome/Edge
      alert('Para instalar o Império:\n1. Clique nos 3 pontos ou ícone de compartilhamento do seu navegador.\n2. Escolha "Instalar aplicativo" ou "Adicionar à tela inicial".');
      return;
    }

    // Show the browser install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      setIsInstalledNow(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Persist user dismissal to not annoy them on every single page refresh (valid for 3 days or indefinitely)
    localStorage.setItem('imperio_pwa_dismissed', 'true');
  };

  // If already standalone or installed during session, don't show anything
  if (isStandalone && !isInstalledNow) return null;

  return (
    <>
      {/* SUCCESS INSTALL CELEBRATION TOAST */}
      <AnimatePresence>
        {isInstalledNow && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md bg-zinc-950 border border-emerald-500/30 p-4 rounded-2xl shadow-2xl z-50 flex items-start gap-3 backdrop-blur-md"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-white font-black text-sm tracking-tight uppercase">Instalação Concluída!</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                O aplicativo <strong>Império - Peças e SOS</strong> já está disponível no seu menu de aplicativos e tela inicial. Desfrute de acesso ultrarrápido!
              </p>
              <button
                type="button"
                onClick={() => setIsInstalledNow(false)}
                className="text-[10px] text-emerald-500 font-extrabold uppercase mt-2 tracking-wider hover:underline"
              >
                Entendi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING INSTALL BANNER */}
      <AnimatePresence>
        {isVisible && !isInstalledNow && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="fixed bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:w-[420px] bg-gradient-to-b from-[#18181B]/95 to-[#0E0E11]/98 border border-neutral-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-50 p-5 backdrop-blur-xl overflow-hidden select-none"
            id="pwa-floating-installer"
          >
            {/* Background glowing decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8C00]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-orange-950/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start gap-4">
              {/* BRAND IMAGE - EXACT APP LOGO */}
              <div className="relative shrink-0 w-14 h-14 rounded-2xl overflow-hidden border border-[#FF8C00]/30 bg-black shadow-lg">
                <img 
                  src="/app_icon_imperio.jpg" 
                  alt="Logo Império" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Text content */}
              <div className="flex-1 text-left min-w-0 pr-5">
                <div className="flex items-center gap-1.5">
                  <span className="bg-[#FF8C00]/15 text-[#FF8C00] font-black text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-[#FF8C00]/25">
                    Instalar PWA
                  </span>
                  <span className="text-slate-500 text-[10px] font-bold flex items-center gap-0.5">
                    {isIOS ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                    {isIOS ? 'Celular / iOS' : 'Mobile & Desktop'}
                  </span>
                </div>
                <h3 className="text-white font-black text-base mt-1 tracking-tight leading-tight">
                  Instalar App Império
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Tenha acesso instantâneo ao SOS 24h, cotações de peças e rastreamento de mecânicos direto da sua tela de início.
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-full cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* BUTTONS ACTION BAR */}
            {!showIosTutorial ? (
              <div className="flex items-center gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-slate-350 hover:text-white font-black uppercase text-[10px] tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer text-center"
                >
                  Agora Não
                </button>
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex-1 bg-gradient-to-r from-[#FF8C00] to-amber-500 hover:from-orange-500 hover:to-amber-600 text-black font-black uppercase text-[10px] tracking-wider py-3 px-4 rounded-xl transition-all shadow-md shadow-[#FF8C00]/10 flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Instalar Grátis</span>
                </button>
              </div>
            ) : (
              /* CUSTOM TUTORIAL FOR APPLE IOS DEVICES (NO NATIVE beforeinstallprompt) */
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-t border-neutral-850 mt-4 pt-4 text-left"
              >
                <div className="bg-black/45 border border-neutral-850 p-3.5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FF8C00]/10 border border-[#FF8C00]/30 text-[#FF8C00] text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                    <p className="text-xs text-slate-300">
                      Toque no botão de <strong>Compartilhar</strong> no menu inferior do Safari:
                    </p>
                    <div className="w-6 h-6 bg-neutral-900 border border-neutral-800 flex items-center justify-center rounded shrink-0">
                      <Share className="w-3.5 h-3.5 text-sky-400 stroke-[2]" />
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FF8C00]/10 border border-[#FF8C00]/30 text-[#FF8C00] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p className="text-xs text-slate-300 leading-normal">
                      Desça a lista de opções e toque em <strong>"Adicionar à Tela de Início"</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FF8C00]/10 border border-[#FF8C00]/30 text-[#FF8C00] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p className="text-xs text-slate-300 leading-normal">
                      Confirme no canto superior direito para finalizar. O ícone oficial da <strong>Coroa Real do Império</strong> aparecerá no seu celular!
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3.5">
                  <button
                    type="button"
                    onClick={() => setShowIosTutorial(false)}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-slate-400 hover:text-white font-black uppercase text-[9px] py-2.5 rounded-lg cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="flex-1 bg-[#FF8C00] text-black font-black uppercase text-[9px] py-2.5 rounded-lg cursor-pointer text-center"
                  >
                    Fechar e Seguir
                  </button>
                </div>
              </motion.div>
            )}

            {/* Subtle disclaimer */}
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider text-center mt-3 flex items-center justify-center gap-1">
              <Compass className="w-2.5 h-2.5 text-[#FF8C00]" />
              <span>Plataforma Oficial Segura e Livre de Vírus</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
