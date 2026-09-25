/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Tag } from 'lucide-react';

interface SponsoredAdBannerProps {
  niche?: 'pesados' | 'passeio' | 'motos' | null;
  onOpenMonetize: () => void;
}

export default function SponsoredAdBanner({ niche, onOpenMonetize }: SponsoredAdBannerProps) {
  const getBannerData = () => {
    switch (niche) {
      case 'motos':
        return {
          tag: 'PATROCINADO • MOTOS',
          title: 'Óleo Sintético 10W-30 & Kit Relação Aço 1045 com 20% OFF',
          company: 'Motopeças Express & Lubrificantes',
          highlight: 'Pronta Entrega para Motoboys',
          bgGradient: 'from-rose-950/40 via-[#1A1A1A] to-neutral-900',
          borderColor: 'border-rose-500/25',
          tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
      case 'passeio':
        return {
          tag: 'PATROCINADO • CARROS',
          title: 'Baterias 60Ah com Troca Grátis e Garantia de 24 Meses',
          company: 'Rede Auto Baterias & Elétrica 24h',
          highlight: 'Atendimento no Local',
          bgGradient: 'from-emerald-950/40 via-[#1A1A1A] to-neutral-900',
          borderColor: 'border-emerald-500/25',
          tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'pesados':
      default:
        return {
          tag: 'PATROCINADO • LINHA PESADA',
          title: 'Filtros Diesel & Lubrificantes 15W40 para Scania e Volvo',
          company: 'Distribuidora Central Diesel & Peças',
          highlight: 'Desconto p/ Frotistas no PIX',
          bgGradient: 'from-amber-950/40 via-[#1A1A1A] to-neutral-900',
          borderColor: 'border-amber-500/25',
          tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
    }
  };

  const ad = getBannerData();

  return (
    <div className={`w-full max-w-4xl mx-auto mb-4 bg-gradient-to-r ${ad.bgGradient} border ${ad.borderColor} rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left relative overflow-hidden`}>
      <div className="space-y-1.5 flex-1 z-10">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${ad.tagColor}`}>
            {ad.tag}
          </span>
          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-500" />
            {ad.company}
          </span>
        </div>

        <h4 className="text-xs sm:text-sm font-black text-white leading-tight">
          {ad.title}
        </h4>

        <p className="text-[11px] text-slate-300 flex items-center gap-1.5 font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{ad.highlight}</span>
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 z-10 w-full sm:w-auto">
        <button
          onClick={onOpenMonetize}
          className="w-full sm:w-auto px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span>Anuncie Aqui Sua Loja</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Subtle background glow */}
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-amber-500/5 blur-xl pointer-events-none" />
    </div>
  );
}
