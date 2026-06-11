/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Navigation, Clock, MessageSquare, Phone, Send, X, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { Supplier } from '../types';

interface SOSModalProps {
  onClose: () => void;
  suppliers: Supplier[];
  truckerName: string;
  truckModel: string;
}

export default function SOSModal({ onClose, suppliers, truckerName, truckModel }: SOSModalProps) {
  const [stage, setStage] = useState<'select' | 'scanning' | 'connected'>('select');
  const [selectedEmergency, setSelectedEmergency] = useState<string>('');
  const [matchedSupplier, setMatchedSupplier] = useState<Supplier | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'supplier'; text: string; time: string }>>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [eta, setEta] = useState(15);

  const emergencyTypes = [
    { title: 'Pneu Estourado', icon: '🛞', desc: 'Precisa de borracharia ou recapagem urgente.' },
    { title: 'Pane Mecânica / Motor', icon: '🔧', desc: 'Aquecimento, motor rateando ou vazamento.' },
    { title: 'Pane Elétrica / Bateria', icon: '⚡', desc: 'Alternador com defeito, faróis ou cabo.' },
    { title: 'Problema nos Freios', icon: '🛑', desc: 'Perda de pressão, vazamento de compressor.' },
    { title: 'Necessito de Guincho', icon: '🚛', desc: 'Urgência extrema para reboque pesado.' }
  ];

  const handleSelectEmergency = (title: string) => {
    setSelectedEmergency(title);
    setStage('scanning');
  };

  useEffect(() => {
    if (stage !== 'scanning') return;

    // Simulate Scanning loop for 3.5 seconds
    const timer = setTimeout(() => {
      // Find suitable supplier from list based on selected breakdown
      let provider: Supplier | undefined;
      
      if (selectedEmergency.includes('Pneu')) {
        provider = suppliers.find(s => s.category === 'pneus');
      } else if (selectedEmergency.includes('Mecânica') || selectedEmergency.includes('Freios')) {
        provider = suppliers.find(s => s.category === 'mecanica');
      } else if (selectedEmergency.includes('Elétrica')) {
        provider = suppliers.find(s => s.category === 'socorro');
      } else {
        provider = suppliers.find(s => s.isOnline);
      }

      // Default to any online shop
      if (!provider) {
        provider = suppliers[0];
      }

      setMatchedSupplier(provider);
      setEta(Math.floor(Math.random() * 15) + 12); // random eta between 12-27 mins
      setStage('connected');

      // Add conversational ice-breaker messages
      setChatMessages([
        {
          sender: 'supplier',
          text: `🚨 [ALERTA DE EMERGÊNCIA ACEITO] Olá ${truckerName}! Meu nome é Rodrigo, despachante da ${provider.name}. Recebemos seu pedido de SOS pelo Império.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          sender: 'supplier',
          text: `Já identificamos que você está com o veículo / equipamento cadastrado com sinistro de [${selectedEmergency}]. O profissional de plantão já foi acionado e está se deslocando. Aguarde em um local seguro!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 4000);

    return () => clearTimeout(timer);
  }, [stage]);

  // Simulate response message after driver sends something
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !matchedSupplier) return;

    const userMsg = typedMessage;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: timeNow }]);
    setTypedMessage('');

    // Trigger auto supplier response in 2.5 seconds
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'supplier',
          text: `Perfeito, parceiro! Já repassei essa resposta para o nosso socorrista na viatura. Ele está a todo vapor em direção à sua rota. Mantenha os faróis de pisca-alerta ligados!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 2500);
  };

  return (
    <div id="sos-modal-outer" className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-md selection:bg-[#FF8C00] selection:text-black font-sans">
      <div className="relative w-full max-w-lg bg-[#121212] border border-red-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-red-950/20 flex flex-col max-h-[90vh]">
        
        {/* Banner with warning */}
        <div className="bg-gradient-to-r from-red-600 to-amber-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <div>
              <h2 className="font-black text-base uppercase tracking-wider">Radar de Emergência SOS</h2>
              <p className="text-[10px] text-white/80">Envio de coordenada imediata num raio de até 50km</p>
            </div>
          </div>
          <button id="close-sos-btn" onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {stage === 'select' && (
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="text-center">
              <span className="text-4xl text-red-500">🆘</span>
              <h3 className="text-lg font-black text-white mt-2">Dificuldades na Estrada?</h3>
              <p className="text-slate-400 text-xs mt-1">O primeiro atendimento qualificado nas rodovias em apenas 1 toque.</p>
            </div>

            <div className="space-y-3" id="sos-selections-list">
              {emergencyTypes.map((item, i) => (
                <button
                  key={i}
                  id={`sos-type-${i}`}
                  onClick={() => handleSelectEmergency(item.title)}
                  className="w-full flex items-center p-3.5 bg-[#1E1E1E] border border-neutral-800 hover:border-[#FF8C00]/40 hover:bg-[#FF8C00]/5 rounded-xl text-left transition-all group cursor-pointer"
                >
                  <span className="text-2xl mr-4 bg-[#141414] p-2 rounded-xl group-hover:bg-[#FF8C00]/10 transition-colors">{item.icon}</span>
                  <div className="flex-1">
                    <span className="font-extrabold text-slate-100 group-hover:text-[#FF8C00] transition-colors text-sm md:text-base">{item.title}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <Navigation className="w-5 h-5 text-slate-500 group-hover:text-[#FF8C00] group-hover:translate-x-1 transition-all stroke-[2]" />
                </button>
              ))}
            </div>

            <p className="text-[10px] text-center text-slate-500 leading-relaxed">
              *Ao pressionar o botão, o aplicativo transmite seu nome, telefone, modelo do caminhão e localização GPS para as oficinas credenciadas próximas.
            </p>
          </div>
        )}

        {stage === 'scanning' && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
            {/* Rotating Radar Rings */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-red-500/10 animate-ping" />
              <div className="absolute inset-4 rounded-full border border-red-500/20" />
              <div className="absolute inset-8 rounded-full border-2 border-dashed border-orange-500/30 animate-spin" style={{ animationDuration: '8s' }} />
              <div className="absolute inset-12 rounded-full border border-red-500/40" />
              <div className="absolute inset-16 rounded-full bg-red-600/10 border border-red-500/80 animate-pulse flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-orange-500 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider animate-pulse">Rastreando Oficinas Credenciadas</h3>
              <p className="text-slate-400 text-xs">Avisando borracharias, guinchos e eletricistas em um raio de 50km...</p>
              <div className="flex justify-center space-x-1 mt-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>

            <div className="w-full max-w-xs bg-[#1E1E1E] border border-neutral-800 rounded-xl p-3.5 text-left">
              <div className="flex items-center space-x-2 text-xs text-[#FF8C00] font-black">
                <MapPin className="w-4 h-4 shrink-0 font-bold" />
                <span>Enviando GPS Ativo: BR-116, São Paulo</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Caminhão: {truckModel}</p>
            </div>
          </div>
        )}

        {stage === 'connected' && matchedSupplier && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Match Information Bar */}
            <div className="bg-[#1E1E1E] border-b border-neutral-800 p-4 shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse border border-black" />
                    <span className="text-xs uppercase font-extrabold tracking-wider text-green-500">Socorrista Vinculado</span>
                  </div>
                  <h4 className="text-base font-black text-white mt-1 text-[#FF8C00]">{matchedSupplier.name}</h4>
                  <p className="text-xs text-slate-400 font-medium flex items-center mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#FF8C00] mr-1 shrink-0" />
                    <span>{matchedSupplier.address}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl inline-block text-center">
                    <div className="flex items-center space-x-1.5 text-red-400 font-black text-sm">
                      <Clock className="w-4 h-4 text-red-500 shrink-0" />
                      <span>~{eta} Min</span>
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-0.5 uppercase tracking-tight">Tempo Estimado</span>
                  </div>
                </div>
              </div>

              {/* Direct Supplier Call Icon */}
              <div className="flex space-x-2 mt-3">
                <a
                  href={`tel:${matchedSupplier.contactPhone}`}
                  className="flex-1 bg-[#FF8C00] hover:bg-[#E67E00] transition-colors text-black font-black text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1"
                >
                  <Phone className="w-3.5 h-3.5 fill-black border-none" />
                  <span>Telefonar Direto</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setChatMessages(prev => [
                      ...prev,
                      {
                        sender: 'supplier',
                        text: `🟢 [CONTATO DIRETO] O WhatsApp oficial da oficina é ${matchedSupplier.contactPhone}. Você também pode entrar em contato por áudio ou vídeo ligando para este número.`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                  }}
                  className="bg-[#25D366] hover:bg-[#20ba56] transition-colors text-white font-black text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Simulated Live Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#121212]" id="sos-chat-stream">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                >
                  <div
                    className={`p-3 rounded-xl text-xs md:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#FF8C00] text-black font-black rounded-tr-none shadow-lg shadow-[#FF8C00]/10'
                        : 'bg-[#1E1E1E] text-slate-100 border border-neutral-800 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Messaging Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#1A1A1A] border-t border-neutral-800 flex items-center space-x-2 shrink-0">
              <input
                id="sos-chat-input"
                type="text"
                placeholder="Digite para falar com o socorrista..."
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                className="flex-1 bg-[#121212] border border-neutral-800 focus:border-[#FF8C00]/60 transition-colors rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none text-white font-medium"
              />
              <button
                id="send-sos-chat-btn"
                type="submit"
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all hover:scale-105 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
