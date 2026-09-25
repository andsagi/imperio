/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, Share2, DollarSign, Check, Copy, MessageCircle, Send, 
  Crown, Sparkles, TrendingUp, ShieldCheck, QrCode, ExternalLink,
  Truck, Car, Bike, Store, Zap, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareAndMonetizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'share' | 'monetize';
  niche?: 'pesados' | 'passeio' | 'motos' | null;
}

export default function ShareAndMonetizeModal({
  isOpen,
  onClose,
  defaultTab = 'share',
  niche
}: ShareAndMonetizeModalProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'monetize'>(defaultTab);
  const [copied, setCopied] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<'caminhoneiros' | 'passeio' | 'motos' | 'fornecedores'>('caminhoneiros');
  const [selectedPlan, setSelectedPlan] = useState<'prata' | 'ouro' | 'banner'>('ouro');
  const [showQrCode, setShowQrCode] = useState(false);

  if (!isOpen) return null;

  const appUrl = 'https://imperiopecas.com.br';
  const shareRefUrl = `${appUrl}/?ref=divulgacao_vip`;

  const targetMessages = {
    caminhoneiros: {
      title: 'Grupos de Caminhoneiros & Linha Pesada',
      icon: <Truck className="w-4 h-4 text-amber-500" />,
      text: `🚨 *IMPÉRIO PESADOS - PEÇAS E SOS 24H NA RODOVIA* 🚚💨\n\nIrmãos do trecho, quebrou o bruto ou tá precisando de peça urgente na rodovia? O Império conecta você direto com autopeças de diesel, guinchos pesados e socorro mecânico 24h sem intermediários nem comissão!\n\n👉 Acesse grátis agora no seu celular:\n${shareRefUrl}\n\nSalve nos seus favoritos para não ficar na mão na estrada! 🛣️`
    },
    passeio: {
      title: 'Grupos de Motoristas de App e Carros',
      icon: <Car className="w-4 h-4 text-emerald-500" />,
      text: `🚗 *IMPÉRIO - AUTOPEÇAS E MECÂNICA RÁPIDA* ⚡\n\nPrecisando de pastilhas, suspensão, bateria ou socorro mecânico para o seu carro? Compare preços direto com autopeças e oficinas credenciadas na sua região sem pagar taxas extras!\n\n👉 Confira e use grátis:\n${shareRefUrl}`
    },
    motos: {
      title: 'Grupos de Motoboys e Pilotos',
      icon: <Bike className="w-4 h-4 text-rose-500" />,
      text: `🏍️ *IMPÉRIO MOTOS - PEÇAS E SOCORRO 24H* 🛵💨\n\nFurou o pneu ou arrebentou a relação no meio do corre? Encontre motopeças e oficinas com entrega rápida e atendimento via WhatsApp na hora!\n\n👉 Acesse agora gratuitamente:\n${shareRefUrl}`
    },
    fornecedores: {
      title: 'Lojas de Autopeças e Mecânicas',
      icon: <Store className="w-4 h-4 text-cyan-500" />,
      text: `🏪 *IMPÉRIO - CADASTRE SUA AUTOPEÇA E VENDA MAIS* 📈\n\nReceba solicitações diárias de cotação de motoristas e frotistas da sua cidade diretamente no WhatsApp da sua loja. Zero comissão por venda!\n\n👉 Cadastre sua empresa e receba clientes hoje:\n${shareRefUrl}`
    }
  };

  const handleCopyLink = () => {
    const textToCopy = targetMessages[selectedTarget].text;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(targetMessages[selectedTarget].text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Império - Autopeças, Serviços e SOS 24h',
          text: targetMessages[selectedTarget].text,
          url: shareRefUrl,
        });
      } catch (err) {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const plans = [
    {
      id: 'prata',
      name: 'Anunciante Prata',
      badge: 'POPULAR',
      price: 'R$ 199',
      period: '/mês',
      description: 'Ideal para lojas de autopeças e oficinas mecânicas de bairro.',
      features: [
        'Destaque regional nas buscas da sua cidade',
        'Até 50 peças cadastradas na vitrine',
        'Botão direto para o WhatsApp dos seus vendedores',
        'Presença no mapa de socorro mecânico',
        'Selo Prata de Fornecedor Verificado'
      ],
      ctaText: 'Contratar Plano Prata',
      highlight: false
    },
    {
      id: 'ouro',
      name: 'Anunciante Ouro VIP',
      badge: 'MÁXIMA CONVERSÃO',
      price: 'R$ 349',
      period: '/mês',
      description: 'Topo absoluto do mapa, chamados prioritários de SOS e catálogo ilimitado.',
      features: [
        '1º Lugar no ranking de busca da categoria',
        'Notificação prioritária em acionamentos SOS 24h',
        'Catálogo ilimitado de peças e serviços',
        'Selo Ouro VIP de Confiança e Destaque',
        'Múltiplos vendedores atendendo simultaneamente',
        'Suporte técnico e comercial prioritário'
      ],
      ctaText: 'Contratar Plano Ouro VIP',
      highlight: true
    },
    {
      id: 'banner',
      name: 'Banner Patrocinado',
      badge: 'ALTO IMPACTO',
      price: 'R$ 499',
      period: '/mês',
      description: 'Para fabricantes de baterias, filtros, lubrificantes, pneus e seguradoras.',
      features: [
        'Banner no topo do app para milhares de motoristas',
        'Link direto para o seu site ou catálogo oficial',
        'Segmentação por nicho (Pesados, Carros ou Motos)',
        'Relatório mensal de impressões e cliques (CTR)',
        'Exclusividade de marca na categoria'
      ],
      ctaText: 'Anunciar Banner de Topo',
      highlight: false
    }
  ];

  const handleHirePlan = (planName: string, price: string) => {
    const text = encodeURIComponent(
      `Olá! Tenho interesse em contratar o *${planName} (${price})* na plataforma Império para divulgar minha empresa de autopeças/serviços mecânicos. Como podemos ativar meu plano com PIX?`
    );
    window.open(`https://wa.me/5511999999999?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#181818] border border-neutral-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Header */}
        <div className="bg-[#121212] p-4 border-b border-neutral-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black font-black shadow-lg">
              {activeTab === 'share' ? <Share2 className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-white">
                {activeTab === 'share' ? 'Divulgação & Crescimento Viral' : 'Monetização & Planos de Anúncio'}
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">
                {activeTab === 'share' 
                  ? 'Compartilhe com 1 clique e expanda sua rede em grupos' 
                  : 'Multiplique o faturamento da sua autopeça ou oficina'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle Bar */}
        <div className="bg-[#151515] p-2 border-b border-neutral-850 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'share'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-neutral-800/60 text-slate-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Divulgar nos Grupos</span>
          </button>

          <button
            onClick={() => setActiveTab('monetize')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'monetize'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'bg-neutral-800/60 text-slate-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Planos & Monetização</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-neutral-700">
          {activeTab === 'share' ? (
            <div className="space-y-5">
              {/* Audience Target Picker */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  1. Escolha o público do seu grupo:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['caminhoneiros', 'passeio', 'motos', 'fornecedores'] as const).map((key) => {
                    const info = targetMessages[key];
                    const isSelected = selectedTarget === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedTarget(key)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                            : 'bg-[#1C1C1C] border-neutral-800 text-slate-400 hover:border-neutral-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {info.icon}
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <span className="text-[11px] font-bold leading-tight">
                          {key === 'caminhoneiros' ? 'Caminhões' : key === 'passeio' ? 'Carros / App' : key === 'motos' ? 'Motoboys' : 'Lojas & Oficinas'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Preview Box */}
              <div className="bg-[#121212] border border-neutral-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Mensagem Otimizada de Alta Conversão
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Pronta para WhatsApp</span>
                </div>
                <div className="bg-[#1A1A1A] p-3 rounded-lg border border-neutral-850 text-xs text-slate-300 font-sans whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                  {targetMessages[selectedTarget].text}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleWhatsAppShare}
                    className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Compartilhar no WhatsApp</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="py-3 px-4 bg-neutral-100 hover:bg-white text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Copiado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Mensagem & Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={handleNativeShare}
                    className="flex-1 py-2 px-3 bg-[#1C1C1C] hover:bg-neutral-800 border border-neutral-800 text-slate-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Outros Apps (Telegram, SMS, Twitter)</span>
                  </button>

                  <button
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="py-2 px-3 bg-[#1C1C1C] hover:bg-neutral-800 border border-neutral-800 text-slate-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-500" />
                    <span>{showQrCode ? 'Ocultar QR' : 'Ver QR Code'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code Expansion */}
              <AnimatePresence>
                {showQrCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#141414] border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
                  >
                    <div className="w-28 h-28 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                      {/* Stylized QR representation */}
                      <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-white">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`rounded-xs ${
                              (i % 2 === 0 && i % 3 !== 0) || i < 7 || i > 28 || i === 14 || i === 21
                                ? 'bg-black' 
                                : 'bg-transparent'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        QR Code para Balcão ou Panfleto
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Exiba na bancada da sua autopeça, guincho ou oficina para que os motoristas apontem a câmera e instalem o app instantaneamente no celular!
                      </p>
                      <p className="text-[10px] text-amber-400 font-mono mt-1">
                        Link rastreado: {shareRefUrl}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Social Proof Stats */}
              <div className="bg-[#141414] border border-neutral-850 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-base font-black text-amber-500 block">100%</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Grátis p/ Motorista</span>
                </div>
                <div>
                  <span className="text-base font-black text-emerald-400 block">Direto</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Sem Taxa ou Comissão</span>
                </div>
                <div>
                  <span className="text-base font-black text-white block">24 Horas</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Socorro e Cotação</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Monetization intro */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-[#181818] to-amber-950/30 border border-emerald-500/20 p-4 rounded-xl space-y-1 text-center">
                <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-500/30 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  Monetização & Vendas Diárias
                </div>
                <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wider">
                  Coloque sua Loja no Topo das Buscas e do SOS
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl mx-auto">
                  Motoristas e frotistas quebram todos os dias e precisam de peças urgente. Quem aparece primeiro no Império fecha a venda na hora!
                </p>
              </div>

              {/* Plan Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {plans.map((p) => {
                  const isSelected = selectedPlan === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id as any)}
                      className={`rounded-xl p-4 border transition-all flex flex-col justify-between cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#1D1D1D] border-amber-500 shadow-xl shadow-amber-500/5 ring-1 ring-amber-500/50'
                          : 'bg-[#151515] border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {p.badge && (
                        <div className={`absolute -top-2.5 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md ${
                          p.highlight ? 'bg-amber-500 text-black' : 'bg-neutral-750 text-slate-300 border border-neutral-700'
                        }`}>
                          {p.badge}
                        </div>
                      )}

                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                          {p.highlight && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                          {p.name}
                        </h4>
                        
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl md:text-2xl font-black text-white">{p.price}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{p.period}</span>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-snug">
                          {p.description}
                        </p>

                        <div className="border-t border-neutral-850 pt-2.5 space-y-1.5 mt-2">
                          {p.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-300">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHirePlan(p.name, p.price);
                        }}
                        className={`w-full mt-4 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                          p.highlight
                            ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-slate-200'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>{p.ctaText}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* ROI Calculator / Social proof */}
              <div className="bg-[#121212] border border-neutral-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Retorno Rápido Sobre o Investimento (ROI)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Uma única venda de peça mecânica pesada (como cuíca de freio, turbina ou socorro guincho) gera em média <strong>R$ 600 a R$ 2.500 de lucro</strong> para sua empresa. Isso significa que o plano mensal se paga com sobra na primeira cotação fechada!
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-850 text-[10px] text-slate-400 font-mono">
                  <span>Ativação via PIX imediata</span>
                  <span>Sem carência ou multas de cancelamento</span>
                  <span>Suporte via WhatsApp</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#121212] p-3 md:p-4 border-t border-neutral-850 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500 font-mono">
            Império © {new Date().getFullYear()} — Plataforma Oficial
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-slate-200 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
