/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, Plus, Trash2, 
  Settings, MessageSquare, Send, CheckCircle2, AlertCircle, ShoppingCart, 
  Store, ToggleLeft, ToggleRight, Phone, ShieldCheck, RefreshCw, Layers, Crown,
  Calendar, ArrowUpRight, BarChart2, Download, Award, Search, HelpCircle, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Supplier, CatalogItem, Chat, Message, OrderStats, Seller } from '../types';
import { loadCatalogItems, saveCatalogItems, loadChats, saveChats, loadStats, saveStats, loadSuppliers, saveSuppliers, deleteCatalogItemFromDB } from '../mockData';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateSupplierAnalyticsPDF } from '../analyticsPdfGenerator';
import BusinessPlanView from './BusinessPlanView';
import { generateBusinessPlanPDF } from '../pdfGenerator';

interface SupplierDashboardProps {
  companyName: string;
  cnpj: string;
  phone: string;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  catalogItems: CatalogItem[];
  setCatalogItems: React.Dispatch<React.SetStateAction<CatalogItem[]>>;
  isSeller?: boolean;
  sellerName?: string;
  sellerEmail?: string;
  niche?: 'pesados' | 'passeio' | 'motos';
}

// Period math utility helper for supplier traffic analytics
const getPeriodData = (period: 'hoje' | '7d' | '30d' | 'ano', baseViews: number, baseClicks: number) => {
  switch (period) {
    case 'hoje':
      return [
        { label: '08:00', views: Math.round(baseViews * 0.08), clicks: Math.round(baseClicks * 0.05) },
        { label: '10:00', views: Math.round(baseViews * 0.15), clicks: Math.round(baseClicks * 0.18) },
        { label: '12:00', views: Math.round(baseViews * 0.22), clicks: Math.round(baseClicks * 0.20) },
        { label: '14:00', views: Math.round(baseViews * 0.18), clicks: Math.round(baseClicks * 0.14) },
        { label: '16:00', views: Math.round(baseViews * 0.20), clicks: Math.round(baseClicks * 0.23) },
        { label: '18:00', views: Math.round(baseViews * 0.12), clicks: Math.round(baseClicks * 0.15) },
        { label: '20:00', views: Math.round(baseViews * 0.05), clicks: Math.round(baseClicks * 0.05) },
      ];
    case '7d':
      return [
        { label: 'Seg', views: Math.round(baseViews * 0.12), clicks: Math.round(baseClicks * 0.14) },
        { label: 'Ter', views: Math.round(baseViews * 0.15), clicks: Math.round(baseClicks * 0.13) },
        { label: 'Qua', views: Math.round(baseViews * 0.14), clicks: Math.round(baseClicks * 0.15) },
        { label: 'Qui', views: Math.round(baseViews * 0.18), clicks: Math.round(baseClicks * 0.16) },
        { label: 'Sex', views: Math.round(baseViews * 0.22), clicks: Math.round(baseClicks * 0.21) },
        { label: 'Sáb', views: Math.round(baseViews * 0.11), clicks: Math.round(baseClicks * 0.13) },
        { label: 'Dom', views: Math.round(baseViews * 0.08), clicks: Math.round(baseClicks * 0.08) },
      ];
    case 'ano':
      return [
        { label: 'Jan', views: Math.round(baseViews * 0.06), clicks: Math.round(baseClicks * 0.05) },
        { label: 'Fev', views: Math.round(baseViews * 0.07), clicks: Math.round(baseClicks * 0.08) },
        { label: 'Mar', views: Math.round(baseViews * 0.09), clicks: Math.round(baseClicks * 0.08) },
        { label: 'Abr', views: Math.round(baseViews * 0.08), clicks: Math.round(baseClicks * 0.09) },
        { label: 'Mai', views: Math.round(baseViews * 0.11), clicks: Math.round(baseClicks * 0.12) },
        { label: 'Jun', views: Math.round(baseViews * 0.13), clicks: Math.round(baseClicks * 0.11) },
        { label: 'Jul', views: Math.round(baseViews * 0.12), clicks: Math.round(baseClicks * 0.10) },
        { label: 'Ago', views: Math.round(baseViews * 0.08), clicks: Math.round(baseClicks * 0.09) },
        { label: 'Set', views: Math.round(baseViews * 0.09), clicks: Math.round(baseClicks * 0.08) },
        { label: 'Out', views: Math.round(baseViews * 0.07), clicks: Math.round(baseClicks * 0.09) },
        { label: 'Nov', views: Math.round(baseViews * 0.05), clicks: Math.round(baseClicks * 0.06) },
        { label: 'Dez', views: Math.round(baseViews * 0.05), clicks: Math.round(baseClicks * 0.05) },
      ];
    case '30d':
    default:
      return [
        { label: 'Dia 1-5', views: Math.round(baseViews * 0.12), clicks: Math.round(baseClicks * 0.13) },
        { label: 'Dia 6-10', views: Math.round(baseViews * 0.18), clicks: Math.round(baseClicks * 0.16) },
        { label: 'Dia 11-15', views: Math.round(baseViews * 0.22), clicks: Math.round(baseClicks * 0.25) },
        { label: 'Dia 16-20', views: Math.round(baseViews * 0.15), clicks: Math.round(baseClicks * 0.14) },
        { label: 'Dia 21-25', views: Math.round(baseViews * 0.18), clicks: Math.round(baseClicks * 0.18) },
        { label: 'Dia 26-30', views: Math.round(baseViews * 0.15), clicks: Math.round(baseClicks * 0.14) },
      ];
  }
};

