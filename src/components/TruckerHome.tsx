/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Phone, MessageSquare, AlertTriangle, Truck, 
  Wrench, Battery, Fuel, Settings, AlertCircle, ShoppingCart, 
  Send, User, Calendar, Star, CheckCircle, Package, ArrowLeft, ShieldCheck, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Supplier, CatalogItem, Chat, TruckProfile, Message } from '../types';
import { loadSuppliers, loadCatalogItems, loadChats, saveChats, loadTruckProfile, saveTruckProfile } from '../mockData';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import CoverageMap from './CoverageMap';
import ChatModal from './ChatModal';

interface TruckerHomeProps {
  userName: string;
  userPhone: string;
  initialTruckModel: string;
  onOpenSOS: () => void;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  catalogItems: CatalogItem[];
  niche?: 'pesados' | 'passeio' | 'motos';
  googleToken?: string | null;
}

export default function TruckerHome({ 
  userName, 
  userPhone, 
  initialTruckModel, 
  onOpenSOS, 
  suppliers,
  setSuppliers,
  catalogItems,
  niche = 'pesados',
  googleToken = null
}: TruckerHomeProps) {
  const [activeTab, setActiveTab] = useState<'inicio' | 'pecas' | 'chat' | 'perfil'>('inicio');
  const [selectedZoomPhoto, setSelectedZoomPhoto] = useState<string | null>(null);
  
  // Google Contacts States
  const [googleContacts, setGoogleContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [trustedPhones, setTrustedPhones] = useState<string[]>([]);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  // States
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [supplierSearchQuery, setSupplierSearchQuery] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState<number>(50); // Default search radius of 50 km
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  
  // Direct Chat Modal States
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatModalSupplier, setChatModalSupplier] = useState<Supplier | null>(null);
  const [chatModalInitialMsg, setChatModalInitialMsg] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [compatibilityFilter, setCompatibilityFilter] = useState('todos');

  // Chats state loaded from mockData and persists to localStorage
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState('');

  // Truck State
  const [truck, setTruck] = useState<TruckProfile>({
    brand: 'Volvo',
    model: initialTruckModel || 'FH 540 Globetrotter',
    year: 2021,
    plate: 'IMP-8C40',
    currentKm: 345000,
    engineType: 'D13K 540hp',
    lastOilChangeKm: 340000,
    lastTireChangeKm: 320000,
    lastBrakeChangeKm: 290000,
  });

  const [editTruck, setEditTruck] = useState(false);

  // Load chats and profile initially and sync with Firestore in real time
  useEffect(() => {
    setChats(loadChats());
    const savedProf = loadTruckProfile();
    if (savedProf) {
      setTruck(savedProf);
    }

    // Real-time Chat Sync
    const unsubChats = onSnapshot(collection(db, 'chats'), (snapshot) => {
      const list: Chat[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Chat);
      });
      if (list.length > 0) {
        setChats(list);
      }
    }, (err) => {
      console.warn('Chats snapshot error: ', err);
    });

    // Real-time Truck Profile Sync
    const unsubTruck = onSnapshot(doc(db, 'truck_profiles', 'default_profile'), (docSnap) => {
      if (docSnap.exists()) {
        setTruck(docSnap.data() as TruckProfile);
      }
    }, (err) => {
      console.warn('Truck snapshot error: ', err);
    });

    return () => {
      unsubChats();
      unsubTruck();
    };
  }, []);

  // Load saved trusted contacts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('imperio_trusted_phones');
    if (saved) {
      try {
        setTrustedPhones(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse trusted phones', e);
      }
    }
  }, []);

  const handleSyncContacts = async () => {
    setContactsLoading(true);
    setContactsError(null);
    try {
      if (googleToken && googleToken !== 'mock_contacts_token') {
        const response = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers', {
          headers: { Authorization: `Bearer ${googleToken}` }
        });
        if (!response.ok) {
          throw new Error('Erro ao buscar contatos do Google API.');
        }
        const data = await response.json();
        
        // Map Google People API to simple array
        const list = (data.connections || []).map((conn: any) => {
          const name = conn.names?.[0]?.displayName || 'Contato Sem Nome';
          const phone = conn.phoneNumbers?.[0]?.value || conn.phoneNumbers?.[0]?.canonicalForm || 'Sem Telefone';
          const email = conn.emailAddresses?.[0]?.value || 'Sem Email';
          return { name, phone, email };
        });
        setGoogleContacts(list);
      } else {
        // Mock fallback simulator (for bypassed auditable flows)
        await new Promise(resolve => setTimeout(resolve, 800));
        const MOCK_GOOGLE_CONTACTS = [
          { name: 'Adalberto Borraceiro BR-116', phone: '(11) 98211-5544', email: 'adalberto.borrachas@gmail.com' },
          { name: 'Mecânica Diesel Silva', phone: '(11) 97100-3322', email: 'mecanicasilva@gmail.com' },
          { name: 'Wellington Peças Pesadas', phone: '(11) 99188-4422', email: 'wellington@tiete.com.br' },
          { name: 'Esposa Maria', phone: '(11) 99911-2233', email: 'maria.silva@hotmail.com' },
          { name: 'Guincho Resgate 24h', phone: '(11) 800-4433-221', email: 'resgate24h@gmail.com' },
        ];
        setGoogleContacts(MOCK_GOOGLE_CONTACTS);
      }
    } catch (err: any) {
      console.error(err);
      setContactsError(err.message || 'Erro de conexão com o Google.');
    } finally {
      setContactsLoading(false);
    }
  };

  // Auto-sync if googleToken is available on mount/token change
  useEffect(() => {
    if (googleToken) {
      handleSyncContacts();
    }
  }, [googleToken]);

  const toggleTrustPhone = (phoneStr: string) => {
    let updated: string[] = [];
    if (trustedPhones.includes(phoneStr)) {
      updated = trustedPhones.filter(p => p !== phoneStr);
    } else {
      updated = [...trustedPhones, phoneStr];
    }
    setTrustedPhones(updated);
    localStorage.setItem('imperio_trusted_phones', JSON.stringify(updated));
  };

  const handleInviteContact = (contactName: string) => {
    setInviteStatus(`Convite enviado para ${contactName}! SMS e e-mail disparados.`);
    setTimeout(() => {
      setInviteStatus(null);
    }, 4000);
  };

  const handleSaveTruck = (e: React.FormEvent) => {
    e.preventDefault();
    saveTruckProfile(truck);
    setEditTruck(false);
  };

  // Filter suppliers based on active category, search query and distance radius
  const filteredSuppliers = suppliers.filter(s => {
    // Check niche matching first (if configured)
    if (niche && s.niche && s.niche !== niche) {
      return false;
    }

    // 1. Check Category match
    let matchesCategory = true;
    if (selectedCategory !== 'todos') {
      if (selectedCategory === 'eletrica') {
        matchesCategory = s.category === 'socorro' || 
               s.name.toLowerCase().includes('elétrica') || 
               s.specialty.toLowerCase().includes('elétrica') || 
               s.specialty.toLowerCase().includes('bateria');
      } else if (selectedCategory === 'guincho') {
        matchesCategory = s.category === 'socorro' || 
               s.name.toLowerCase().includes('guincho') || 
               s.specialty.toLowerCase().includes('guincho');
      } else {
        matchesCategory = s.category === selectedCategory;
      }
    }

    // 2. Check Search query match
    const query = supplierSearchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
                          s.name.toLowerCase().includes(query) || 
                          s.specialty.toLowerCase().includes(query) ||
                          s.address.toLowerCase().includes(query);

    // 3. Check Distance Radius match
    const matchesDistance = s.distance <= searchRadius;

    return matchesCategory && matchesSearch && matchesDistance;
  });

  // Filter parts search
  const filteredCatalogItems = catalogItems.filter(item => {
    // Check niche matching first
    if (niche && item.niche && item.niche !== niche) {
      return false;
    }

    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.compatibleWith.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (compatibilityFilter === 'todos') return matchesSearch;
    return matchesSearch && item.compatibleWith.toLowerCase().includes(compatibilityFilter.toLowerCase());
  });

  // Start chat with a supplier
  const startChatWithSupplier = (supplier: Supplier) => {
    const existing = chats.find(c => c.supplierId === supplier.id);
    if (existing) {
      setActiveChatId(existing.id);
      setActiveTab('chat');
      setSelectedSupplier(null);
      return;
    }

    // Create new chat
    const newChat: Chat = {
      id: `c_${supplier.id}_${Date.now()}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      lastMessage: 'Chat iniciado recentemente.',
      unreadCount: 0,
      timestamp: 'Hoje',
      isOnline: supplier.isOnline,
      messages: [
        {
          id: `m_${Date.now()}`,
          sender: 'supplier',
          text: `Olá, parceiro! Sou o consultor online da ${supplier.name}. Como posso ajudar na sua rota hoje?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    saveChats(updatedChats);
    setActiveChatId(newChat.id);
    setActiveTab('chat');
    setSelectedSupplier(null);
  };

  // Send message in active chat
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeChatId) return;

    const messageText = typedMessage;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const activeChatIndex = chats.findIndex(c => c.id === activeChatId);
    if (activeChatIndex === -1) return;

    const currentChat = chats[activeChatIndex];
    const newMsg: Message = {
      id: `m_user_${Date.now()}`,
      sender: 'trucker',
      text: messageText,
      timestamp: timeStr,
    };

    const updatedMessages = [...currentChat.messages, newMsg];
    
    const updatedChat: Chat = {
      ...currentChat,
      messages: updatedMessages,
      lastMessage: messageText,
      timestamp: timeStr,
    };

    const updatedChats = [...chats];
    updatedChats[activeChatIndex] = updatedChat;
    setChats(updatedChats);
    saveChats(updatedChats);
    setTypedMessage('');

    // Trigger auto automated seller response
    setTimeout(() => {
      const respMsg: Message = {
        id: `m_resp_${Date.now()}`,
        sender: 'supplier',
        text: `Opa, verifiquei aqui bão! Entendido perfeitamente. Nossos consultores online já estão separando esse orçamento para agilizarmos pro seu caminhão ${truck.model}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const updatedWithResponse = {
        ...updatedChat,
        messages: [...updatedChat.messages, respMsg],
        lastMessage: respMsg.text,
      };

      const finalChats = [...chats];
      finalChats[activeChatIndex] = updatedWithResponse;
      setChats(finalChats);
      saveChats(finalChats);
    }, 2500);
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  // Maintenance Alerts calculating next changes
  const oilElapsed = truck.currentKm - truck.lastOilChangeKm;
  const tireElapsed = truck.currentKm - truck.lastTireChangeKm;
  const brakesElapsed = truck.currentKm - truck.lastBrakeChangeKm;

  const oilPercentage = Math.min((oilElapsed / 20000) * 100, 100);
  const tirePercentage = Math.min((tireElapsed / 40000) * 100, 100);
  const brakesPercentage = Math.min((brakesElapsed / 60000) * 100, 100);

  return (
    <div id="trucker-home-panel" className="bg-[#121212] text-slate-100 flex flex-col min-h-screen selection:bg-[#FF8C00] selection:text-black pb-20 font-sans">
      {/* Dynamic Header */}
      <header className="bg-[#1A1A1A] border-b border-neutral-800 py-4 px-4 sticky top-0 z-30 shadow-lg shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Crown Overlaid Truck Icon */}
            <div className="relative w-10 h-10 bg-gradient-to-br from-[#FF8C00] to-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20 shadow-md">
              <div className="absolute -top-1.5 bg-black/95 px-1 py-0.5 rounded-full border border-amber-500/40 shadow-sm">
                <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              </div>
              <Truck className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[#FF8C00] text-[10px] font-black uppercase tracking-wider">Olá, parceiro</span>
                <span className="bg-[#FF8C00]/10 px-1.5 py-0.5 rounded-full border border-[#FF8C00]/20 text-[8px] text-[#FF8C00] font-extrabold uppercase flex items-center gap-0.5">
                  <Crown className="w-2 h-2 text-[#FF8C00] fill-[#FF8C00]" />
                  <span>IMPÉRIO VIP</span>
                </span>
              </div>
              {/* Highlight IMPÉRIO in the header text */}
              <h1 className="text-sm font-extrabold text-slate-300 leading-none mt-1">
                {userName} <span className="text-slate-500 font-medium">|</span> <span className="bg-gradient-to-r from-[#FF8C00] via-amber-400 to-[#FF8C00] bg-clip-text text-transparent font-black tracking-wider text-xs">IMPÉRIO</span>
              </h1>
            </div>
          </div>

          {/* Quick Route/Localization Bar */}
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center space-x-1.5 text-xs text-[#FF8C00] font-extrabold bg-[#FF8C00]/10 px-2.5 py-1 rounded-lg border border-[#FF8C00]/25">
              <MapPin className="w-3.5 h-3.5" />
              <span>SP: BR-116, SP</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 font-mono">{truck.brand} {truck.model}</span>
          </div>
        </div>
      </header>

      {/* Main Panel content wrapper */}
      <main className="max-w-4xl mx-auto w-full p-4 flex-1">
        
        {activeTab === 'inicio' && (
          <div className="space-y-6" id="inicio-view-wrapper">
            
            {/* Banner Carousel - Visual Slider */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF8C00] to-[#E67E00] text-black p-6 md:p-8 shadow-xl premium-glow flex items-center h-auto md:h-56 min-h-[220px]">
              <div className="absolute top-4 right-4 p-1 shrink-0 z-10">
                <span className="bg-black text-white font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded border border-black/15">
                  Oferta do Dia
                </span>
              </div>
              <div className="max-w-xl space-y-2 z-10">
                <span className="text-black/85 text-[10px] font-black uppercase tracking-widest">Tietê Autopeças</span>
                <h2 className="text-xl md:text-3xl font-black text-black leading-none tracking-tighter">PNEU BRIDGESTONE RADIAL TRAÇÃO COM 20% DO APP!</h2>
                <p className="text-xs text-black/80 font-medium">
                  Turbinas, embreagens Sachs e filtros lubrificantes originais a pronta entrega nas principais rodovias do estado de São Paulo. Envie orçamentos no chat.
                </p>
                <div className="pt-2">
                  <button 
                    onClick={() => {
                      const tiet = suppliers.find(s => s.id === 's1');
                      if (tiet) setSelectedSupplier(tiet);
                    }}
                    className="bg-black text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-neutral-900 transition-all cursor-pointer shadow-md shadow-black/10"
                  >
                    Ver Oferta Diária
                  </button>
                </div>
              </div>
              <div className="absolute right-8 bottom-0 opacity-10 pointer-events-none hidden md:block">
                 <Truck className="w-52 h-52 text-black" strokeWidth={1} />
              </div>
            </div>

            {/* Quick action Emergency SOS Alert banner component */}
            <div className="bg-gradient-to-r from-red-600/10 to-red-600/2 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-600 rounded-xl text-white">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm md:text-base">Quebrou no trecho rodoviário?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Acione nosso radar de resgate mecânico de 1 clique num raio de 50km.</p>
                </div>
              </div>
              <button 
                id="big-sos-floating-btn"
                onClick={() => setShowSOSConfirm(true)}
                className="bg-red-600 hover:bg-red-700 transition-colors text-white font-extrabold text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-lg shadow-red-600/20 uppercase shrink-0"
              >
                Acionar SOS 🆘
              </button>
            </div>

            {/* Category selection grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-300 flex items-center space-x-2">
                <span>Categorias de Atendimento</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3" id="categories-grid-selection">
                {[
                  { id: 'todos', title: 'Ver Todos', icon: '📋' },
                  { id: 'pecas', title: 'Peças', icon: '⚙️' },
                  { id: 'mecanica', title: 'Mecânica', icon: '🔧' },
                  { id: 'pneus', title: 'Pneus', icon: '🛞' },
                  { id: 'eletrica', title: 'Elétrica', icon: '⚡' },
                  { id: 'guincho', title: 'Guincho', icon: '🛻' },
                  { id: 'postos', title: 'Postos', icon: '⛽' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center text-center justify-center transition-all group cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#FF8C00]/10 border-[#FF8C00] text-white shadow-lg shadow-[#FF8C00]/5'
                        : 'bg-[#1E1E1E] border-neutral-800 text-slate-400 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-xl mb-1 group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <span className="font-extrabold text-[11px] tracking-tight whitespace-nowrap">{cat.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Radius Slider filter component */}
            <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-4 space-y-3" id="search-radius-slider-filter">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📍</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#FF8C00]">Raio de Busca</h4>
                    <p className="text-[10px] text-slate-500 font-bold">Limitar prestadores pela distância do seu KM</p>
                  </div>
                </div>
                <div className="bg-[#FF8C00]/10 border border-[#FF8C00]/30 px-3 py-1 rounded-xl text-[#FF8C00] font-black text-xs font-mono">
                  Até {searchRadius} KM
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-[11px] font-black text-slate-500 font-mono">5 KM</span>
                <input
                  id="search-radius-range-input"
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="flex-1 accent-[#FF8C00] bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[11px] font-black text-slate-500 font-mono">50 KM</span>
              </div>
              
              {/* Reset filter button if it's not at maximum */}
              {searchRadius < 50 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSearchRadius(50)}
                    className="text-[10px] font-black text-[#FF8C00] hover:underline cursor-pointer"
                  >
                    Resetar para Todo o Trecho (50 KM)
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Visual Coverage Map */}
            <CoverageMap
              suppliers={suppliers}
              selectedCategory={selectedCategory}
              onSelectSupplier={(supplier) => setSelectedSupplier(supplier)}
              activeSupplierId={selectedSupplier?.id}
              searchRadius={searchRadius}
            />

            {/* Nearest Suppliers list */}
            <div className="space-y-4" id="nearest-suppliers-listing">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-2 gap-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Fornecedores Próximos ({filteredSuppliers.length})
                </h3>
                <span className="text-xs text-slate-500">Ordenado por KM</span>
              </div>

              {/* Search bar inside Nearest Suppliers */}
              <div className="relative" id="nearest-suppliers-search-container">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-500" />
                </span>
                <input
                  id="supplier-search-by-name-input"
                  type="text"
                  placeholder="Pesquisar fornecedores por nome (ex: Tietê, Borracharia)..."
                  value={supplierSearchQuery}
                  onChange={(e) => setSupplierSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-[#1C1C1C] border border-neutral-800 focus:border-[#FF8C00] rounded-xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                />
                {supplierSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSupplierSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-500 hover:text-white font-medium"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {filteredSuppliers.length === 0 && (
                  <div className="p-8 text-center bg-[#1E1E1E] border border-dashed border-neutral-800 rounded-2xl space-y-2">
                    <span className="text-3xl">🔍</span>
                    <h4 className="text-sm font-black text-white">Nenhum fornecedor encontrado</h4>
                    <p className="text-xs text-slate-500">Tente buscar por termos diferentes ou ajuste o filtro de categorias.</p>
                    {supplierSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSupplierSearchQuery('')}
                        className="mt-2 px-3 py-1.5 bg-[#FF8C00]/10 border border-[#FF8C00]/30 hover:bg-[#FF8C00]/20 text-[#FF8C00] text-xs font-bold rounded-lg transition-colors cursor-pointer animate-fade-in"
                      >
                        Limpar Busca
                      </button>
                    )}
                  </div>
                )}

                {filteredSuppliers.map((supplier) => (
                  <motion.div
                    key={supplier.id}
                    layoutId={`card-${supplier.id}`}
                    onClick={() => setSelectedSupplier(supplier)}
                    className="p-4 bg-[#1E1E1E] border border-neutral-800 hover:border-[#FF8C00]/40 rounded-2xl transition-all cursor-pointer flex justify-between gap-4 items-start group hover:shadow-2xl hover:shadow-[#FF8C00]/5"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="p-3 bg-[#1A1A1A] border border-neutral-800 rounded-xl text-[#FF8C00] group-hover:bg-[#FF8C00] group-hover:text-black group-hover:border-[#FF8C00] transition-all duration-200 shrink-0">
                        <Package className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <h4 className="font-black text-white group-hover:text-[#FF8C00] transition-colors text-sm md:text-base leading-tight">{supplier.name}</h4>
                          {supplier.isVerified && (
                            <span className="bg-[#FF8C00]/10 border border-[#FF8C00]/20 text-[#FF8C00] font-black text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded">
                              Selo VIP
                            </span>
                          )}
                          {supplier.isFoundingPartner && (
                            <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded">
                              Fundador
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mt-1 font-medium">{supplier.address}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{supplier.specialty}</p>

                        <div className="flex items-center space-x-3 mt-2.5">
                          <div className="flex items-center text-amber-500 text-xs font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-500 mr-1 shrink-0" />
                            <span>{supplier.rating} ({supplier.reviewsCount})</span>
                          </div>
                          <span className="text-slate-700 text-xs">•</span>
                          <span className="text-xs text-[#FF8C00] font-black">{supplier.distance} km de você</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end space-y-1.5">
                      <span className={`flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border ${
                        supplier.isOnline
                          ? 'text-green-500 bg-green-500/5 border-green-500/20'
                          : 'text-slate-500 bg-slate-500/5 border-slate-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${supplier.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                        <span>{supplier.isOnline ? 'Atendente Online' : 'Offline'}</span>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Supplier Detail Sub-Panel Overlay */}
            <AnimatePresence>
              {selectedSupplier && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ y: 200 }}
                    animate={{ y: 0 }}
                    exit={{ y: 200 }}
                    className="w-full max-w-xl bg-[#141414] border border-orange-500/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                  >
                    <div className="p-5 border-b border-slate-800 bg-[#1A1A1A] flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-orange-500 font-extrabold">Ficha Técnica</span>
                        <h3 className="text-lg md:text-xl font-black text-white mt-1 leading-tight">{selectedSupplier.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">{selectedSupplier.specialty}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedSupplier(null)} 
                        className="p-1 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-bold text-xs"
                      >
                        Fechar
                      </button>
                    </div>

                    <div className="p-5 overflow-y-auto space-y-5 flex-1">
                      <div className="bg-[#1C1C1C] p-4 rounded-xl space-y-2 text-xs border border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Endereço de Carga:</span>
                          <span className="text-white font-semibold text-right">{selectedSupplier.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Distância Atual:</span>
                          <span className="text-orange-500 font-extrabold">{selectedSupplier.distance} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Avaliações:</span>
                          <span className="text-amber-500 font-bold flex items-center">
                            <Star className="w-3 h-3 fill-amber-500 mr-1" />
                            {selectedSupplier.rating} ({selectedSupplier.reviewsCount} votos)
                          </span>
                        </div>
                      </div>

                      {/* Store specific catalog items filtered */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest border-b border-slate-850 pb-1.5 flex items-center justify-between">
                          <span>Catálogo de Autopeças Vinculado</span>
                          <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>Garantia <strong className="text-amber-400 font-black">Império</strong></span>
                          </span>
                        </h4>
                        
                        <div className="space-y-2">
                          {catalogItems.filter(item => item.supplierId === selectedSupplier.id).length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-4 bg-[#1C1C1C] rounded-lg">Insira consultas diretas pelo chat. Catálogo online em andamento.</p>
                          ) : (
                            catalogItems.filter(item => item.supplierId === selectedSupplier.id).map(item => (
                              <div key={item.id} className="p-3 bg-[#1C1C1C] border border-slate-850 rounded-xl flex items-start gap-3">
                                <span className="text-2xl p-2 bg-[#262626] rounded-lg shrink-0">{item.image}</span>
                                <div className="flex-1">
                                  <h5 className="font-extrabold text-white text-xs md:text-sm leading-snug">{item.title}</h5>
                                  <p className="text-[11px] text-slate-500 mt-0.5">Compatibilidade: <strong className="text-slate-300">{item.compatibleWith}</strong></p>
                                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                                  
                                  {/* Rendering the up to 2 product photos list if present */}
                                  {item.photos && item.photos.length > 0 && (
                                    <div className="flex gap-2.5 mt-3 overflow-x-auto py-1">
                                      {item.photos.map((photo, pIdx) => (
                                        <div 
                                          key={pIdx} 
                                          className="relative w-16 h-16 rounded-xl border border-neutral-800 overflow-hidden shrink-0 bg-neutral-900 group cursor-pointer hover:border-orange-500 transition-colors"
                                          onClick={() => setSelectedZoomPhoto(photo)}
                                        >
                                          <img 
                                            src={photo} 
                                            alt={`Foto ${pIdx + 1}`} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            referrerPolicy="no-referrer"
                                          />
                                          <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] font-black uppercase text-[#FF8C00] px-1 rounded">
                                            #{pIdx + 1}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between mt-2.5 bg-black/40 p-2 rounded-lg">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">SKU: {item.code}</span>
                                    <span className="text-sm font-black text-orange-500">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions inside Drawer */}
                    <div className="p-4 bg-[#1E1E1E] border-t border-slate-800 flex gap-2.5 shrink-0">
                      <button
                        onClick={() => {
                          setChatModalSupplier(selectedSupplier);
                          setChatModalInitialMsg('');
                          setIsChatModalOpen(true);
                          setSelectedSupplier(null);
                        }}
                        className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 font-extrabold text-xs uppercase tracking-wider text-black rounded-xl text-center flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-orange-500/10"
                      >
                        <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                        <span>Conversar com Atendente</span>
                      </button>

                      <a
                        href={`https://wa.me/${selectedSupplier.whatsappNumber}?text=Olá! Vi sua loja ${selectedSupplier.name} no app Império. Preciso de Orçamento!`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba56] text-white rounded-xl text-center flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                      >
                        <Phone className="w-5 h-5 fill-white" />
                      </a>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showSOSConfirm && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/85 z-[110] flex items-center justify-center p-4 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-md bg-[#121212] border-2 border-red-500/40 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4"
                  >
                    <div className="w-14 h-14 bg-red-600/15 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 relative animate-bounce">
                      <AlertTriangle className="w-8 h-8 text-red-500 stroke-[2.5]" />
                      <div className="absolute -top-2 bg-black/95 px-1 py-0.5 rounded-full border border-amber-500/55 shadow-sm">
                        <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-1.5">
                        <span>Confirmar Alerta</span>
                        <strong className="text-amber-400">SOS</strong> 
                      </h2>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-sm">
                        Você está prestes a acionar o radar de socorro emergencial para todas as oficinas de plantão num raio de 50km.
                      </p>
                      <p className="text-[11px] text-red-400 font-bold tracking-wider uppercase font-mono bg-red-950/20 px-2 py-1.5 rounded border border-red-900/30">
                        ⚠️ ATENÇÃO: Contatos falsos ou simulações indevidas podem prejudicar assistências reais na pista.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row w-full gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSOSConfirm(false);
                          onOpenSOS();
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-red-600/20 cursor-pointer"
                      >
                        <span>Sim, Enviar SOS!</span>
                        <span className="text-xs">🚨</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSOSConfirm(false)}
                        className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors text-slate-400 font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* Catalog Search Tab */}
        {activeTab === 'pecas' && (
          <div className="space-y-4" id="catalog-tab-view">
            <div className="text-center md:text-left">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Busca de Autopeças e Serviços</h2>
              <p className="text-xs text-slate-400 mt-0.5">Consulte componentes em estoque compatíveis com seu caminhão</p>
            </div>

            {/* Filters Bar */}
            <div className="bg-[#141414] border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 text-slate-500 w-5 h-5" />
                <input
                  id="parts-query-search"
                  type="text"
                  placeholder="Pesquise por turbina, pastilha, embreagem, pneu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-slate-850 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">Modelos:</span>
                <select
                  value={compatibilityFilter}
                  onChange={(e) => setCompatibilityFilter(e.target.value)}
                  className="flex-1 bg-[#1A1A1A] border border-slate-850 rounded-lg text-xs p-2 text-white outline-none focus:border-orange-500"
                >
                  <option value="todos">Todos os Modelos</option>
                  <option value="Volvo">Família Volvo FH</option>
                  <option value="Scania">Família Scania</option>
                  <option value="Mercedes">Mercedes-Benz Actros</option>
                </select>
              </div>
            </div>

            {/* List results */}
            <div className="grid grid-cols-1 gap-3" id="parts-search-results-list">
              {filteredCatalogItems.length === 0 ? (
                <div className="text-center py-10 bg-[#141414] border border-slate-800 rounded-xl space-y-2">
                  <span className="text-3xl">🔎</span>
                  <p className="text-slate-400 text-sm">Nenhum componente cadastrado com essa tag de termos.</p>
                  <p className="text-slate-500 text-xs">Acesse o Chat do app para negociar orçamentos diretamente.</p>
                </div>
              ) : (
                filteredCatalogItems.map((item) => {
                  const s = suppliers.find(su => su.id === item.supplierId);
                  return (
                    <div key={item.id} className="p-4 bg-[#141414] border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                      <div className="flex items-start space-x-3.5">
                        <span className="text-3xl p-3 bg-[#1C1C1C] rounded-xl shrink-0">{item.image}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-extrabold text-white text-sm md:text-base">{item.title}</h4>
                            <span className="bg-slate-800 text-slate-300 font-extrabold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-slate-700">
                              SKU: {item.code}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                          <div className="flex items-center space-x-2.5 mt-2.5 flex-wrap gap-1">
                            <span className="text-[10px] bg-orange-500/10 text-orange-400 font-bold px-2 py-0.5 rounded border border-orange-500/20">
                              Compatível: {item.compatibleWith}
                            </span>
                            {s && (
                              <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded">
                                Loja: {s.name} (~{s.distance}km)
                              </span>
                            )}
                          </div>

                          {/* Photos strip under compatibility / store tags */}
                          {item.photos && item.photos.length > 0 && (
                            <div className="flex gap-2 mt-3 overflow-x-auto py-1">
                              {item.photos.map((photo, pIdx) => (
                                <div 
                                  key={pIdx} 
                                  className="relative w-14 h-14 rounded-lg border border-neutral-800 overflow-hidden shrink-0 bg-neutral-950 group cursor-pointer hover:border-orange-500 transition-colors"
                                  onClick={() => setSelectedZoomPhoto(photo)}
                                >
                                  <img 
                                    src={photo} 
                                    alt={`Foto ${pIdx + 1}`} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-full md:w-auto text-right flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-3 shrink-0 bg-black/40 md:bg-transparent p-3 md:p-0 rounded-xl">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Preço à Vista</span>
                          <span className="text-base font-black text-orange-400">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {s && (
                          <button
                            onClick={() => {
                              setChatModalSupplier(s);
                              setChatModalInitialMsg(item.title);
                              setIsChatModalOpen(true);
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-black border-none" />
                            <span>Orçar no Chat</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Real-time Interactive Chat Tab */}
        {activeTab === 'chat' && (
          <div className="h-[70vh] flex flex-col bg-[#141414] border border-slate-800 rounded-2xl overflow-hidden" id="chat-tab-view">
            {!activeChatId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <span className="text-4xl">💬</span>
                <h3 className="font-bold text-white text-base">Suas Conversas Ativas</h3>
                <p className="text-slate-400 text-xs max-w-xs Leading-relaxed">
                  Negocie preços e detalhes técnicos de peças com consultores de vendas das oficinas selecionadas.
                </p>
                <div className="space-y-2.5 w-full max-w-sm mt-4">
                  {chats.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChatId(c.id)}
                      className="w-full p-3.5 bg-[#1C1C1C] hover:bg-[#222222] transition-colors rounded-xl flex items-center justify-between text-left border border-slate-850 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="w-3 h-3 rounded-full bg-green-500 border border-black animate-pulse" />
                        <div className="truncate">
                          <h4 className="font-bold text-white text-xs md:text-sm truncate">{c.supplierName}</h4>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.lastMessage}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 uppercase tracking-widest">{c.timestamp}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeChat && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Chat Sub Header */}
                  <div className="p-4 bg-[#1C1C1C] border-b border-slate-800 flex items-center justify-between">
                    <button 
                      onClick={() => setActiveChatId(null)}
                      className="p-1.5 px-3 bg-[#262626] hover:bg-[#323232] rounded-lg text-xs font-bold text-slate-300 flex items-center space-x-1 shrink-0"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Voltar</span>
                    </button>

                    <div className="truncate text-center px-4 flex-1">
                      <h4 className="font-extrabold text-white text-xs md:text-sm truncate leading-tight">{activeChat.supplierName}</h4>
                      <span className="text-[10px] text-green-500 font-extrabold tracking-widest uppercase flex items-center justify-center space-x-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                        <span>Canal de Vendas Ativo</span>
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 shrink-0 font-medium font-mono">ID: {activeChat.id.split('_')[1]}</span>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0D0D0D]" id="active-chat-stream">
                    {activeChat.messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex flex-col max-w-[80%] ${msg.sender === 'trucker' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div
                          className={`p-3 rounded-xl text-xs sm:text-sm font-medium leading-relaxed ${
                            msg.sender === 'trucker'
                              ? 'bg-orange-500 text-black rounded-tr-none'
                              : 'bg-[#1C1C1C] text-slate-100 border border-slate-800 rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                      </div>
                    ))}
                  </div>

                  {/* Quick Playbook Template selectors for fast trucker answer */}
                  <div className="px-3 py-2 bg-[#171717] border-t border-slate-850 flex gap-2 overflow-x-auto select-none no-scrollbar shrink-0">
                    <span className="text-[9px] font-black uppercase text-orange-400 shrink-0 self-center tracking-widest mr-1">Rápidas:</span>
                    {[
                      'Tem a peça pronta entrega?',
                      'Qual o valor do desconto à vista?',
                      'Consigo retirar na beira da pista?',
                      'Vocês parcelam em quantas vezes?'
                    ].map((snippet, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTypedMessage(snippet)}
                        className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg text-[10px] text-slate-300 whitespace-nowrap cursor-pointer border border-slate-850 shrink-0"
                      >
                        {snippet}
                      </button>
                    ))}
                  </div>

                  {/* Typing input */}
                  <form onSubmit={handleSendMessage} className="p-3 bg-[#1C1C1C] border-t border-slate-800 flex items-center space-x-2 shrink-0">
                    <input
                      id="trucker-msg-input"
                      type="text"
                      placeholder="Digite sua dúvida ou mande foto do chassi/peça..."
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      className="flex-1 bg-[#121212] border border-slate-800 focus:border-orange-500 transition-colors rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none text-white font-medium"
                    />
                    <button
                      id="send-trucker-msg-btn"
                      type="submit"
                      className="p-3.5 bg-orange-500 hover:bg-orange-600 text-black rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/10"
                    >
                      <Send className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </form>
                </div>
              )
            )}
          </div>
        )}

        {/* Profile Maintenance checklist block */}
        {activeTab === 'perfil' && (
          <div className="space-y-6" id="profile-tab-view">
            
            {/* Owner Truck Profile Information Card */}
            <div className="bg-[#141414] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div className="flex items-center space-x-2.5">
                  <User className="text-orange-500 w-5 h-5 shrink-0" />
                  <h3 className="font-extrabold text-white text-base">Perfil do Motorista</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditTruck(!editTruck)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 hover:text-white px-3 py-1.5 rounded-lg transition-colors font-bold text-slate-300"
                >
                  {editTruck ? 'Cancelar' : 'Editar Dados'}
                </button>
              </div>

              {!editTruck ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="truck-spec-card">
                  <div className="bg-[#1C1C1C] p-3 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Veículo / Chassi</span>
                    <span className="text-white font-extrabold text-sm block mt-0.5">{truck.brand} {truck.model}</span>
                  </div>
                  <div className="bg-[#1C1C1C] p-3 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Placa</span>
                    <span className="text-white font-mono font-black text-sm block mt-0.5">{truck.plate}</span>
                  </div>
                  <div className="bg-[#1C1C1C] p-3 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Quilometragem</span>
                    <span className="text-orange-400 font-extrabold text-sm block mt-0.5">{truck.currentKm.toLocaleString('pt-BR')} KM</span>
                  </div>
                  <div className="bg-[#1C1C1C] p-3 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Motorização</span>
                    <span className="text-white font-extrabold text-xs block mt-0.5">{truck.engineType}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveTruck} className="space-y-4" id="edit-truck-form">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Placa</label>
                      <input
                        type="text"
                        value={truck.plate}
                        onChange={(e) => setTruck({ ...truck, plate: e.target.value })}
                        className="w-full bg-[#1C1C1C] border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">KM Atual</label>
                      <input
                        type="number"
                        value={truck.currentKm}
                        onChange={(e) => setTruck({ ...truck, currentKm: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[#1C1C1C] border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Modelo do Chassi</label>
                      <input
                        type="text"
                        value={truck.model}
                        onChange={(e) => setTruck({ ...truck, model: e.target.value })}
                        className="w-full bg-[#1C1C1C] border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>
                  <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer">
                    Salvar Dados
                  </button>
                </form>
              )}
            </div>

            {/* Google Contacts API CRM & Emergency Contacts Card */}
            <div className="bg-[#141414] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-850 pb-3">
                <div className="flex items-center space-x-2.5">
                  <Phone className="text-amber-500 w-5 h-5 shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-white text-base">Agenda e Contatos de Confiança</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sincronize seus contatos da conta Google para definir alertas de emergência (SOS) ou convidar parceiros de trecho.</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleSyncContacts}
                  disabled={contactsLoading}
                  className="bg-amber-500 hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 border border-amber-400/20"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{contactsLoading ? 'Sincronizando...' : 'Sincronizar Google'}</span>
                </button>
              </div>

              {inviteStatus && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold">
                  {inviteStatus}
                </div>
              )}

              {contactsError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold">
                  {contactsError}
                </div>
              )}

              {googleContacts.length === 0 ? (
                <div className="bg-[#1C1C1C] p-6 rounded-xl border border-slate-850 text-center space-y-2">
                  <p className="text-slate-400 text-xs">Nenhum contato sincronizado ainda na nuvem.</p>
                  <button
                    type="button"
                    onClick={handleSyncContacts}
                    className="text-amber-500 hover:underline text-xs font-bold cursor-pointer"
                  >
                    Clique em Sincronizar para buscar contatos do People API.
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {googleContacts.map((contact, index) => {
                    const isTrusted = trustedPhones.includes(contact.phone);
                    return (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#1C1C1C] border border-slate-850 gap-2 hover:border-amber-500/10 transition-all">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-500 font-extrabold text-xs flex items-center justify-center border border-slate-750">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-white text-xs font-bold flex items-center gap-1.5">
                              <span>{contact.name}</span>
                              {isTrusted && (
                                <span className="text-[9px] bg-red-500/15 border border-red-500/35 text-red-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider scale-95 duration-200">
                                  SOS Ativo
                                </span>
                              )}
                            </h4>
                            <div className="text-[10px] text-slate-500 space-y-0.5 mt-0.5">
                              <p>{contact.phone}</p>
                              {contact.email && <p className="text-[9px] font-mono">{contact.email}</p>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => toggleTrustPhone(contact.phone)}
                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                              isTrusted 
                                ? 'bg-red-500/20 hover:bg-red-500/35 text-red-400 border border-red-500/30' 
                                : 'bg-neutral-800 hover:bg-neutral-750 text-slate-300'
                            }`}
                          >
                            {isTrusted ? 'Remover SOS' : '+ SOS de Confiança'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleInviteContact(contact.name)}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-text-amber-500 text-amber-500 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 border border-amber-500/10"
                          >
                            Convidar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* "Próxima Parada" - Maintenance Alerts tracker */}
            <div className="space-y-4" id="preventive-tracker">
              <div className="border-b border-slate-850 pb-2">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-300 flex items-center space-x-2">
                  <Wrench className="text-orange-500 w-4 h-4" />
                  <span>Próxima Parada - Alertas Preventivos</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Manutenção baseada na quilometragem rodada do veículo</p>
              </div>

              <div className="space-y-4">
                
                {/* Maintenance bar 1: Oil Change */}
                <div className="bg-[#141414] border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-white text-sm">Troca de Óleo de Motor (Shell Rimula 15W40)</h4>
                      <p className="text-xs text-slate-400">Recomendado a cada 20.000 KM. Última troca: {truck.lastOilChangeKm.toLocaleString('pt-BR')} KM</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        oilElapsed > 18000 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        {oilElapsed > 18000 ? 'Urgente!' : 'Troca Segura'}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-1 font-mono">{oilElapsed.toLocaleString('pt-BR')} / 20.000 KM</span>
                    </div>
                  </div>

                  <div className="w-full bg-[#202020] h-3 rounded-full overflow-hidden border border-slate-805">
                    <div 
                      className={`h-full rounded-full transition-all ${oilElapsed > 18000 ? 'bg-red-500' : 'bg-orange-500'}`} 
                      style={{ width: `${oilPercentage}%` }} 
                    />
                  </div>

                  {/* Recommendation action */}
                  {oilElapsed > 15000 && (
                    <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg flex items-center justify-between gap-4">
                      <p className="text-xs text-slate-400">Temos o kit de óleo na Rodovia Serra do Posto Siga Bem (~18km) em promoção!</p>
                      <button 
                        onClick={() => {
                          const sig = suppliers.find(s => s.id === 's3');
                          if (sig) setSelectedSupplier(sig);
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-black text-[10px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors"
                      >
                        Ver Posto
                      </button>
                    </div>
                  )}
                </div>

                {/* Maintenance bar 2: Tires rotation */}
                <div className="bg-[#141414] border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-white text-sm">Rodízio e Balanceamento de Pneus</h4>
                      <p className="text-xs text-slate-400">Recomendado a cada 40.000 KM. Última rotação: {truck.lastTireChangeKm.toLocaleString('pt-BR')} KM</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        tireElapsed > 35000 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        {tireElapsed > 35000 ? 'Urgente!' : 'Rodagem Segura'}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-1 font-mono">{tireElapsed.toLocaleString('pt-BR')} / 40.000 KM</span>
                    </div>
                  </div>

                  <div className="w-full bg-[#202020] h-3 rounded-full overflow-hidden border border-slate-805">
                    <div 
                      className={`h-full rounded-full transition-all ${tireElapsed > 35000 ? 'bg-red-500' : 'bg-orange-400'}`} 
                      style={{ width: `${tirePercentage}%` }} 
                    />
                  </div>
                </div>

                {/* Maintenance bar 3: Brake pads check */}
                <div className="bg-[#141414] border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-white text-sm">Pastilhas e Sistema de Freios Compressor</h4>
                      <p className="text-xs text-slate-400">Recomendado a cada 60.000 KM. Última revisão: {truck.lastBrakeChangeKm.toLocaleString('pt-BR')} KM</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        brakesElapsed > 55000 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        {brakesElapsed > 55000 ? 'Urgente!' : 'Brake Seguro'}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-1 font-mono">{brakesElapsed.toLocaleString('pt-BR')} / 60.000 KM</span>
                    </div>
                  </div>

                  <div className="w-full bg-[#202020] h-3 rounded-full overflow-hidden border border-slate-805">
                    <div 
                      className={`h-full rounded-full transition-all ${brakesElapsed > 55000 ? 'bg-red-500' : 'bg-orange-400'}`} 
                      style={{ width: `${brakesPercentage}%` }} 
                    />
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        )}

      </main>

      {/* Styled Bottom Navigation bar */}
      <nav id="trucker-navbar" className="fixed bottom-0 inset-x-0 bg-[#1A1A1A] border-t border-neutral-800 py-3.5 px-4 z-40 shadow-xl shrink-0 selection:bg-[#FF8C00] selection:text-black">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          {[
            { id: 'inicio', label: 'Início', icon: <Package className="w-5 h-5" /> },
            { id: 'pecas', label: 'Buscar Peças', icon: <Search className="w-5 h-5" /> },
            { id: 'chat', label: 'Chat Vendedor', icon: <MessageSquare className="w-5 h-5" /> },
            { id: 'perfil', label: 'Meu Truck', icon: <Truck className="w-5 h-5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'text-[#FF8C00] scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-extrabold mt-1 tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Render the Direct Chat Modal */}
      <AnimatePresence>
        {isChatModalOpen && (
          <ChatModal
            isOpen={isChatModalOpen}
            onClose={() => {
              setIsChatModalOpen(false);
              setChatModalSupplier(null);
            }}
            supplier={chatModalSupplier}
            chats={chats}
            setChats={setChats}
            initialMessage={chatModalInitialMsg}
            truckModel={`${truck.brand} ${truck.model}`}
          />
        )}
      </AnimatePresence>

      {/* Expanded Photo Lightbox Viewer */}
      <AnimatePresence>
        {selectedZoomPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedZoomPhoto(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-neutral-800 bg-[#121212]"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedZoomPhoto} 
                alt="Zoomed Product" 
                className="w-full max-h-[75vh] object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="p-4 bg-[#1A1A1A] border-t border-neutral-800 flex justify-between items-center">
                <span className="text-xs font-black text-[#FF8C00] uppercase tracking-wider">Visualização ampliada do produto</span>
                <button
                  onClick={() => setSelectedZoomPhoto(null)}
                  className="px-4 py-2 bg-[#FF8C00] hover:bg-orange-600 text-black font-extrabold text-xs rounded-xl"
                >
                  Fechar Foto
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
