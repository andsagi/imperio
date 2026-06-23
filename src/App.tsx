/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Truck, Store, FileText, AlertTriangle, ChevronRight, HelpCircle, RefreshCw, LogOut, Crown, Car, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents import
import LoginOnboarding from './components/LoginOnboarding';
import TruckerHome from './components/TruckerHome';
import SupplierDashboard from './components/SupplierDashboard';
import SOSModal from './components/SOSModal';
import NicheSelector from './components/NicheSelector';
import ImperioLogo from './components/ImperioLogo';

// Data layers
import { Supplier, CatalogItem, Review } from './types';
import { loadSuppliers, saveSuppliers, loadCatalogItems, saveCatalogItems, loadReviews, saveReviews, resetToDefaults, initializeDatabase } from './mockData';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  const [role, setRole] = useState<'onboarding' | 'trucker' | 'supplier' | 'seller' | 'plan'>('onboarding');
  const [niche, setNiche] = useState<'pesados' | 'passeio' | 'motos' | null>(null);
  const [username, setUsername] = useState('Roberto da Silva');
  const [phone, setPhone] = useState('(11) 99999-9999');
  const [truckModel, setTruckModel] = useState('Volvo FH 540 Globetrotter');
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

  const handleLogout = () => {
    setRole('onboarding');
    setSellerInfo(null);
    setNiche(null);
    setGoogleToken(null);
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
      
      {/* Top Demo Utility Selector Belt */}
      <div id="demo-utility-belt" className="bg-[#1A1A1A] border-b border-neutral-800 py-2 px-3 text-xs z-50 shrink-0 select-none">
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
    </div>
  );
}
