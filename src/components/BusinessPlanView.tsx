/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Download, Briefcase, Zap, DollarSign, Scale, ShieldCheck, Mail, Target, Crown } from 'lucide-react';
import { generateBusinessPlanPDF } from '../pdfGenerator';
import { motion } from 'motion/react';

export default function BusinessPlanView() {
  const [downloading, setDownloading] = useState(false);

  const triggerDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      generateBusinessPlanPDF();
      setDownloading(false);
    }, 1500);
  };

  const sections = [
    {
      id: 'sumario',
      title: '1. Sumário Executivo',
      icon: <Briefcase className="w-5 h-5 text-[#FF8C00]" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm md:text-base leading-relaxed text-slate-300 font-sans">
            O <strong className="text-[#FF8C00]">Império Pesados</strong> é uma plataforma B2C de ponta desenhada para otimizar e conectar de forma direta o mercado de peças e serviços de manutenção com os caminhoneiros autônomos e frotistas do Brasil.
          </p>
          <div className="bg-[#1A1A1A] border border-[#FF8C00]/15 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#FF8C00]">Diferencial Proposto</h4>
            <p className="text-xs leading-relaxed text-slate-400">
              Caminhoneiros parados na rodovia enfrentam abuso de preços e enorme latência no socorro mecânico. Nós criamos uma vitrine digital baseada em geolocalização e Atendimento Humano Imediato, onde cada fornecedor possui vendedores dedicados para negociar, orçar e enviar faturas seguras dentro do app.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'monetizacao',
      title: '2. Recorrência & Modelo Financeiro',
      icon: <DollarSign className="w-5 h-5 text-[#FF8C00]" />,
      content: (
        <div className="space-y-4">
          <p className="text-xs md:text-sm leading-relaxed text-slate-300 font-medium font-sans">
            O modelo de receitas do aplicativo foi criado visando crescimento orgânico de motoristas na base:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="pricing-tiers-grid">
            <div className="bg-[#1A1A1A] border border-neutral-800 p-4 rounded-xl text-center">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest block font-mono">Gratuito</span>
              <span className="text-lg md:text-xl font-extrabold text-[#FF8C00] block mt-1">Caminhoneiro</span>
              <p className="text-[10px] text-slate-400 mt-2">Acesso VIP no primeiro trimestre. Opções de buscas básicas vitalícias e SOS gratuito.</p>
            </div>
            <div className="bg-[#1E1E1E] border border-[#FF8C00]/30 p-4 rounded-xl text-center shadow-lg shadow-[#FF8C00]/5">
              <span className="text-xs font-black text-[#FF8C00] uppercase tracking-widest block font-mono">Populares</span>
              <span className="text-lg md:text-xl font-extrabold text-white block mt-1">Anunciante Prata</span>
              <span className="text-sm text-slate-300 font-bold block mt-1">R$ 199,00/mês</span>
              <p className="text-[10px] text-slate-400 mt-2">Foco em lojas ativas. Catálogo de 50 itens, chat de vendas e painel de estatísticas.</p>
            </div>
            <div className="bg-[#1A1A1A] border border-neutral-800 p-4 rounded-xl text-center">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest block font-mono">Premium</span>
              <span className="text-lg md:text-xl font-extrabold text-[#FF8C00] block mt-1">Anunciante Ouro</span>
              <span className="text-sm text-slate-300 font-bold block mt-1">R$ 349,00/mês</span>
              <p className="text-[10px] text-slate-400 mt-2">Destaque regional nas buscas, catálogo ilimitado de peças e o valioso Selo de Confiança.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'termos',
      title: '3. Proteção Jurídica e LGPD',
      icon: <Scale className="w-5 h-5 text-[#FF8C00]" />,
      content: (
        <div className="space-y-4">
          <p className="text-xs md:text-sm leading-relaxed text-slate-300 font-sans">
            Pontos de conformidade fundamentais para a isenção de sinistros na malha de transportes:
          </p>
          <div className="space-y-3 text-xs text-slate-400">
            <div className="flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Isenção de Negócio:</strong> O Império Pesados declara ser estritamente um intermediador eletrônico de dados, repassando qualquer dever técnico sobre trocas, garantias e falhas decorrentes de reparos unicamente aos fornecedores.
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Controle de Localização:</strong> O aplicativo armazena coordenadas apenas para pareamento de socorro instantâneo (SOS) e filtros geográficos de produtos, excluindo logs rotineiros após 24 horas em estrito acordo com a LGPD.
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'playbook',
      title: '4. Playbook & Atendimento Humano',
      icon: <Target className="w-5 h-5 text-[#FF8C00]" />,
      content: (
        <div className="space-y-3">
          <p className="text-xs md:text-sm leading-relaxed text-slate-300 font-sans">
            Scripts e estratégias para garantir agilidade e conversão dentro do chat Império Pesados:
          </p>
          <div className="p-3.5 bg-[#1A1A1A] border border-neutral-800 rounded-xl">
            <span className="text-[10px] font-black uppercase text-[#FF8C00] block mb-1 font-mono">Rotina de Prospecção</span>
            <blockquote className="text-xs text-slate-400 italic">
              "Olá parceiro, bão? Sou o João, especialista de vendas. Vi sua busca no app por [Peça]. Para não dar erro de série, me manda uma foto do seu chassi ou da peça velha! Tenho a pronta entrega e já separo pro seu moço retirar na beira da rodovia..."
            </blockquote>
          </div>
        </div>
      )
    },
    {
      id: 'marketing',
      title: '5. Marketing de Guerrilha',
      icon: <Mail className="w-5 h-5 text-[#FF8C00]" />,
      content: (
        <div className="space-y-2">
          <p className="text-xs md:text-sm leading-relaxed text-slate-300 font-sans">
            Nossa estratégia de captação ativa de caminhoneiros nas principais rotas comerciais (ex: BR-116, Dutra, Anhanguera):
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1.5 leading-relaxed">
            <li>Adesivação e panfletagem QR Code em banheiros, pátios de carretas de grandes redes de postos parceiros.</li>
            <li>Divulgação em spots de rádio AM/FM voltados para concessionárias concessionadas nas rodovias.</li>
            <li>Cadastro inicial de lojas de peças com "Isenção Fundador" para povoas as listas locais de buscas do app piloto.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div id="plan-view-container" className="space-y-6 max-w-4xl mx-auto selection:bg-[#FF8C00] selection:text-black">
      {/* Visual Header card */}
      <div className="bg-gradient-to-r from-[#FF8C00]/20 to-amber-600/5 border border-[#FF8C00]/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-[#FF8C00] font-black text-xs uppercase tracking-wider">
            <Crown className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span>Documento Executivo • <strong className="text-amber-400 font-black tracking-widest bg-amber-500/10 px-2.5 py-1 rounded">IMPÉRIO</strong></span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white">Plano de Negócios e Estruturação</h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-xl font-sans">
            Todos os conceitos, regras de uso corporativo, termos legais isentivos para intermediação jurídica e o plano de monetização reunidos. Faça download do PDF oficial.
          </p>
        </div>

        <button
          id="download-plan-pdf-btn"
          onClick={triggerDownload}
          disabled={downloading}
          className="w-full md:w-auto shrink-0 bg-[#FF8C00] hover:bg-[#E67E00] transition-all text-black font-black text-xs uppercase tracking-wider py-4 px-6 rounded-xl flex items-center justify-center space-x-2.5 shadow-lg shadow-[#FF8C00]/10 cursor-pointer disabled:bg-neutral-800 disabled:text-slate-500 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Gerando PDF Completo...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Baixar Plano Completo (PDF)</span>
            </>
          )}
        </button>
      </div>

      {/* Styled segments view list */}
      <div className="space-y-4" id="plan-accordion-list">
        {sections.map((sec, i) => (
          <motion.div
            key={sec.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl overflow-hidden p-6 hover:border-[#FF8C00]/30 transition-all duration-300 shadow-xl"
          >
            <div className="flex items-center space-x-3 border-b border-neutral-800 pb-3 mb-4">
              {sec.icon}
              <h3 className="font-extrabold text-white text-base">{sec.title}</h3>
            </div>
            {sec.content}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