export default function SupplierDashboard({
  companyName,
  cnpj,
  phone,
  suppliers,
  setSuppliers,
  catalogItems,
  setCatalogItems,
  isSeller = false,
  sellerName = '',
  sellerEmail = '',
  niche = 'pesados'
}: SupplierDashboardProps) {
  // Find which supplier corresponds to this login session or use a default one like Tietê s1
  const [vendorSupplier, setVendorSupplier] = useState<Supplier | null>(null);

  // States
  const [stats, setStats] = useState<OrderStats>({ views: 842, clicks: 147, quotesCount: 34, salesClosed: 19 });
  const [activeTab, setActiveTab] = useState<'painel' | 'catalogo' | 'chats' | 'plano' | 'vendedores'>('painel');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState('');

  // Seller management states (Admin only)
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerEmail, setNewSellerEmail] = useState('');
  const [newSellerPhone, setNewSellerPhone] = useState('');
  const [sellerSearch, setSellerSearch] = useState('');

  // Analytics states
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | '7d' | '30d' | 'ano'>('30d');
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const [searchProductQuery, setSearchProductQuery] = useState('');

  // Catalog manager state
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Componentes de Motor');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemCompatibility, setNewItemCompatibility] = useState('Volvo FH 540');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemImage, setNewItemImage] = useState('⚙️');
  const [newItemPhotos, setNewItemPhotos] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // File upload change handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const remainingSlots = 2 - newItemPhotos.length;
    if (remainingSlots <= 0) return;
    
    const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewItemPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setNewItemPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (!files) return;

    const remainingSlots = 2 - newItemPhotos.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);
    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewItemPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const [showAddForm, setShowAddForm] = useState(false);

  // Match and load active supplier session on mount
  useEffect(() => {
    // Look up in suppliers list or generate a new session profile for this brand
    const existing = suppliers.find(s => s.name.toLowerCase() === companyName.toLowerCase());
    if (existing) {
      setVendorSupplier(existing);
    } else {
      // Create and merge a new supplier profile
      const newS: Supplier = {
        id: `s_${Date.now()}`,
        name: companyName || 'Tietê Diesel Autopeças',
        specialty: 'Distribuidora Premium Auto-Fornecida',
        category: 'pecas',
        distance: 1.5,
        rating: 5.0,
        reviewsCount: 1,
        isOnline: true,
        contactPhone: phone || '(11) 98765-4321',
        whatsappNumber: phone ? phone.replace(/\D/g, '') : '5511987654321',
        address: 'Rodovia Presidente Dutra, KM 180 - São Paulo, SP',
        isVerified: true,
        isFoundingPartner: true,
        niche: niche || 'pesados'
      };
      
      const updatedList = [...suppliers, newS];
      setSuppliers(updatedList);
      saveSuppliers(updatedList);
      setVendorSupplier(newS);
    }

    setChats(loadChats());
    setStats(loadStats());

    // Live sync dashboard metrics (stats)
    const unsubStats = onSnapshot(doc(db, 'stats', 'global_stats'), (snapshot) => {
      if (snapshot.exists()) {
        setStats(snapshot.data() as OrderStats);
      }
    }, (err) => {
      console.warn('Stats sync error: ', err);
    });

    // Live sync active supplier chats
    const unsubChats = onSnapshot(collection(db, 'chats'), (snapshot) => {
      const list: Chat[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Chat);
      });
      if (list.length > 0) {
        setChats(list);
      }
    }, (err) => {
      console.warn('Chats sync error: ', err);
    });

    // Live sync active sellers
    const unsubSellers = onSnapshot(collection(db, 'sellers'), (snapshot) => {
      const list: Seller[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Seller);
      });
      setSellers(list);
    }, (err) => {
      console.warn('Sellers sync error: ', err);
    });

    return () => {
      unsubStats();
      unsubChats();
      unsubSellers();
    };
  }, [companyName]);

  // Online / Offline Status Toggle Helper
  const handleToggleOnline = (status?: boolean) => {
    if (!vendorSupplier) return;
    const nextStatus = status !== undefined ? status : !vendorSupplier.isOnline;

    // Update locally
    const updatedS = { ...vendorSupplier, isOnline: nextStatus };
    setVendorSupplier(updatedS);

    // Update in parent global list
    const updatedList = suppliers.map(s => s.id === vendorSupplier.id ? updatedS : s);
    setSuppliers(updatedList);
    saveSuppliers(updatedList);
  };

  // Seller Actions & Management Helpers
  const handleAddSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorSupplier || !newSellerName || !newSellerEmail) return;

    const newS: Seller = {
      id: `v_${Date.now()}`,
      supplierId: vendorSupplier.id,
      name: newSellerName,
      email: newSellerEmail.trim().toLowerCase(),
      phone: newSellerPhone || '(11) 99999-9999',
      isAuthorized: true,
      registeredAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'sellers', newS.id), newS);
      setNewSellerName('');
      setNewSellerEmail('');
      setNewSellerPhone('');
    } catch (err) {
      console.error('Failed to register seller in Firestore: ', err);
    }
  };

  const handleToggleSellerAuth = async (sellerId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'sellers', sellerId), {
        isAuthorized: !currentStatus
      });
    } catch (err) {
      // Fallback
      const sellerToUpdate = sellers.find(s => s.id === sellerId);
      if (sellerToUpdate) {
        await setDoc(doc(db, 'sellers', sellerId), {
          ...sellerToUpdate,
          isAuthorized: !currentStatus
        });
      }
    }
  };

  const handleDeleteSeller = async (sellerId: string) => {
    if (confirm('Tem certeza que deseja desvincular e excluir este vendedor?')) {
      try {
        await deleteDoc(doc(db, 'sellers', sellerId));
      } catch (err) {
        console.error('Delete seller error: ', err);
      }
    }
  };

  // Add Item in Catalog Manager
  const handleAddCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorSupplier || !newItemTitle || !newItemPrice) return;

    const priceNum = parseFloat(newItemPrice) || 0;
    const newItem: CatalogItem = {
      id: `p_${Date.now()}`,
      supplierId: vendorSupplier.id,
      title: newItemTitle,
      category: newItemCategory,
      code: newItemCode || `EP-${Math.floor(Math.random() * 900) + 100}`,
      price: priceNum,
      compatibleWith: newItemCompatibility,
      description: newItemDescription || `Excelente componente de alta durabilidade e segurança para o segmento de ${niche === 'passeio' ? 'carros' : niche === 'motos' ? 'motos' : 'veículos pesados'}.`,
      image: newItemImage,
      photos: newItemPhotos,
      niche: niche || 'pesados'
    };

    const updatedCatalog = [newItem, ...catalogItems];
    setCatalogItems(updatedCatalog);
    saveCatalogItems(updatedCatalog);

    // Update stats click metrics
    const updatedStatState = {
      ...stats,
      views: stats.views + 12,
    };
    setStats(updatedStatState);
    saveStats(updatedStatState);

    // Clear form
    setNewItemTitle('');
    setNewItemPrice('');
    setNewItemCode('');
    setNewItemDescription('');
    setNewItemPhotos([]);
    setShowAddForm(false);
  };

  // Delete item from catalog
  const handleDeleteCatalogItem = (id: string) => {
    const updated = catalogItems.filter(item => item.id !== id);
    setCatalogItems(updated);
    deleteCatalogItemFromDB(id).catch(e => console.warn('Failed dry deleting from DB: ', e));
  };

  // Send message from supplier to trucker
  const handleSendSupplierMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeChatId || !vendorSupplier) return;

    const messageText = typedMessage;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const activeChatIndex = chats.findIndex(c => c.id === activeChatId);
    if (activeChatIndex === -1) return;

    const currentChat = chats[activeChatIndex];
    const newMsg: Message = {
      id: `m_supp_${Date.now()}`,
      sender: 'supplier',
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

    // Update sales closed statistics metrics on specific trigger
    if (messageText.toLowerCase().includes('fechar') || messageText.toLowerCase().includes('desconto')) {
      const uStats = { ...stats, salesClosed: stats.salesClosed + 1 };
      setStats(uStats);
      saveStats(uStats);
    }
  };

  // Apply script template playbook in chat
  const applyPlaybookScript = (script: string) => {
    setTypedMessage(script);
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  // Filter components belonging strictly to this supplier session and matching the current niche
  const supplierCatalogItems = vendorSupplier 
    ? catalogItems.filter(item => item.supplierId === vendorSupplier.id && (!item.niche || item.niche === niche))
    : [];

  return (
    <div id="supplier-dashboard-panel" className="bg-[#121212] text-slate-100 flex flex-col min-h-screen selection:bg-[#FF8C00] selection:text-black font-sans">
      {/* Dynamic Supplier Admin Header */}
      <header className="bg-[#1A1A1A] border-b border-neutral-800 py-4 px-4 sticky top-0 z-30 shadow-lg shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Crown Overlaid Store Icon */}
            <div className="relative w-10 h-10 bg-gradient-to-br from-[#FF8C00] to-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20 shadow-md">
              <div className="absolute -top-1.5 bg-black/95 px-1 py-0.5 rounded-full border border-amber-500/40 shadow-sm">
                <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              </div>
              <Store className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[#FF8C00] text-[10px] uppercase font-black tracking-wider">Painel Anunciante</span>
                <span className="bg-[#FF8C00]/10 px-2 py-0.5 rounded-full border border-[#FF8C00]/20 text-[9px] text-[#FF8C00] font-extrabold uppercase flex items-center gap-0.5">
                  <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400 animate-pulse" />
                  <span>Parceiro Fundador</span>
                </span>
              </div>
              <h1 className="text-sm font-extrabold text-slate-300 leading-none mt-1 flex items-center gap-1.5 flex-wrap">
                <span>{companyName}</span>
                <span className="text-slate-500 font-medium">|</span>
                <span className="bg-gradient-to-r from-[#FF8C00] via-amber-400 to-[#FF8C00] bg-clip-text text-transparent font-black tracking-wider text-xs">IMPÉRIO</span>
                {isSeller && (
                  <span className="bg-amber-500/10 text-[#FF8C00] border border-[#FF8C00]/25 text-[9px] px-2 py-0.5 rounded font-black uppercase flex items-center gap-1 shrink-0">
                    <User className="w-2.5 h-2.5 text-amber-500" />
                    <span>Vendedor: {sellerName}</span>
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Quick Active Online Switch */}
          {vendorSupplier && (
            <div className="flex items-center space-x-2 bg-[#1E1E1E] p-1.5 rounded-xl border border-neutral-800">
              <span className="text-[10px] font-black uppercase text-slate-400 pl-1.5">Status:</span>
              <button 
                id="toggle-online-btn"
                onClick={() => handleToggleOnline()} 
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  vendorSupplier.isOnline 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${vendorSupplier.isOnline ? 'bg-green-400 animate-pulse' : 'bg-rose-400'}`} />
                <span>{vendorSupplier.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-4xl mx-auto w-full p-4 flex-1">
        
        {/* Navigation tabs selector */}
         <div className="flex bg-[#1E1E1E] p-1.5 rounded-xl border border-neutral-800 mb-6 shrink-0 overflow-x-auto no-scrollbar" id="supplier-tabs-wrap">
          {[
            { id: 'painel', label: 'Painel & Métricas', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'catalogo', label: 'Gerenciar Catálogo', icon: <Layers className="w-4 h-4" /> },
            { id: 'chats', label: `Chats Ativos (${chats.length})`, icon: <MessageSquare className="w-4 h-4" /> },
            ...(!isSeller ? [{ id: 'vendedores', label: 'Gerenciar Vendedores', icon: <Users className="w-4 h-4" /> }] : []),
            { id: 'plano', label: 'Diretrizes & Plano', icon: <HelpCircle className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-3 rounded-lg text-xs md:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#FF8C00] text-black shadow-lg shadow-[#FF8C00]/10'
                  : 'text-slate-400 hover:text-[#FF8C00]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="inline sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {activeTab === 'painel' && (
          <div className="space-y-6 animate-fadeIn" id="metrics-tab-view">
            
            {/* Dedicated Status Selector for Urgent Calls / SOS */}
            {vendorSupplier && (
              <div className="bg-[#1E1E1E] p-4 rounded-xl border border-neutral-800 space-y-4" id="urgent-status-selector-panel">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-850 pb-3">
                  <div>
                    <div className="flex items-center space-x-1.5 text-orange-400 font-extrabold text-[10px] uppercase tracking-widest">
                      <span className="flex h-2 w-2 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${vendorSupplier.isOnline ? 'bg-green-400' : 'bg-red-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${vendorSupplier.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </span>
                      <span>Disponibilidade de Plantão 24h</span>
                    </div>
                    <h3 className="text-sm font-black text-white mt-1 leading-none">Status de Atendimento na Rodovia</h3>
                  </div>

                  {/* Segmented Selector Buttons */}
                  <div className="flex bg-[#121212] p-1 rounded-lg border border-neutral-800" id="online-offline-segmented-button">
                    <button
                      type="button"
                      id="status-select-online"
                      onClick={() => handleToggleOnline(true)}
                      className={`px-3 py-1.5 text-xs font-black rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                        vendorSupplier.isOnline 
                          ? 'bg-green-600 text-white shadow-md' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-green-300 animate-pulse" />
                      <span>Online / Disponível</span>
                    </button>
                    <button
                      type="button"
                      id="status-select-offline"
                      onClick={() => handleToggleOnline(false)}
                      className={`px-3 py-1.5 text-xs font-black rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                        !vendorSupplier.isOnline 
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/50 shadow-md' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Offline / Indisponível</span>
                    </button>
                  </div>
                </div>

                {/* Explanatory dynamic banner */}
                <div className={`p-3 rounded-lg text-xs flex gap-2.5 items-start ${
                  vendorSupplier.isOnline 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-300' 
                    : 'bg-rose-500/5 border border-rose-500/15 text-rose-300'
                }`}>
                  {vendorSupplier.isOnline ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-white">Você está ONLINE para chamados urgentes!</p>
                        <p className="text-slate-400 mt-0.5 leading-relaxed">
                          Seu estabelecimento aparece em destaque e no topo do mapa de cobertura dos motoristas na rodovia para chamados rápidos. Motoristas que sofrerem panes ou precisarem de suporte emergencial de peças, guincho, borracharia ou mecânica podem te contatar imediatamente.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-white">Você está OFFLINE para chamados de emergência.</p>
                        <p className="text-slate-400 mt-0.5 leading-relaxed">
                          Sua empresa não aparecerá no topo do radar nem receberá as solicitações rápidas de SOS para pane na estrada. Os motoristas só poderão solicitar orçamentos regulares fora de plantão.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Analytics Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1E1E1E] p-4 rounded-xl border border-neutral-800" id="analytics-controls-header">
              <div className="flex items-center space-x-2">
                <Calendar className="text-[#FF8C00] w-5 h-5" />
                <span className="text-xs font-black uppercase text-slate-300">Resumo de Atividades</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Period Selector Buttons */}
                <div className="flex bg-[#121212] p-1 rounded-lg border border-neutral-800" id="period-switchers">
                  {[
                    { id: 'hoje', label: 'Hoje' },
                    { id: '7d', label: '7 Dias' },
                    { id: '30d', label: '30 Dias' },
                    { id: 'ano', label: '1 Ano' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      id={`period-btn-${p.id}`}
                      onClick={() => setSelectedPeriod(p.id as any)}
                      className={`text-[10px] md:text-xs font-black px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                        selectedPeriod === p.id 
                          ? 'bg-[#FF8C00] text-black shadow-md' 
                          : 'text-slate-400 hover:text-[#FF8C00]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Export Analytics Button */}
                <button
                  id="export-pdf-analytics-btn"
                  onClick={() => generateSupplierAnalyticsPDF(companyName, stats, supplierCatalogItems.length, selectedPeriod === 'hoje' ? 'Hoje' : selectedPeriod === '7d' ? '7 Dias' : selectedPeriod === '30d' ? '30 Dias' : '1 Ano')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs py-2 px-3.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ml-auto shadow-md shadow-emerald-500/10"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>PDF Executivo</span>
                </button>
              </div>
            </div>

            {/* Visual metrics cards grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="stats-cards-grid">
              {[
                { label: 'Cliques Anúncio (Vistas)', val: stats.views, desc: 'Visualizações de catálogo', icon: <Users className="text-[#FF8C00] w-5 h-5" />, trend: '+14% esta semana', isPositive: true },
                { label: 'Leads Ativos (Cliques)', val: stats.clicks, desc: 'Cliques para contato', icon: <Phone className="text-emerald-500 w-5 h-5" />, trend: '+8.3% conversão', isPositive: true },
                { label: 'Orçamentos (Chats)', val: stats.quotesCount, desc: 'Solicitações de cotação', icon: <MessageSquare className="text-purple-500 w-5 h-5" />, trend: '3 pendentes hoje', isPositive: false },
                { label: 'Vendas Fechadas (Métricas)', val: stats.salesClosed, desc: 'Fechamentos aproximados', icon: <ShoppingBag className="text-amber-500 w-5 h-5" />, trend: '15.4% taxa média', isPositive: true }
              ].map((card, i) => (
                <div key={i} className="bg-[#1E1E1E] border border-neutral-800 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-lg shadow-black/5 hover:border-neutral-700 transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider leading-none">{card.label}</span>
                    {card.icon}
                  </div>
                  <div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl md:text-3xl font-black text-white leading-none">{card.val}</span>
                      <span className="text-[9px] text-[#FF8C00] font-bold">R$</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block leading-snug">{card.desc}</span>
                  </div>
                  <div className="border-t border-neutral-800/60 pt-2 flex items-center justify-between text-[9px]">
                    <span className="text-slate-500">Méd. Diária</span>
                    <span className={`font-bold ${card.isPositive ? 'text-emerald-500' : 'text-amber-500'}`}>{card.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Trend Chart Section */}
            <div className="bg-[#1E1E1E] border border-neutral-800 p-4 rounded-xl space-y-4" id="trend-chart-component shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Flutuação de Cliques e Interesse de Compra</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Clique ou passe o mouse nos pontos para obter detalhes diários</p>
                </div>
                
                <div className="flex items-center space-x-3 text-[10px]">
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-1 px-1 bg-[#FF8C00] rounded-full inline-block" />
                    <span className="text-slate-400">Views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-1 px-1 bg-emerald-500 rounded-full inline-block" />
                    <span className="text-slate-400">Leads (Whatsapp)</span>
                  </div>
                </div>
              </div>

              {/* Pure SVG Animated Chart with Hovers */}
              {(() => {
                const data = getPeriodData(selectedPeriod, stats.views, stats.clicks);
                const maxViews = Math.max(...data.map(d => d.views), 1);
                const maxClicks = Math.max(...data.map(d => d.clicks), 1);
                const maxVal = Math.max(maxViews, maxClicks);

                const width = 500;
                const height = 200;
                const pLeft = 40;
                const pRight = 20;
                const pTop = 20;
                const pBottom = 30;

                const usableW = width - pLeft - pRight;
                const usableH = height - pTop - pBottom;

                // Points calculation
                const ptsViewsArray = data.map((d, i) => {
                  const x = pLeft + (i / (data.length - 1)) * usableW;
                  const y = height - pBottom - (d.views / maxVal) * usableH;
                  return { x, y, views: d.views, clicks: d.clicks, label: d.label };
                });

                const ptsClicksArray = data.map((d, i) => {
                  const x = pLeft + (i / (data.length - 1)) * usableW;
                  const y = height - pBottom - (d.clicks / maxVal) * usableH;
                  return { x, y };
                });

                const polylineViewsStr = ptsViewsArray.map(pt => `${pt.x},${pt.y}`).join(' ');
                const polylineClicksStr = ptsClicksArray.map(pt => `${pt.x},${pt.y}`).join(' ');

                const areaViewsStr = ptsViewsArray.length > 0 
                  ? `${polylineViewsStr} ${pLeft + usableW},${height - pBottom} ${pLeft},${height - pBottom}` 
                  : '';
                const areaClicksStr = ptsClicksArray.length > 0 
                  ? `${polylineClicksStr} ${pLeft + usableW},${height - pBottom} ${pLeft},${height - pBottom}` 
                  : '';

                return (
                  <div className="relative" id="interactive-svg-container">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 sm:h-64 overflow-visible">
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF8C00" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#FF8C00" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Behind grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const y = height - pBottom - ratio * usableH;
                        const labelValue = Math.round(ratio * maxVal);
                        return (
                          <g key={i} className="opacity-35">
                            <line
                              x1={pLeft}
                              y1={y}
                              x2={width - pRight}
                              y2={y}
                              stroke="#2E2E2E"
                              strokeDasharray="4 4"
                              strokeWidth={1}
                            />
                            <text
                              x={pLeft - 8}
                              y={y + 3}
                              fill="#666"
                              fontSize={8}
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="end"
                            >
                              {labelValue}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area Shapes */}
                      <polygon points={areaViewsStr} fill="url(#viewsGrad)" />
                      <polygon points={areaClicksStr} fill="url(#clicksGrad)" />

                      {/* Trend Lines */}
                      <polyline
                        points={polylineViewsStr}
                        fill="none"
                        stroke="#FF8C00"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points={polylineClicksStr}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Dots & Highlight Markers */}
                      {ptsViewsArray.map((pt, i) => (
                        <g key={i}>
                          {/* Views Dot */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={hoveredDayIndex === i ? 5 : 3}
                            fill="#FF8C00"
                            stroke="#1E1E1E"
                            strokeWidth={1.5}
                            className="transition-all duration-150"
                          />
                          {/* Clicks Dot */}
                          <circle
                            cx={ptsClicksArray[i].x}
                            cy={ptsClicksArray[i].y}
                            r={hoveredDayIndex === i ? 5 : 3}
                            fill="#10B981"
                            stroke="#1E1E1E"
                            strokeWidth={1.5}
                            className="transition-all duration-150"
                          />

                          {/* Hover highlights */}
                          {hoveredDayIndex === i && (
                            <line
                              x1={pt.x}
                              y1={pTop}
                              x2={pt.x}
                              y2={height - pBottom}
                              stroke="#555"
                              strokeDasharray="2 2"
                              strokeWidth={1}
                            />
                          )}

                          {/* X Axis Labels */}
                          <text
                            x={pt.x}
                            y={height - pBottom + 14}
                            fill="#888"
                            fontSize={8}
                            fontWeight="800"
                            textAnchor="middle"
                          >
                            {pt.label}
                          </text>
                        </g>
                      ))}

                      {/* Invisible hover zones */}
                      {ptsViewsArray.map((pt, i) => (
                        <rect
                          key={i}
                          x={pt.x - (usableW / (data.length - 1)) / 2}
                          y={pTop}
                          width={usableW / (data.length - 1)}
                          height={usableH}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredDayIndex(i)}
                          onMouseLeave={() => setHoveredDayIndex(null)}
                        />
                      ))}
                    </svg>

                    {/* Tooltip Overlay */}
                    {hoveredDayIndex !== null && (
                      <div 
                        id="chart-floating-tooltip"
                        className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/95 text-slate-200 border border-neutral-800 p-3 rounded-xl flex items-center space-x-4 shadow-xl text-xs z-20 backdrop-blur-md animate-fadeIn"
                      >
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black">Período: {data[hoveredDayIndex].label}</p>
                          <p className="font-extrabold text-[#FF8C00] text-sm mt-0.5">👁️ {data[hoveredDayIndex].views} Cliques Vitrine</p>
                        </div>
                        <div className="border-l border-neutral-800 h-8 self-center" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black">Eficiência</p>
                          <p className="font-extrabold text-emerald-500 text-sm mt-0.5">📞 {data[hoveredDayIndex].clicks} Conversões Leads</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* B2C Dynamic Conversion Funnel Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="conversion-funnel-container">
              
              {/* Funnel visual box */}
              <div className="bg-[#1E1E1E] border border-neutral-800 rounded-xl p-4 md:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Aproveitamento e Funil de Compras</h3>
                  <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold px-2.5 py-0.5 rounded-full uppercase">Comercial</span>
                </div>

                {(() => {
                  const clickRate = stats.views > 0 ? ((stats.clicks / stats.views) * 100).toFixed(1) : '0';
                  const quoteRate = stats.clicks > 0 ? ((stats.quotesCount / stats.clicks) * 100).toFixed(1) : '0';
                  const closeRate = stats.quotesCount > 0 ? ((stats.salesClosed / stats.quotesCount) * 100).toFixed(1) : '0';

                  return (
                    <div className="space-y-3.5" id="funnel-bars-flow">
                      {[
                        { label: '1. Descoberta & Impressões', percent: '100%', absolute: `${stats.views} visualizações de peças`, style: 'w-full bg-[#3E3E3E]' },
                        { label: '2. Interesse (Cliques no Contato)', percent: `${clickRate}%`, absolute: `${stats.clicks} cliques para atendimento`, style: 'bg-gradient-to-r from-[#FF8C00] to-orange-500', wVal: clickRate },
                        { label: '3. Ação & Cotações Abertas', percent: `${quoteRate}%`, absolute: `${stats.quotesCount} chats ativos com propostas`, style: 'bg-gradient-to-r from-purple-500 to-indigo-600', wVal: quoteRate },
                        { label: '4. Fechamentos Diretos / Depósito', percent: `${closeRate}%`, absolute: `${stats.salesClosed} negociações fechadas`, style: 'bg-gradient-to-r from-emerald-500 to-green-600', wVal: closeRate }
                      ].map((item, idx) => {
                        const wPercent = idx === 0 ? '100%' : `${Math.max(10, Math.min(100, parseFloat(item.wVal || '10')))}%`;
                        return (
                          <div key={idx} className="space-y-1 bg-[#151515] p-3 rounded-lg border border-neutral-850" id={`funnel-step-${idx}`}>
                            <div className="flex justify-between items-baseline text-xs">
                              <span className="font-extrabold text-slate-300">{item.label}</span>
                              <div className="flex space-x-2 text-[10px]">
                                <span className="text-slate-500 font-mono">{item.absolute}</span>
                                <span className="text-[#FF8C00] font-black">{item.percent}</span>
                              </div>
                            </div>
                            <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden mt-1 text-[1px]">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${item.style}`} 
                                style={{ width: wPercent }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Conversion intelligence suggestions */}
              <div className="bg-[#1E1E1E] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-1">
                    <Award className="text-amber-400 w-4.5 h-4.5" />
                    <h4 className="text-xs font-black uppercase text-slate-300">Diagnóstico de Vendas</h4>
                  </div>
                  
                  <div className="bg-[#151515] p-3 rounded-lg border border-neutral-850 space-y-2">
                    <p className="text-[11px] font-black text-amber-400">Eficiência Alta no Lead!</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Sua taxa de clique para cotação está acima de <strong>20%</strong>. Os motoristas demonstram grande confiança em sua distribuidora.
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-1">
                    <p className="font-bold uppercase tracking-wider text-slate-400">Práticas de ouro:</p>
                    <p>• Forneça fotos originais do chassi para homologar peças.</p>
                    <p>• Responda em menos de 5 Minutos para evitar que o rival feche.</p>
                  </div>
                </div>

                <div className="border-t border-neutral-850 pt-2 text-[10px] text-slate-400 flex items-center gap-1.5 leading-snug">
                  <span className="text-emerald-500 text-base">●</span>
                  <span><strong>86%</strong> de satisfatibilidade na serra rodoviária paulista.</span>
                </div>
              </div>

            </div>

            {/* Performance Ranking of Live Catalog Items */}
            <div className="bg-[#1E1E1E] border border-neutral-800 rounded-xl p-4 space-y-4" id="supplier-ranking-section">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Desempenho por Componente de Vitrine</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Analise quais peças geram mais leads de venda e visualizações</p>
                </div>

                <div className="relative w-full sm:w-60">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    id="search-ranking-input"
                    type="text"
                    placeholder="Filtrar peça na análise..."
                    value={searchProductQuery}
                    onChange={(e) => setSearchProductQuery(e.target.value)}
                    className="w-full bg-[#121212] border border-slate-800 focus:border-[#FF8C00] focus:ring-0 focus:outline-none rounded-xl py-1.5 pl-9 pr-3 text-xs text-white"
                  />
                </div>
              </div>

              {/* Items ranking layout */}
              <div className="space-y-2">
                {(() => {
                  const filteredRanking = supplierCatalogItems.filter(item => 
                    item.title.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
                    item.code.toLowerCase().includes(searchProductQuery.toLowerCase())
                  );

                  if (filteredRanking.length === 0) {
                    return (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        {supplierCatalogItems.length === 0 
                          ? 'Métricas vazias. Adicione peças na aba "Gerenciar Catálogo" para obter as métricas dinâmicas!' 
                          : 'Nenhum componente encontrado pelo termo de busca informado.'
                        }
                      </div>
                    );
                  }

                  return filteredRanking.map((item, idx) => {
                    // Distribute views and clicks based on total counters
                    const itemViews = Math.round(stats.views * (0.35 / (idx + 1))) + 12;
                    const itemClicks = Math.round(stats.clicks * (0.30 / (idx + 1))) + 3;
                    const itemQuoteRate = ((itemClicks / itemViews) * 100).toFixed(1);

                    return (
                      <div key={item.id} className="p-3 bg-[#151515] rounded-xl border border-neutral-850 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center space-x-2.5 truncate">
                          <span className="text-lg font-black font-mono text-slate-500 w-5">#{idx + 1}</span>
                          <span className="text-xl p-1 bg-[#1E1E1E] rounded-md">{item.image}</span>
                          <div className="truncate">
                            <h4 className="font-black text-white truncate leading-tight">{item.title}</h4>
                            <p className="text-[10px] text-slate-500 truncate uppercase mt-0.5">Código: {item.code} | Filtro: {item.compatibleWith}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 justify-between md:justify-end shrink-0 text-[10px] border-t border-neutral-850 md:border-none pt-2.5 md:pt-0">
                          <div>
                            <span className="text-slate-500 uppercase block">Cliques Anúncio</span>
                            <span className="font-extrabold text-slate-300 font-mono text-xs">{itemViews} vistas</span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase block">WhatsApp Leads</span>
                            <span className="font-extrabold text-emerald-500 font-mono text-xs">{itemClicks} desvios</span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase block">Taxa Conversão</span>
                            <span className="font-black text-[#FF8C00] font-mono text-xs">{itemQuoteRate}%</span>
                          </div>
                          <span className="text-xs font-black text-neutral-400 bg-neutral-800 px-2.5 py-1 rounded-lg">
                            R$ {item.price.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Campaign info alert */}
            <div className="bg-[#1A1A1A] border border-[#FF8C00]/15 rounded-xl p-4 flex items-start gap-3" id="founding-partner-disclaimer-box">
              <ShieldCheck className="w-7 h-7 text-[#FF8C00] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Carência do Anunciante Fundador</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Sua loja possui o selo <strong className="text-[#FF8C00]">Parceiro Fundador</strong>. Sua isenção de mensalidade vigora pelos primeiros 30 dias de operação do aplicativo piloto, com destaque garantido no topo das buscas regionais.
                </p>
              </div>
            </div>

            {/* Business Plan PDF direct download card */}
            <div className="bg-[#1E1E1E] border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="business-plan-download-card">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-neutral-900 border border-neutral-850 text-[#FF8C00] rounded-xl shrink-0">
                  <span className="text-xl">📄</span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Plano de Negócios Oficial (PDF)</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Acesse o planejamento comercial completo, regras de monetização, política pós-carência, tabela oficial de comissionamento de vendas e projeções financeiras do ecossistema.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => generateBusinessPlanPDF()}
                className="bg-[#FF8C00]/10 border border-[#FF8C00]/30 hover:bg-[#FF8C00]/25 text-[#FF8C00] font-black text-xs py-2 px-4 rounded-xl flex items-center justify-center space-x-1.5 transition-all shrink-0 cursor-pointer"
                id="supplier-download-plan-direct-btn"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Plano (.PDF)</span>
              </button>
            </div>

          </div>
        )}

        {/* Catalog Manager Tab */}
        {activeTab === 'catalogo' && (
          <div className="space-y-4" id="supplier-catalog-tab">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">Seu Estoque Online ({supplierCatalogItems.length} itens)</h2>
                <p className="text-xs text-slate-500">Mantenha os preços e compatibilidade atualizados para os motoristas</p>
              </div>
              <button
                id="show-add-form-btn"
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs py-2 px-3.5 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Adicionar Peça</span>
              </button>
            </div>

            {/* Animated expand form for adding items */}
            {showAddForm && (
              <motion.form 
                onSubmit={handleAddCatalogItem}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414] border border-orange-500/20 rounded-2xl p-4 md:p-5 space-y-4"
                id="add-catalog-item-form"
              >
                <h4 className="text-sm font-extrabold text-slate-200 border-b border-slate-850 pb-2 flex items-center space-x-2">
                  <Plus className="text-orange-500 w-4 h-4" />
                  <span>Nova Peça para seu Catálogo</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Título / Nome Genuíno</label>
                    <input
                      id="new-item-title-input"
                      type="text"
                      required
                      placeholder="Ex: Turbina BorgWarner Volvo FK540"
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Categoria de Peças</label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    >
                      <option value="Componentes de Motor">Componentes de Motor</option>
                      <option value="Peças de Transmissão">Peças de Transmissão</option>
                      <option value="Suspensão">Suspensão</option>
                      <option value="Componentes Hidráulicos">Componentes Hidráulicos</option>
                      <option value="Freios e Segurança">Freios e Segurança</option>
                      <option value="Pneus e Rodas">Pneus e Rodas</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Preço de Venda (R$)</label>
                    <input
                      id="new-item-price-input"
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ex: 6890.00"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Código Original SKU (Opcional)</label>
                    <input
                      id="new-item-sku-input"
                      type="text"
                      placeholder="Ex: TB-V540-BGWN"
                      value={newItemCode}
                      onChange={(e) => setNewItemCode(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Compatibilidade de Chassi</label>
                    <input
                      id="new-item-compatibility-input"
                      type="text"
                      required
                      placeholder="Ex: Volvo FH 540 / FH 460"
                      value={newItemCompatibility}
                      onChange={(e) => setNewItemCompatibility(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Ícone Representativo</label>
                    <select
                      value={newItemImage}
                      onChange={(e) => setNewItemImage(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    >
                      <option value="⚙️">⚙️ Engrenagem / Geral</option>
                      <option value="🌀">🌀 Turbina / Motor</option>
                      <option value="🛞">🛞 Roda / Pneu / Freios</option>
                      <option value="🔌">🔌 Alternador / Elétrico</option>
                      <option value="🎈">🎈 Bolsa de Ar / Suspensão</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Descrição Técnica da Peça</label>
                  <textarea
                    id="new-item-description-textarea"
                    placeholder="Descreva detalhes como liga cerâmica, pressão nominal de trabalho, fabricante e vantagens competitivas de aquisição do componente..."
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-slate-800 rounded-lg p-2.5 text-xs text-white h-20 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* 2 Photos Upload Section */}
                <div className="space-y-2 border-t border-neutral-800/40 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold flex items-center space-x-1">
                      <span>📸 Fotos do Produto (Até 2 Fotos)</span>
                    </label>
                    <span className="text-[10px] font-bold text-slate-500">
                      {newItemPhotos.length} de 2 carregadas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Previews / Slots */}
                    {newItemPhotos.map((photo, index) => (
                      <div key={index} className="relative bg-[#1A1A1A] border border-neutral-850 rounded-xl overflow-hidden h-28 flex items-center justify-center">
                        <img 
                          src={photo} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-rose-600 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Remover foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/80 rounded text-[9px] font-black uppercase text-[#FF8C00]">
                          Foto {index + 1}
                        </span>
                      </div>
                    ))}

                    {/* Upload box if slots available */}
                    {newItemPhotos.length < 2 && (
                      <div
                        id="photo-dropzone animate-fadeIn"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload-input')?.click()}
                        className={`border-2 border-dashed rounded-xl h-28 flex flex-col items-center justify-center p-4 cursor-pointer transition-all text-center select-none ${
                          isDragOver 
                            ? 'border-[#FF8C00] bg-[#FF8C00]/5 text-[#FF8C00]' 
                            : 'border-neutral-800 hover:border-neutral-700 bg-[#1C1C1C] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-2xl mb-1">📥</span>
                        <p className="text-[11px] font-black">Arraste ou clique para enviar</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 font-bold">Suporta PNG, JPG (Máx. 5MB por foto)</p>
                        
                        <input
                          id="file-upload-input"
                          type="file"
                          accept="image/*"
                          multiple={2 - newItemPhotos.length > 1}
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewItemPhotos([]);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                  >
                    Mudar de Ideia
                  </button>
                  <button
                    id="submit-add-item-btn"
                    type="submit"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black rounded-xl text-xs font-bold transition-all"
                  >
                    Publicar Peça
                  </button>
                </div>
              </motion.form>
            )}

            {/* List and manage stock items */}
            <div className="space-y-2.5">
              {supplierCatalogItems.length === 0 ? (
                <div className="text-center py-12 bg-[#141414] border border-slate-800 rounded-xl space-y-2">
                  <span className="text-2xl">📦</span>
                  <p className="text-slate-400 text-xs">Ainda sem componentes inseridos para sua distribuidora.</p>
                  <p className="text-slate-500 text-[10px]">Utilize o botão acima para carregar o seu primeiro item de vitrine.</p>
                </div>
              ) : (
                supplierCatalogItems.map(item => (
                  <div key={item.id} className="p-3.5 bg-[#141414] border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-start space-x-3 truncate">
                      <span className="text-2xl p-2 bg-[#1C1C1C] rounded-lg shrink-0">{item.image}</span>
                      <div className="truncate">
                        <h4 className="font-extrabold text-white text-xs md:text-sm truncate leading-snug">{item.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate uppercase">SKU: {item.code} | Filtro: {item.compatibleWith}</p>
                        <span className="text-sm font-black text-orange-500 block mt-1">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        
                        {/* Display thumbnails of uploaded photos */}
                        {item.photos && item.photos.length > 0 && (
                          <div className="flex items-center space-x-1.5 mt-2.5">
                            <span className="text-[9px] text-slate-500 uppercase font-black mr-0.5">Fotos:</span>
                            {item.photos.map((photo, pIdx) => (
                              <div key={pIdx} className="w-9 h-9 rounded-lg border border-neutral-800 overflow-hidden shrink-0 bg-neutral-900">
                                <img 
                                  src={photo} 
                                  alt={`Miniature ${pIdx + 1}`} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      id={`delete-item-${item.id}`}
                      onClick={() => handleDeleteCatalogItem(item.id)}
                      className="p-3 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* Business Plan Tab */}
        {activeTab === 'plano' && (
          <div className="space-y-4 animate-fadeIn" id="supplier-plan-tab-view">
            <BusinessPlanView />
          </div>
        )}

        {/* Vendedores Tab (Only for Admin Suppliers) */}
        {activeTab === 'vendedores' && !isSeller && (
          <div className="space-y-6 animate-fadeIn" id="supplier-sellers-tab-view">
            
            <div className="bg-[#1E1E1E] border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-sm md:text-base text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#FF8C00]" />
                    <span>Equipe de Vendedores & Consultores</span>
                  </h3>
                  <p className="text-xs text-slate-450 mt-1">
                    Cadastre, monitore e gerencie vendedores autorizados a responder cotações em nome da sua empresa.
                  </p>
                </div>
                
                {/* Search field */}
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filtrar vendedor por nome ou email..."
                    value={sellerSearch}
                    onChange={(e) => setSellerSearch(e.target.value)}
                    className="w-full bg-[#141414] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#FF8C00] transition-colors"
                  />
                </div>
              </div>

              {/* Add Seller Form */}
              <form onSubmit={handleAddSeller} className="bg-[#141414] border border-neutral-850 p-4 rounded-xl space-y-4">
                <h4 className="text-[10px] font-black uppercase text-[#FF8C00] tracking-widest flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Novo Vendedor na Loja</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Lucas Santos"
                      value={newSellerName}
                      onChange={(e) => setNewSellerName(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF8C00] transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">E-mail de Login do Vendedor (Gmail)</label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: lucas.vendas@gmail.com"
                      value={newSellerEmail}
                      onChange={(e) => setNewSellerEmail(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF8C00] transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">WhatsApp do Vendedor</label>
                    <input
                      type="tel"
                      placeholder="Ex: (11) 98888-7777"
                      value={newSellerPhone}
                      onChange={(e) => setNewSellerPhone(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF8C00] transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="py-2 px-4 bg-[#FF8C00] hover:bg-[#E67E00] text-black font-black text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-black stroke-[3]" />
                    <span>Adicionar Vendedor</span>
                  </button>
                </div>
              </form>

              {/* Sellers list */}
              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-[#141414]">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead className="bg-[#1C1C1C] text-[10px] uppercase font-black tracking-wider text-slate-450 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Nome</th>
                      <th className="py-3 px-4">E-mail</th>
                      <th className="py-3 px-4">WhatsApp</th>
                      <th className="py-3 px-4">Data do Cadastro</th>
                      <th className="py-3 px-3 text-center">Status de Acesso</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {sellers
                      .filter(s => vendorSupplier && s.supplierId === vendorSupplier.id)
                      .filter(s => 
                        s.name.toLowerCase().includes(sellerSearch.toLowerCase()) || 
                        s.email.toLowerCase().includes(sellerSearch.toLowerCase())
                      )
                      .map(seller => (
                        <tr key={seller.id} className="hover:bg-[#1A1A1A] transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-400" />
                            <span>{seller.name}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">{seller.email}</td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono">{seller.phone || '-'}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {new Date(seller.registeredAt || '').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSellerAuth(seller.id, seller.isAuthorized)}
                              className={`px-2 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer border ${
                                seller.isAuthorized 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                              }`}
                            >
                              {seller.isAuthorized ? 'Autorizado & Ativo' : 'Acesso Suspenso'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteSeller(seller.id)}
                              className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Remover Consultor da Equipe"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {vendorSupplier && sellers.filter(s => s.supplierId === vendorSupplier.id).length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                          <Users className="w-5 h-5 mx-auto text-slate-700 mb-1.5" />
                          <span>Nenhum vendedor cadastrado ainda. Preencha o formulário acima para registrar sua equipe.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* Chats Inbox Tab */}
        {activeTab === 'chats' && (
          <div className="h-[65vh] flex bg-[#141414] border border-slate-800 rounded-2xl overflow-hidden" id="supplier-chats-view">
            
            {/* Chats list sidebar */}
            <div className={`w-full md:w-80 border-r border-slate-800 flex flex-col overflow-hidden ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-slate-800 bg-[#1C1C1C] shrink-0">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Caixa de Mensagens Ativas</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[#121212]">
                {chats.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChatId(c.id)}
                    className={`w-full p-3 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                      activeChatId === c.id ? 'bg-orange-500/10 border border-orange-500/30' : 'hover:bg-[#1C1C1C] border border-transparent'
                    }`}
                  >
                    <div className="truncate space-y-0.5">
                      <h4 className="font-bold text-white text-xs md:text-sm truncate leading-none">{c.supplierName} (Cliente)</h4>
                      <p className="text-[11px] text-slate-500 truncate">{c.lastMessage}</p>
                    </div>
                    <span className="text-[9px] text-slate-500 shrink-0 font-medium font-mono">{c.timestamp}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chats conversation thread panel */}
            <div className={`flex-1 flex flex-col overflow-hidden ${!activeChatId ? 'hidden md:flex items-center justify-center text-center p-6 bg-[#0E0E0E]' : 'flex bg-[#0E0E0E]'}`}>
              {!activeChatId ? (
                <div className="space-y-2 max-w-sm">
                  <span className="text-3xl block">💬</span>
                  <h4 className="font-bold text-white text-sm uppercase">Nenhuma Conversa Selecionada</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Selecione uma das carreatas ativas na barra lateral para começar a enviar orçamentos.</p>
                </div>
              ) : (
                activeChat && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Chat header */}
                    <div className="p-3.5 bg-[#1C1C1C] border-b border-slate-800 flex items-center justify-between shrink-0">
                      <button 
                        onClick={() => setActiveChatId(null)} 
                        className="py-1 px-2.5 bg-slate-800 rounded-lg text-xs font-bold text-slate-300 md:hidden shrink-0"
                      >
                        Lista
                      </button>
                      <div className="truncate text-center md:text-left px-3">
                        <h4 className="font-extrabold text-white text-xs md:text-sm truncate">{activeChat.supplierName}</h4>
                        <span className="text-[10px] text-slate-500 leading-none">Negociando Peças e Preços</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Chat ID: {activeChat.id.split('_')[1]}</span>
                    </div>

                    {/* Messages Flow */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3" id="supplier-message-stream">
                      {activeChat.messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col max-w-[80%] ${msg.sender === 'supplier' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                          <div
                            className={`p-3 rounded-xl text-xs sm:text-sm font-medium leading-relaxed ${
                              msg.sender === 'supplier'
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

                    {/* Automated Playbook script selector shortcuts */}
                    <div className="px-3 py-2 bg-[#171717] border-t border-slate-850 flex gap-2 overflow-x-auto select-none no-scrollbar shrink-0">
                      <span className="text-[9px] font-black uppercase text-orange-400 shrink-0 self-center tracking-widest mr-1">Roteiros:</span>
                      {[
                        'Opa amigo bão? Temos em estoque sim!',
                        'Consigo gerar um cupom especial de 10% de desconto à vista.',
                        'Se fecharmos agora, já despacho por motoboy na beira pista!',
                        'Para garantir da série certa, me envia a foto do motor chassi.'
                      ].map((text, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => applyPlaybookScript(text)}
                          className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg text-[10px] text-slate-300 whitespace-nowrap cursor-pointer border border-slate-850 shrink-0"
                        >
                          {text}
                        </button>
                      ))}
                    </div>

                    {/* typing actions input */}
                    <form onSubmit={handleSendSupplierMessage} className="p-3 bg-[#1C1C1C] border-t border-slate-800 flex items-center space-x-2 shrink-0">
                      <input
                        id="supplier-chat-input"
                        type="text"
                        placeholder="Escreva uma mensagem ou clique em um roteiro..."
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                        className="flex-1 bg-[#121212] border border-slate-800 focus:border-orange-500 transition-colors rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none text-white font-medium"
                      />
                      <button
                        id="send-supplier-chat-btn"
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

          </div>
        )}

      </main>
    </div>
  );
}
