/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Send, Gavel, Calendar, MessageSquare, ShieldCheck, 
  Clock, Truck, DollarSign, Sparkles, Check, AlertCircle, AlertTriangle 
} from 'lucide-react';
import { Supplier, CatalogItem, Chat, Message } from '../types';
import { saveChats } from '../mockData';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  initialMessage?: string;
  truckModel?: string;
}

export default function ChatModal({
  isOpen,
  onClose,
  supplier,
  chats,
  setChats,
  initialMessage = '',
  truckModel = 'Volvo FH 540'
}: ChatModalProps) {
  const [typedMessage, setTypedMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'conversa' | 'oferta' | 'agendamento'>('conversa');
  
  // Negotiation form state
  const [offerPrice, setOfferPrice] = useState('');
  const [offerItem, setOfferItem] = useState('');
  
  // Service scheduling form state
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleService, setScheduleService] = useState('Revisão Geral e Suspensão');

  const streamEndRef = useRef<HTMLDivElement>(null);

  // Find or create current chat for this supplier
  const currentChat = supplier ? chats.find(c => c.supplierId === supplier.id) : null;

  // Auto scroll to bottom
  useEffect(() => {
    if (streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChat?.messages?.length, isOpen, activeTab]);

  // Set initial offer item if initial message relates to a product
  useEffect(() => {
    if (initialMessage && initialMessage.includes('Kit') || initialMessage.includes('Pneu') || initialMessage.includes('Turbina')) {
      setOfferItem(initialMessage);
      setTypedMessage(`Olá! Gostaria de consultar e fechar este item: ${initialMessage}`);
    } else if (initialMessage) {
      setTypedMessage(initialMessage);
    }
  }, [initialMessage, supplier?.id]);

  if (!isOpen || !supplier) return null;

  // Sync / create chat in db
  const getOrCreateChat = (): Chat => {
    const existing = chats.find(c => c.supplierId === supplier.id);
    if (existing) return existing;

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
          text: `Olá, parceiro! Sou o consultor de vendas da ${supplier.name}. Como posso te ajudar na BR-116 hoje?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    const updated = [newChat, ...chats];
    setChats(updated);
    saveChats(updated);
    return newChat;
  };

  const handleSendMessage = (textToSend: string, extraOptions?: Partial<Message>) => {
    if (!textToSend.trim()) return;

    const chatObj = getOrCreateChat();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Check if the chat index exists in our states
    const chatIndex = chats.findIndex(c => c.id === chatObj.id);
    const actualChat = chatIndex !== -1 ? chats[chatIndex] : chatObj;

    const newMsg: Message = {
      id: `m_user_${Date.now()}`,
      sender: 'trucker',
      text: textToSend,
      timestamp: timeStr,
      ...extraOptions
    };

    const updatedMessages = [...actualChat.messages, newMsg];
    const updatedChat: Chat = {
      ...actualChat,
      messages: updatedMessages,
      lastMessage: textToSend,
      timestamp: timeStr,
    };

    const finalChats = [...chats];
    if (chatIndex !== -1) {
      finalChats[chatIndex] = updatedChat;
    } else {
      finalChats.unshift(updatedChat);
    }

    setChats(finalChats);
    saveChats(finalChats);
    setTypedMessage('');

    // Trigger funny and highly interactive automatic response
    setTimeout(() => {
      let automatedText = '';
      if (extraOptions?.isOffer) {
        const discountedPrice = (extraOptions.offerPrice || 0) * 1.05; // Counter offer
        automatedText = `Opa bão! Recebi a sua proposta de R$ ${extraOptions.offerPrice?.toLocaleString('pt-BR')} pelo ${extraOptions.offerItem || 'item'}. Consigo fechar em R$ ${Math.round(discountedPrice).toLocaleString('pt-BR')} pra fechar negócio agora com entrega agilizada no KM da estrada. O que acha?`;
      } else if (extraOptions?.text?.includes('agendamento') || extraOptions?.text?.includes('agendar')) {
        automatedText = `Excelente! Vi aqui sua solicitação para o dia ${scheduleDate} às ${scheduleTime} para o serviço de ${scheduleService}. Slot pré-reservado com sucesso pro seu ${truckModel}! Leva as pastilhas ou fazemos tudo aqui na rodovia bão?`;
      } else {
        automatedText = `Entendido perfeito, meu amigo! Já verifiquei com nossos especialistas de pátio na ${supplier.name}. Temos tudo a pronta entrega aqui para o seu ${truckModel}. Quer vir retirar ou quer que enviamos o guincho de socorro para o seu trecho?`;
      }

      const responseMsg: Message = {
        id: `m_supp_${Date.now()}`,
        sender: 'supplier',
        text: automatedText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Re-read latest chat array state to prevent race conditions
      setChats(prevChats => {
        const idx = prevChats.findIndex(c => c.id === chatObj.id);
        if (idx === -1) return prevChats;
        const currentMsgList = prevChats[idx].messages;
        
        // Prevent duplicate automatic responses by comparing text
        if (currentMsgList.some(m => m.text === automatedText && m.sender === 'supplier')) {
          return prevChats;
        }

        const newestChat = {
          ...prevChats[idx],
          messages: [...currentMsgList, responseMsg],
          lastMessage: automatedText,
          timestamp: responseMsg.timestamp,
        };

        const nextChats = [...prevChats];
        nextChats[idx] = newestChat;
        saveChats(nextChats);
        return nextChats;
      });

    }, 2000);
  };

  const submitTextChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    handleSendMessage(typedMessage);
  };

  const submitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(offerPrice);
    if (!offerItem.trim() || isNaN(price)) return;

    const offerText = `💸 [PROPOSTA COMERCIAL] Ofereço R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para fecharmos o item: "${offerItem}" hoje mesmo!`;
    handleSendMessage(offerText, {
      isOffer: true,
      offerPrice: price,
      offerItem: offerItem
    });

    setOfferPrice('');
    setOfferItem('');
    setActiveTab('conversa');
  };

  const submitSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDate || !scheduleTime) return;

    const formattedDate = scheduleDate.split('-').reverse().join('/');
    const scheduleText = `📅 [AGENDAMENTO DE SERVIÇO] Solicito agendamento de "${scheduleService}" para o dia ${formattedDate} às ${scheduleTime}. Veículo: ${truckModel}.`;
    
    handleSendMessage(scheduleText, {
      // Custom flags injected for rich render layouts
      text: scheduleText
    });

    setActiveTab('conversa');
  };

  const activeChatData = currentChat || getOrCreateChat();

  return (
    <div id="trucker-direct-chat-modal" className="fixed inset-0 bg-black/85 z-[150] flex items-center justify-center p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-[#141414] border border-orange-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[85vh] max-h-[720px]"
      >
        {/* Header section with supplier details */}
        <div className="p-4 bg-[#1C1C1C] border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 truncate">
            <div className="relative">
              <span className="text-2xl p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl block">
                {supplier.category === 'pecas' ? '⚙️' : supplier.category === 'mecanica' ? '🔧' : supplier.category === 'postos' ? '⛽' : supplier.category === 'pneus' ? '🛞' : '🚨'}
              </span>
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#141414] ${supplier.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                <h3 className="font-black text-white text-sm md:text-base leading-tight truncate">{supplier.name}</h3>
                {supplier.isVerified && (
                  <span className="bg-[#FF8C00]/10 border border-[#FF8C00]/30 text-[#FF8C00] font-black text-[8px] uppercase tracking-wider px-1 rounded">VIP</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{supplier.specialty} • KM {supplier.distance}</p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="p-1 px-2.5 bg-neutral-800 hover:bg-neutral-700 hover:text-[#FF8C00] rounded-xl text-slate-400 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Fechar</span>
          </button>
        </div>

        {/* Tactical Interaction Tab selections */}
        <div className="flex bg-[#181818] p-1 border-b border-neutral-800 shrink-0">
          {[
            { id: 'conversa', label: 'Conversa', icon: <MessageSquare className="w-3.5 h-3.5" /> },
            { id: 'oferta', label: 'Proposta / Preço', icon: <Gavel className="w-3.5 h-3.5" /> },
            { id: 'agendamento', label: 'Agendar Oficina', icon: <Calendar className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#FF8C00]/10 text-[#FF8C00] border border-[#FF8C00]/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main interactive tabs content view */}
        <div className="flex-1 overflow-hidden relative bg-[#0D0D0D]">
          
          {/* TAB 1: Conversa Stream */}
          {activeTab === 'conversa' && (
            <div className="h-full flex flex-col justify-between">
              {/* Message Feed list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" id="direct-modal-stream-list">
                {activeChatData.messages.map((msg, i) => {
                  const isTrucker = msg.sender === 'trucker';
                  const isOfferMsg = msg.text.includes('[PROPOSTA');
                  const isScheduleMsg = msg.text.includes('[AGENDAMENTO');

                  return (
                    <div
                      key={msg.id || i}
                      className={`flex flex-col max-w-[85%] ${isTrucker ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      {isOfferMsg ? (
                        /* Beautiful structured custom Offer Message block */
                        <div className="bg-[#1C160E] border-2 border-[#FF8C00]/40 p-3.5 rounded-xl text-left space-y-2 font-sans relative">
                          <div className="flex items-center space-x-1 text-orange-400 font-extrabold text-[10px] uppercase tracking-widest">
                            <Gavel className="w-3.5 h-3.5 animate-pulse" />
                            <span>Proposta de Desconto Império</span>
                          </div>
                          <p className="text-xs text-white leading-relaxed">{msg.text}</p>
                          <div className="bg-[#2C1F10] p-2 rounded border border-[#FF8C00]/20 flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-semibold font-mono">Oferta do Motorista</span>
                            <span className="text-amber-400 font-black">R$ {msg.offerPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                            <span className="flex items-center gap-1 text-emerald-500 font-extrabold">
                              <ShieldCheck className="w-3.5 h-3.5" /> Negociação Segura
                            </span>
                          </div>
                        </div>
                      ) : isScheduleMsg ? (
                        /* Beautiful structured custom Scheduling Request block */
                        <div className="bg-[#0E1520] border-2 border-sky-500/40 p-3.5 rounded-xl text-left space-y-2 font-sans relative">
                          <div className="flex items-center space-x-1 text-sky-400 font-extrabold text-[10px] uppercase tracking-widest">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Agendamento de Serviço</span>
                          </div>
                          <p className="text-xs text-white leading-relaxed">{msg.text}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md self-start font-black">
                            <Check className="w-3 h-3 stroke-[2.5]" /> CONFIRMADO EM PATIO
                          </div>
                        </div>
                      ) : (
                        /* Default clean message bubble */
                        <div
                          className={`p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed ${
                            isTrucker
                              ? 'bg-[#FF8C00] text-black rounded-tr-none'
                              : 'bg-[#1E1E1E] text-slate-100 border border-neutral-800 rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      )}
                      
                      <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">{msg.timestamp}</span>
                    </div>
                  );
                })}
                <div ref={streamEndRef} />
              </div>

              {/* Fast responses snippet belt */}
              <div className="px-3 py-1.5 bg-[#141414] border-t border-neutral-900 flex gap-2 overflow-x-auto select-none no-scrollbar shrink-0">
                <span className="text-[9px] font-black uppercase text-[#FF8C00] shrink-0 self-center tracking-widest">Respostas:</span>
                {[
                  'Consegue fechar agora?',
                  'Onde fica para eu retirar?',
                  'Consigo parcelar na maquininha?',
                  'Tenho urgência no resgate!'
                ].map((text, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTypedMessage(text)}
                    className="py-1 px-2 bg-neutral-800 hover:bg-neutral-700 text-[10px] text-slate-300 rounded border border-neutral-850 hover:text-[#FF8C00] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {text}
                  </button>
                ))}
              </div>

              {/* Message Typing Inputs footer */}
              <form onSubmit={submitTextChat} className="p-3 bg-[#1C1C1C] border-t border-neutral-800 flex items-center space-x-2 shrink-0">
                <input
                  id="direct-modal-input"
                  type="text"
                  placeholder="Mande sua mensagem ou orce serviços..."
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  className="flex-1 bg-[#121212] border border-neutral-800 focus:border-[#FF8C00] transition-all rounded-xl px-4 py-3 text-xs md:text-sm text-white focus:outline-none"
                />
                
                <button
                  id="direct-modal-send-btn"
                  type="submit"
                  disabled={!typedMessage.trim()}
                  className="p-3 bg-[#FF8C00] hover:bg-[#E67E00] disabled:bg-neutral-800 disabled:text-slate-600 transition-all rounded-xl text-black cursor-pointer shadow-lg shadow-[#FF8C00]/10"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Gavel / Proposta de Preço */}
          {activeTab === 'oferta' && (
            <motion.form 
              onSubmit={submitOffer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-5 space-y-4 h-full flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-4">
                <div className="bg-[#1C160E] border border-orange-500/20 p-4 rounded-xl text-left space-y-1">
                  <span className="text-[10px] text-[#FF8C00] font-black uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> NEGOCIE ATÉ TER O SIM!
                  </span>
                  <h4 className="text-white text-xs md:text-sm font-black">Proposta Direta - B2C Inteligente</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Preencha o item desejado e envie seu lance ideal. O atendimento online da {supplier.name} irá analisar e responder em menos de 2 minutos com aceitação ou contraproposta!
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Qual é a peça ou serviço?</label>
                    <input 
                      id="offer-item-input"
                      type="text"
                      placeholder="Ex: Pneu Bridgestone M712 / Alternador Volvo FH"
                      required
                      value={offerItem}
                      onChange={(e) => setOfferItem(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#FF8C00]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Seu lance ideal (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-slate-500 font-black text-xs">R$</span>
                      <input 
                        id="offer-price-input"
                        type="number"
                        placeholder="Ex: 2100"
                        required
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#FF8C00]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-900 flex gap-2 w-full">
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#FF8C00] to-amber-500 hover:from-amber-500 hover:to-orange-500 transition-all font-black text-xs uppercase tracking-wider text-black rounded-xl text-center flex items-center justify-center space-x-1.5 shadow-lg shadow-orange-500/10 cursor-pointer"
                >
                  <Gavel className="w-4 h-4 stroke-[2.5]" />
                  <span>Enviar Lance Oficial</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setActiveTab('conversa')}
                  className="py-3.5 px-4 bg-neutral-900 hover:bg-[#202020] border border-neutral-800 text-slate-400 text-xs font-black rounded-xl transition-all"
                >
                  Voltar
                </button>
              </div>
            </motion.form>
          )}

          {/* TAB 3: Calendário / Agendamento */}
          {activeTab === 'agendamento' && (
            <motion.form
              onSubmit={submitSchedule}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-5 space-y-4 h-full flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-4">
                <div className="bg-[#0E1520] border border-sky-500/20 p-4 rounded-xl text-left space-y-1">
                  <span className="text-[10px] text-sky-400 font-black uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> AGENDAMENTO EXPRESSO DE PÁTIO
                  </span>
                  <h4 className="text-white text-xs md:text-sm font-black">Reserve seu Horário na Estrada</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Evite filas e atrasos na entrega da sua carga! Agende revisões, troca de óleo ou instalação de pneus no pátio físico do fornecedor diretamente pelo app.
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Serviço Pretendido</label>
                    <select
                      value={scheduleService}
                      onChange={(e) => setScheduleService(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-[#FF8C00] outline-none"
                    >
                      <option value="Revisão Geral e Suspensão">🔧 Revisão Geral e Suspensão</option>
                      <option value="Troca Elétrica / Bateria 24h">⚡ Troca Elétrica, Lanternagem ou Baterias</option>
                      <option value="Troca de Óleo Lubrificante">⛽ Troca de Óleo Rimula & Alinhamento</option>
                      <option value="Instalação, Balanceamento e Pneus">🛞 Troca de Pneu Michelins ou Recauchutagem</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Data</label>
                      <input 
                        id="schedule-date-input"
                        type="date"
                        required
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#FF8C00]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Hora Estimada</label>
                      <select
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-[#FF8C00] outline-none"
                      >
                        <option value="06:00">06:00 (Madrugada)</option>
                        <option value="08:00">08:00</option>
                        <option value="10:00">10:00</option>
                        <option value="12:00">12:00 (Almoço)</option>
                        <option value="14:00">14:00</option>
                        <option value="16:00">16:00</option>
                        <option value="18:00">18:00</option>
                        <option value="20:00">20:00</option>
                        <option value="22:00">22:00 (Plantão Rodoviário)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-900 flex gap-2 w-full">
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-[#4F46E5] hover:bg-[#4338CA] transition-all font-black text-xs uppercase tracking-wider text-white rounded-xl text-center flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Confirmar Agendamento</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setActiveTab('conversa')}
                  className="py-3.5 px-4 bg-neutral-900 hover:bg-[#202020] border border-neutral-800 text-slate-400 text-xs font-black rounded-xl transition-all"
                >
                  Voltar
                </button>
              </div>
            </motion.form>
          )}

        </div>
      </motion.div>
    </div>
  );
}
