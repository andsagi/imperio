/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Truck, Store, FileText, AlertTriangle, ChevronRight, HelpCircle, RefreshCw, LogOut, Crown, Car, Bike, Lock, Unlock, ShieldAlert, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents import
import LoginOnboarding from './components/LoginOnboarding';
import TruckerHome from './components/TruckerHome';
import SupplierDashboard from './components/SupplierDashboard';
import SOSModal from './components/SOSModal';
import NicheSelector from './components/NicheSelector';
import ImperioLogo from './components/ImperioLogo';
import LegalConsentModal from './components/LegalConsentModal';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Data layers
import { Supplier, CatalogItem, Review } from './types';
import { loadSuppliers, saveSuppliers, loadCatalogItems, saveCatalogItems, loadReviews, saveReviews, resetToDefaults, initializeDatabase, deleteUserAccountFromDB } from './mockData';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  const [role, setRole] = useState<'onboarding' | 'trucker' | 'supplier' | 'seller' | 'plan'>('onboarding');
  const [niche, setNiche] = useState<'pesados' | 'passeio' | 'motos' | null>(null);
  const [username, setUsername] = useState('Roberto da Silva');
  const [phone, setPhone] = useState('(11) 99999-9999');
  const [truckModel, setTruckModel] = useState('Volvo FH 540 Globetrotter');

  // Admin/Developer Mode & Password Protection states (Secure backend validation)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('imperio_admin_unlocked') === 'true';
  });
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Informational footer modal states
  const [infoModalTab, setInfoModalTab] = useState<'about' | 'faq' | 'support' | null>(null);

  // Compliance: Global state for terms/privacy modals after login
  const [globalLegalOpen, setGlobalLegalOpen] = useState(false);
  const [globalLegalTab, setGlobalLegalTab] = useState<'terms' | 'privacy'>('terms');

  useEffect(() => {
    const handleOpenLegal = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setGlobalLegalTab(customEvent.detail.tab || 'terms');
        setGlobalLegalOpen(true);
      }
    };
    
    const handleLogoutTrigger = () => {
      handleLogout();
    };

    window.addEventListener('open-legal-modal', handleOpenLegal);
    window.addEventListener('logout-trigger', handleLogoutTrigger);

    return () => {
      window.removeEventListener('open-legal-modal', handleOpenLegal);
      window.removeEventListener('logout-trigger', handleLogoutTrigger);
    };
  }, []);
  const [sellerInfo, setSellerInfo] = useState<{ id: string; supplierId: string; name: string; email: string } | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  
  // Persistence states
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sosOpen, setSosOpen] = useState(false);

  // Load suppliers and catalog initially
  useEffect(() => {
    // 1. Initial local load
    setSuppliers(loadSuppliers());
    setCatalogItems(loadCatalogItems());
    setReviews(loadReviews());

    let unsubSuppliers: (() => void) | null = null;
    let unsubCatalog: (() => void) | null = null;
    let unsubReviews: (() => void) | null = null;
    let isMounted = true;

    // 2. Initialize Firestore DB and Seed if empty
    initializeDatabase().then(() => {
      if (!isMounted) return;
      // 3. Attach real-time collections synchronization
      unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
        const list: Supplier[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Supplier);
        });
        if (list.length > 0) {
          setSuppliers(list);
        }
      }, (err) => {
        console.warn('Suppliers snapshot error: ', err);
      });

      unsubCatalog = onSnapshot(collection(db, 'catalog'), (snapshot) => {
        const list: CatalogItem[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as CatalogItem);
        });
        if (list.length > 0) {
          setCatalogItems(list);
        }
      }, (err) => {
        console.warn('Catalog snapshot error: ', err);
      });

      unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
        const list: Review[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Review);
        });
        if (list.length > 0) {
          setReviews(list);
        }
      }, (err) => {
        console.warn('Reviews snapshot error: ', err);
      });
    });

    return () => {
      isMounted = false;
      if (unsubSuppliers) unsubSuppliers();
      if (unsubCatalog) unsubCatalog();
      if (unsubReviews) unsubReviews();
    };
  }, []);

  const handleLogin = (userRole: 'trucker' | 'supplier' | 'seller', name: string, extraData?: any) => {
    setUsername(name);
    setRole(userRole);
    if (extraData && extraData.googleAccessToken) {
      setGoogleToken(extraData.googleAccessToken);
    }
    if (userRole === 'seller' && extraData) {
      setSellerInfo({
        id: extraData.id,
        supplierId: extraData.supplierId,
        name: name,
        email: extraData.email || ''
      });
      if (extraData.supplierName) {
        setUsername(extraData.supplierName);
      }
    } else if (extraData) {
      if (extraData.phone) setPhone(extraData.phone);
      if (extraData.truckModel) setTruckModel(extraData.truckModel);
    }

    // Load saved niche memory for this specific user
    const userKey = name.trim().toLowerCase();
    const savedNiche = localStorage.getItem(`imperio_niche_${userKey}`);
    if (savedNiche === 'pesados' || savedNiche === 'passeio' || savedNiche === 'motos') {
      setNiche(savedNiche);
    } else {
      setNiche(null);
    }
  };

  const handleSelectNiche = (selectedNiche: 'pesados' | 'passeio' | 'motos') => {
    setNiche(selectedNiche);
    const userKey = username.trim().toLowerCase();
    localStorage.setItem(`imperio_niche_${userKey}`, selectedNiche);
  };

  const handleReset = () => {
    if (confirm('Deseja redefinir os dados para os valores padrão de fábrica? Isso limpará qualquer item cadastrado recém-adicionado.')) {
      resetToDefaults();
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('ATENÇÃO: Deseja realmente excluir permanentemente sua conta e todos os dados associados a ela? Esta operação é irreversível e obedece as diretrizes da LGPD (Lei Geral de Proteção de Dados) exigidas para publicação na Google Play e App Store.')) {
      try {
        await deleteUserAccountFromDB(username, role as 'trucker' | 'supplier' | 'seller');
        alert('Sua conta e dados foram excluídos com sucesso do banco de dados (Firestore) e do armazenamento local.');
        handleLogout();
      } catch (err) {
        alert('Erro ao excluir conta. Por favor, tente novamente mais tarde.');
      }
    }
  };

  const handleLogout = () => {
    setRole('onboarding');
    setSellerInfo(null);
    setNiche(null);
    setGoogleToken(null);
  };

  const handleVerifyAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError('');
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput })
      });
      const data = await response.json();
      if (data.success) {
        setIsAdminUnlocked(true);
        sessionStorage.setItem('imperio_admin_unlocked', 'true');
        setAdminModalOpen(false);
        setAdminPasswordInput('');
        setAdminError('');
      } else {
        setAdminError(data.message || 'Senha incorreta!');
      }
    } catch (err) {
      setAdminError('Erro ao conectar com o servidor de validação backend.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    sessionStorage.removeItem('imperio_admin_unlocked');
    setAdminModalOpen(false);
    setAdminPasswordInput('');
    setAdminError('');
  };

  const handleAddReview = (newReview: Review) => {
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    saveReviews(updatedReviews);

    // Also update supplier average rating if the target is a supplier
    if (newReview.targetType === 'supplier') {
      const supplierReviews = updatedReviews.filter(r => r.targetId === newReview.targetId && r.targetType === 'supplier');
      const avgRating = Number((supplierReviews.reduce((sum, r) => sum + r.rating, 0) / supplierReviews.length).toFixed(1));
      
      const updatedSuppliers = suppliers.map(s => {
        if (s.id === newReview.targetId) {
          return {
            ...s,
            rating: avgRating,
            reviewsCount: supplierReviews.length
          };
        }
        return s;
      });
      setSuppliers(updatedSuppliers);
      saveSuppliers(updatedSuppliers);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-slate-100 flex flex-col font-sans select-none no-scrollbar">
      
      {/* Top Demo Utility Selector Belt (Internal Validation/Testing Mode - Protected) */}
      {isAdminUnlocked && (
        <div id="demo-utility-belt" className="bg-[#1A1A1A] border-b border-neutral-800 py-3 px-4 text-xs z-50 shrink-0 select-none">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 border-b border-neutral-850 pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-amber-500 font-black uppercase text-[10px] tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
              <span>Área de validação interna — uso restrito à equipe responsável (Modo de Homologação)</span>
            </div>
            <button
              onClick={handleLockAdmin}
              className="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-350 font-black px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>Bloquear Acesso</span>
            </button>
          </div>
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                niche === 'passeio' ? 'bg-emerald-400' :
                niche === 'motos' ? 'bg-rose-500' :
                'bg-amber-500'
              }`} />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <ImperioLogo size="sm" variant="icon" />
                </div>
                <span className={`font-black uppercase tracking-widest text-[11px] ${
                  niche === 'passeio' ? 'text-emerald-400' :
                  niche === 'motos' ? 'text-rose-500' :
                  'text-amber-500'
                }`}>
                  <span className="text-white font-black mr-1">IMPÉRIO</span>
                  {niche ? niche.toUpperCase() : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1 flex-wrap justify-center gap-1">
              {role !== 'onboarding' && niche !== null && (
                <div className="flex items-center bg-black/40 border border-neutral-800 rounded-lg p-0.5 mr-2">
                  <button
                    onClick={() => handleSelectNiche('pesados')}
                    className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      niche === 'pesados' ? 'bg-amber-500 text-black font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Pesados
                  </button>
                  <button
                    onClick={() => handleSelectNiche('passeio')}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      niche === 'passeio' ? 'bg-emerald-500 text-black font-black' : 'text-slate-400 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: niche === 'passeio' ? '#10B981' : undefined,
                      color: niche === 'passeio' ? '#000000' : undefined,
                    }}
                  >
                    Passeio
                  </button>
                  <button
                    onClick={() => handleSelectNiche('motos')}
                    className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      niche === 'motos' ? 'bg-rose-500 text-black font-black' : 'text-slate-400 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: niche === 'motos' ? '#E11D48' : undefined,
                      color: niche === 'motos' ? '#000000' : undefined,
                    }}
                  >
                    Motos
                  </button>
                  <button
                    onClick={() => setNiche(null)}
                    className="px-2 py-1 text-[9px] text-slate-400 hover:text-amber-400 font-bold transition-all ml-1 border-l border-neutral-850"
                    title="Trocar Segmento"
                  >
                    Alterar ⚙
                  </button>
                </div>
              )}

              {role !== 'onboarding' && (
                <>
                  <button
                    id="tab-view-trucker-btn"
                    onClick={() => setRole('trucker')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center space-x-1 transition-all text-[11px] cursor-pointer ${
                      role === 'trucker' 
                        ? 'bg-neutral-100 text-black font-black' 
                        : 'bg-[#1E1E1E] border border-neutral-800 text-slate-300 hover:bg-neutral-800'
                    }`}
                  >
                    {niche === 'motos' ? <Bike className="w-3.5 h-3.5" /> : niche === 'passeio' ? <Car className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                    <span>
                      {niche === 'motos' ? 'Ver Piloto' : 'Ver Motorista'}
                    </span>
                  </button>

                  <button
                    id="tab-view-supplier-btn"
                    onClick={() => setRole('supplier')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center space-x-1 transition-all text-[11px] cursor-pointer ${
                      role === 'supplier' || role === 'seller'
                        ? 'bg-neutral-100 text-black font-black' 
                        : 'bg-[#1E1E1E] border border-neutral-800 text-slate-300 hover:bg-neutral-800'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Ver Fornecedor</span>
                  </button>
                </>
              )}

              {role !== 'onboarding' && (
                <button
                  id="tab-logout-btn"
                  onClick={handleLogout}
                  className="p-1 px-2.5 bg-red-950 hover:bg-red-900 border border-red-800 text-slate-300 rounded-lg text-[10px] flex items-center gap-1 font-bold cursor-pointer"
                  title="Sair do Perfil"
                >
                  <LogOut className="w-3 h-3 text-red-400" />
                  <span className="hidden sm:inline">Desconectar</span>
                </button>
              )}

              <button
                onClick={handleReset}
                className="p-1.5 bg-[#1E1E1E] hover:bg-neutral-800 border border-neutral-800 rounded-lg text-slate-400 hover:text-[#FF8C00] transition-colors cursor-pointer"
                title="Resetar dados do Piloto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Switch panel wrapper */}
      <div className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          {role === 'onboarding' && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1"
            >
              <LoginOnboarding onLogin={handleLogin} />
            </motion.div>
          )}

          {role !== 'onboarding' && role !== 'plan' && niche === null && (
            <motion.div
              key="niche-selector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1"
            >
              <NicheSelector 
                userName={username} 
                onSelect={handleSelectNiche} 
                currentNiche={niche}
              />
            </motion.div>
          )}

          {role === 'trucker' && niche !== null && (
            <motion.div
              key="trucker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1"
            >
              <TruckerHome 
                userName={username}
                userPhone={phone}
                initialTruckModel={truckModel}
                onOpenSOS={() => setSosOpen(true)}
                suppliers={suppliers}
                setSuppliers={setSuppliers}
                catalogItems={catalogItems}
                reviews={reviews}
                onAddReview={handleAddReview}
                niche={niche}
                googleToken={googleToken}
                onDeleteAccount={handleDeleteAccount}
              />
            </motion.div>
          )}

          {(role === 'supplier' || role === 'seller') && niche !== null && (
            <motion.div
              key="supplier"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1"
            >
              <SupplierDashboard 
                companyName={username}
                cnpj={phone} // mock data cnpj mapped here
                phone={phone}
                suppliers={suppliers}
                setSuppliers={setSuppliers}
                catalogItems={catalogItems}
                setCatalogItems={setCatalogItems}
                reviews={reviews}
                onAddReview={handleAddReview}
                isSeller={role === 'seller'}
                sellerName={sellerInfo?.name}
                sellerEmail={sellerInfo?.email}
                niche={niche}
                googleToken={googleToken}
                onDeleteAccount={handleDeleteAccount}
              />
            </motion.div>
          )}

          {/* Business Plan removed publicly per user instruction */}
        </AnimatePresence>
      </div>

      {/* SOS Rescue Module Overlay Drawer */}
      <AnimatePresence>
        {sosOpen && (
          <SOSModal 
            onClose={() => setSosOpen(false)}
            suppliers={suppliers}
            truckerName={username}
            truckModel={truckModel}
          />
        )}
      </AnimatePresence>

      {/* Global Compliance Legal Consent overlay */}
      <LegalConsentModal
        isOpen={globalLegalOpen}
        onClose={() => setGlobalLegalOpen(false)}
        defaultTab={globalLegalTab}
      />

      {/* Global Footer with Compliance and Admin Mode Access */}
      <footer id="global-imperio-footer" className="bg-[#151515] border-t border-neutral-850 py-6 px-4 shrink-0 text-center select-none mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap justify-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            <button
              onClick={() => setInfoModalTab('about')}
              className="hover:text-[#FF8C00] transition-colors cursor-pointer"
            >
              Sobre Nós
            </button>
            <span className="text-neutral-800">|</span>
            <button
              onClick={() => setInfoModalTab('faq')}
              className="hover:text-[#FF8C00] transition-colors cursor-pointer"
            >
              Dúvidas Frequentes (FAQ)
            </button>
            <span className="text-neutral-800">|</span>
            <button
              onClick={() => setInfoModalTab('support')}
              className="hover:text-[#FF8C00] transition-colors cursor-pointer"
            >
              Contato com Suporte
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <p className="text-[10px] text-slate-500 font-mono">
              © {new Date().getFullYear()} IMPÉRIO. Todos os direitos reservados.
            </p>
            {/* Padlock button triggering the secure admin check */}
            <button
              onClick={() => {
                if (isAdminUnlocked) {
                  handleLockAdmin();
                } else {
                  setAdminModalOpen(true);
                }
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isAdminUnlocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                  : 'bg-neutral-800 border-neutral-750 text-slate-500 hover:text-slate-300 hover:border-neutral-700'
              }`}
              title={isAdminUnlocked ? 'Área de Homologação Ativa (Clique para bloquear)' : 'Acesso Restrito à Equipe'}
            >
              {isAdminUnlocked ? <Unlock className="w-3.5 h-3.5 animate-pulse" /> : <Lock className="w-3.5 h-3.5" />}
              <span className="text-[9px] font-black uppercase tracking-wider">Homologação</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Admin Password Verification Modal */}
      <AnimatePresence>
        {adminModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1E1E1E] border border-neutral-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6"
            >
              <div className="flex items-center justify-between border-b border-neutral-850 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  <span className="font-black text-xs uppercase tracking-wider text-slate-200">Acesso de Homologação</span>
                </div>
                <button
                  onClick={() => {
                    setAdminModalOpen(false);
                    setAdminPasswordInput('');
                    setAdminError('');
                  }}
                  className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-slate-400 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-xs text-slate-400 leading-normal mb-4">
                Digite a chave secreta de administrador (definida de forma segura no backend em <code className="bg-black px-1 py-0.5 rounded text-amber-400 text-[10px] font-mono">.env</code>) para desbloquear a barra de simulação e homologação de rotas.
              </p>

              <form onSubmit={handleVerifyAdmin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">Senha do Administrador</label>
                  <input
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={adminLoading}
                    className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  />
                </div>

                {adminError && (
                  <p className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                    <span>⚠️</span> {adminError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {adminLoading ? (
                    <span className="animate-spin text-sm">⌛</span>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Verificar Senha</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Informational Footer Modal (About, FAQ, Support) */}
      <AnimatePresence>
        {infoModalTab !== null && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#1E1E1E] border border-neutral-850 w-full max-w-xl h-[75vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="bg-[#151515] p-4 border-b border-neutral-850 flex items-center justify-between">
                <span className="font-black text-xs md:text-sm uppercase tracking-wider text-slate-100 font-display">
                  {infoModalTab === 'about' ? 'Sobre Nós — Plataforma Império' : infoModalTab === 'faq' ? 'Dúvidas Frequentes (FAQ)' : 'Central de Suporte Tecnológico'}
                </span>
                <button
                  onClick={() => setInfoModalTab(null)}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content container */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 text-xs text-slate-350 leading-relaxed scrollbar-thin scrollbar-thumb-neutral-800 text-left">
                {infoModalTab === 'about' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2">Quem Somos</h3>
                    <p>
                      A <strong>Plataforma Império</strong> nasceu com o propósito de solucionar um dos maiores gargalos logísticos do Brasil: a quebra e manutenção de caminhões, vans, utilitários, carros de passeio e motocicletas nas rodovias e perímetros urbanos.
                    </p>
                    <p>
                      Conectamos motoristas e pilotos diretamente a uma rede inteligente de autopeças, mecânicos especialistas, serviços de guincho e borracharias em todo o território nacional. Tudo isso de forma ágil, segura e sem custos de comissão ou intermediação para quem está no volante.
                    </p>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2 mt-4">Nossa Missão</h3>
                    <p>
                      Garantir que nenhum motorista fique desamparado na estrada. Através de tecnologia de geolocalização e sincronização em tempo real de contatos confiáveis e fornecedores homologados, oferecemos uma infraestrutura digital robusta para que a viagem continue com segurança e economia.
                    </p>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2 mt-4">Nossos Diferenciais</h3>
                    <ul className="list-disc pl-4 space-y-2 text-slate-300 font-medium">
                      <li><strong className="text-[#FF8C00]">Rede Verificada:</strong> Todos os fornecedores cadastrados passam por um rigoroso processo de conformidade legal e documental.</li>
                      <li><strong className="text-[#FF8C00]">Zero Taxas para Motoristas:</strong> Não cobramos taxas ocultas nem intermediamos pagamentos de peças e serviços.</li>
                      <li><strong className="text-[#FF8C00]">Socorro SOS Imediato:</strong> Disparo de localização exata e alerta via SMS e canais virtuais para agilizar atendimentos mecânicos emergenciais.</li>
                    </ul>
                  </div>
                )}

                {infoModalTab === 'faq' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2">Dúvidas Frequentes (FAQ)</h3>
                    
                    <div className="space-y-3">
                      <div className="bg-[#151515] p-3 rounded-xl border border-neutral-850">
                        <h4 className="font-bold text-white mb-1">1. Quanto custa para o motorista usar o Império?</h4>
                        <p className="text-slate-400">Absolutamente nada. O cadastro, a busca por peças, o acionamento de socorristas e o chat de negociação são 100% gratuitos para os motoristas.</p>
                      </div>

                      <div className="bg-[#151515] p-3 rounded-xl border border-neutral-850">
                        <h4 className="font-bold text-white mb-1">2. Como as empresas recebem e gerenciam as cotações?</h4>
                        <p className="text-slate-400">As empresas e fornecedores cadastrados contam com um painel completo. O proprietário pode cadastrar produtos e sua equipe de vendas (vendedores comerciais) atende aos chats de cotação em tempo real.</p>
                      </div>

                      <div className="bg-[#151515] p-3 rounded-xl border border-neutral-850">
                        <h4 className="font-bold text-white mb-1">3. Como funciona o acionamento do botão SOS de emergência?</h4>
                        <p className="text-slate-400">Ao clicar em SOS, o sistema coleta a geolocalização exata do veículo e dispara notificações e convites rápidos de socorro para os fornecedores ativos mais próximos e contatos de confiança salvos em seu perfil.</p>
                      </div>

                      <div className="bg-[#151515] p-3 rounded-xl border border-neutral-850">
                        <h4 className="font-bold text-white mb-1">4. Como é garantida a segurança dos meus dados pessoais (LGPD)?</h4>
                        <p className="text-slate-400">Cumprimos estritamente a Lei Geral de Proteção de Dados (LGPD). Seus dados de localização são compartilhados apenas mediante acionamento explícito e nunca comercializamos suas informações com terceiros.</p>
                      </div>
                    </div>
                  </div>
                )}

                {infoModalTab === 'support' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2">Central de Atendimento ao Cliente</h3>
                    <p>
                      Se você tem dúvidas comerciais, sugestões de novas ferramentas ou precisa de ajuda técnica com o seu painel de fornecedor, conte com nossa equipe de suporte dedicada.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3 mt-3">
                      <div className="bg-[#151515] p-4 rounded-xl border border-neutral-850 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white">Suporte via WhatsApp 24h</h4>
                          <p className="text-[11px] text-slate-450 mt-1">Canal direto para motoristas em viagem.</p>
                        </div>
                        <a
                          href="https://wa.me/5511999999999"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Chamar no WhatsApp
                        </a>
                      </div>

                      <div className="bg-[#151515] p-4 rounded-xl border border-neutral-850 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white">E-mail Corporativo</h4>
                          <p className="text-[11px] text-slate-450 mt-1">Para parcerias, faturamento e integração de catálogos.</p>
                        </div>
                        <a
                          href="mailto:suporte@imperiopecas.com.br"
                          className="bg-neutral-800 hover:bg-neutral-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg text-[10px] tracking-wide transition-all cursor-pointer border border-neutral-700"
                        >
                          suporte@imperiopecas.com.br
                        </a>
                      </div>

                      <div className="bg-[#151515] p-4 rounded-xl border border-neutral-850">
                        <h4 className="font-bold text-white mb-1">Precisa excluir sua conta?</h4>
                        <p className="text-slate-450 mb-2">De acordo com a regulamentação das lojas de aplicativos e a LGPD, você pode solicitar a deleção instantânea de todos os seus dados a qualquer momento diretamente no aplicativo clicando em "Deletar Conta" na seção de Perfil, ou entrando em contato por e-mail.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-[#151515] p-4 border-t border-neutral-850 flex items-center justify-end">
                <button
                  onClick={() => setInfoModalTab(null)}
                  className="px-5 py-2 bg-neutral-100 hover:bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent floating PWA custom installer prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
