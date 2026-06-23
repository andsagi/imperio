import React from 'react';
import { Truck, Car, Bike, Crown, ShieldCheck, CheckCircle2, Award, Zap, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import ImperioLogo from './ImperioLogo';

interface NicheSelectorProps {
  userName: string;
  onSelect: (niche: 'pesados' | 'passeio' | 'motos') => void;
  currentNiche: 'pesados' | 'passeio' | 'motos' | null;
}

export default function NicheSelector({ userName, onSelect, currentNiche }: NicheSelectorProps) {
  const niches = [
    {
      id: 'pesados' as const,
      title: 'Segmento Pesados',
      icon: <Truck className="w-8 h-8 text-amber-500" />,
      badge: 'Carga & Logística',
      desc: 'Caminhões pesados, cavalos mecânicos, carretas e frotas de grande porte. SOS de rodovia e peças diesel.',
      colorClass: 'border-amber-500/30 hover:border-amber-500/80 bg-amber-500/5 shadow-amber-500/5',
      glowColor: 'bg-amber-500',
      textColor: 'text-amber-400',
      btnText: 'Entrar no Hub Pesados',
      bgHover: 'group-hover:bg-amber-500',
      chips: ['Scania', 'Volvo', 'Mercedes', 'Diesel S10', 'Guincho Pesado']
    },
    {
      id: 'passeio' as const,
      title: 'Segmento Passeio',
      icon: <Car className="w-8 h-8 text-emerald-400" />,
      badge: 'Carros & SUVs',
      desc: 'Carros de passeio, SUVs, utilitários, sedãs e hatches. Manutenção rápida, autopeças e lubrificantes recomendados.',
      colorClass: 'border-emerald-500/30 hover:border-emerald-500/80 bg-emerald-500/5 shadow-emerald-500/5',
      glowColor: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      btnText: 'Entrar no Hub Passeio',
      bgHover: 'group-hover:bg-emerald-500',
      chips: ['Toyota', 'Honda', 'Chevrolet', 'Injeção Eletrônica', 'Serviço ABS']
    },
    {
      id: 'motos' as const,
      title: 'Segmento Motos',
      icon: <Bike className="w-8 h-8 text-rose-500" />,
      badge: 'Duas Rodas',
      desc: 'Motocicletas de baixa, média e alta cilindrada, scooters e delivery. Peças de alta performance e SOS mecânico rápido.',
      colorClass: 'border-rose-500/30 hover:border-rose-500/80 bg-rose-500/5 shadow-rose-500/5',
      glowColor: 'bg-rose-500',
      textColor: 'text-rose-400',
      btnText: 'Entrar no Hub Motos',
      bgHover: 'group-hover:bg-rose-500',
      chips: ['Honda CG', 'Yamaha', 'Kit Relação', 'Pneus Pirelli', 'Capacetes']
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center min-h-[85vh] animate-fadeIn" id="niche-selector-screen">
      
      {/* Unified Logo Section */}
      <div className="w-full max-w-3xl bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-5 md:p-6 mb-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF8C00] via-amber-400 to-[#FF8C00]" />
        
        <span className="bg-[#FF8C00]/10 text-amber-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/20 inline-flex items-center gap-1">
          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>IDENTIDADE DA MARCA</span>
        </span>

        {/* Graphic Unified Logo Box */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="mb-4">
            <ImperioLogo size="lg" variant="full" />
          </div>

          <p className="text-xs text-slate-400 max-w-lg mt-2 leading-relaxed mx-auto font-sans">
            A soberania em autopeças e socorro imediato, cobrindo com excelência idêntica motoristas de <strong>Pesados</strong>, <strong>Passeio</strong> e frotas ou motoristas de <strong>Motos</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 text-left">
          <div className="bg-black/40 p-3 rounded-xl border border-neutral-850">
            <span className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1">
              <Award className="w-3 h-3" />
              Eixo 1 (Pesado)
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Confiabilidade e robustez brutal do caminhão.</p>
          </div>
          <div className="bg-black/40 p-3 rounded-xl border border-neutral-850">
            <span className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-1">
              <Award className="w-3 h-3" />
              Eixo 2 (Passeio)
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Agilidade, tecnologia, precisão e conforto.</p>
          </div>
          <div className="bg-black/40 p-3 rounded-xl border border-neutral-850">
            <span className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1">
              <Award className="w-3 h-3" />
              Eixo 3 (Motos)
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Velocidade, respostas rápidas e liberdade.</p>
          </div>
        </div>
      </div>

      {/* User Hello & Segment Selection Grid */}
      <div className="text-center space-y-2 mb-8">
        <h4 className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none">Seja bem-vindo, {userName}</h4>
        <h2 className="text-xl md:text-3xl font-black text-white leading-tight tracking-tight">
          Escolha o seu Segmento Imperial
        </h2>
        <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
          O ecossistema se moldará perfeitamente para oferecer o melhor estoque, preços garantidos e SOS voltados para a sua categoria desejada.
        </p>
      </div>

      {/* Segments Selection Grid with Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
        {niches.map((n) => {
          const isSelected = currentNiche === n.id;
          return (
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              key={n.id}
              onClick={() => onSelect(n.id)}
              className={`p-6 bg-[#181818] border rounded-2xl flex flex-col justify-between space-y-5 cursor-pointer relative overflow-hidden group hover:shadow-2xl transition-all ${n.colorClass} ${
                isSelected ? 'ring-2 ring-offset-2 ring-offset-[#121212] ring-opacity-80 ring-current' : ''
              }`}
            >
              {/* Subtle top background glow */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${n.glowColor} opacity-[0.03] group-hover:opacity-[0.08] filter blur-xl transition-all`} />
              
              <div className="space-y-3.5">
                {/* Header Icon + Badge */}
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-black/50 border border-neutral-800 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                    {n.icon}
                  </div>
                  
                  <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1.5 rounded-full bg-black/60 border border-neutral-850 ${n.textColor}`}>
                    {n.badge}
                  </span>
                </div>

                {/* Title + Desc */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-lg text-white group-hover:translate-x-0.5 transition-transform flex items-center gap-1.5">
                    <span>{n.title}</span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed min-h-[50px]">
                    {n.desc}
                  </p>
                </div>

                {/* Custom Compatibility tags list */}
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {n.chips.map((chip, idx) => (
                    <span key={idx} className="bg-black/45 text-[9px] text-slate-400 font-bold px-2 py-0.5 rounded border border-neutral-900">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 border border-neutral-800 ${
                    isSelected
                      ? 'bg-white text-black font-black border-transparent'
                      : 'bg-neutral-900 text-slate-300 group-hover:text-black group-hover:bg-white group-hover:border-transparent'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'Segmento Ativo' : n.btnText}</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-1.5 text-[11px] text-slate-450 font-bold">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Os nichos compartilham faturamento integrado, cotações em tempo real e canais de SOS ativos.</span>
      </div>

    </div>
  );
}
