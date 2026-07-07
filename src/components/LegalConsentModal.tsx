/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, FileText, X, Check, Lock, Eye, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LegalConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'terms' | 'privacy';
}

export default function LegalConsentModal({ isOpen, onClose, defaultTab = 'terms' }: LegalConsentModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#1E1E1E] border border-neutral-850 w-full max-w-2xl h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Modal Header */}
        <div className="bg-[#151515] p-4 border-b border-neutral-850 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="font-black text-xs md:text-sm uppercase tracking-wider text-slate-100">
              Conformidade Legal & LGPD
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-850 bg-[#1A1A1A] p-1 gap-1">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 px-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-[#FF8C00] text-black font-black font-display'
                : 'text-slate-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Termos de Uso</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 px-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#FF8C00] text-black font-black font-display'
                : 'text-slate-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Política de Privacidade</span>
          </button>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 text-xs text-slate-350 leading-relaxed scrollbar-thin scrollbar-thumb-neutral-800">
          {activeTab === 'terms' ? (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
                1. Termos e Condições de Uso - Plataforma Império
              </h3>
              <p>
                Bem-vindo ao <strong>Império</strong>, a maior rede inteligente do Brasil de suporte rodoviário, 
                cotação e compra de autopeças, além de serviços e socorro imediato para motoristas profissionais, 
                frotistas, motoristas de passeio e pilotos de motos.
              </p>
              <p>
                Ao acessar ou utilizar a nossa plataforma (incluindo o aplicativo móvel, painel de fornecedores e site), 
                você aceita integralmente e concorda em cumprir estes Termos de Uso. Caso não concorde com qualquer termo aqui 
                previsto, orientamos que interrompa imediatamente o uso de nossos serviços.
              </p>

              <h4 className="font-bold text-slate-200 mt-2 uppercase text-[11px] tracking-wide">
                2. Cadastro de Usuários e Segurança dos Dados
              </h4>
              <p>
                A plataforma oferece diferentes tipos de perfis de acesso:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-slate-200">Motoristas / Pilotos:</strong> Pessoas físicas qualificadas 
                  que necessitam de autopeças, serviços mecânicos, lubrificantes, pneus ou chamados de socorro SOS. 
                  O cadastro exige dados básicos como CPF/CNPJ, nome de exibição, número de telefone e modelo do veículo.
                </li>
                <li>
                  <strong className="text-slate-200">Empresas e Fornecedores:</strong> Estabelecimentos comerciais autorizados, 
                  postos de combustível, lojas de pneus e mecânicos que cadastram catálogos de autopeças e serviços. Exige-se CNPJ corporativo ativo, 
                  nome fantasia, telefone de contato público e localização por cobertura.
                </li>
              </ul>
              <p>
                Todos os usuários comprometem-se a prestar informações estritamente verdadeiras. O uso de documentos (CPF ou CNPJ) 
                falsos constitui violação criminal e resultará no banimento imediato e permanente da conta.
              </p>

              <h4 className="font-bold text-slate-200 mt-2 uppercase text-[11px] tracking-wide">
                3. Mecanismo de Localização e Socorro SOS
              </h4>
              <p>
                Para prestar assistência rápida em caso de quebras ou emergências, a plataforma utiliza coordenadas de geolocalização e 
                raio de cobertura. Ao acionar o botão de socorro SOS ou solicitar cotações de fornecedores baseadas em proximidade, 
                sua geolocalização exata é enviada aos fornecedores compatíveis mais próximos. Este compartilhamento ocorre estritamente para 
                cumprir a finalidade de atendimento rápido solicitado pelo próprio usuário.
              </p>

              <h4 className="font-bold text-slate-200 mt-2 uppercase text-[11px] tracking-wide">
                4. Cotações e Negociações Diretas
              </h4>
              <p>
                O Império atua como um facilitador tecnológico de negócios de autopeças, e as negociações via chat e orçamentos virtuais são 
                realizadas de forma direta entre vendedor e comprador. Não processamos transações financeiras diretamente e não cobramos comissões 
                de vendas dos motoristas. Logo, as garantias de qualidade, logística de entrega e pagamentos físicos são de inteira responsabilidade 
                das respectivas empresas fornecedoras cadastradas em nossa plataforma.
              </p>

              <h4 className="font-bold text-slate-200 mt-2 uppercase text-[11px] tracking-wide">
                5. Uso de Biometria do Dispositivo
              </h4>
              <p>
                O aplicativo permite configurar o login por credenciais biométricas salvas localmente no dispositivo móvel. 
                Nossos servidores <strong>nunca coletam, transmitem ou armazenam suas impressões digitais ou dados biométricos faciais</strong>. 
                A verificação é realizada localmente pelas APIs de biometria nativas do aparelho (iOS LocalAuthentication ou Google BiometricPrompt), 
                oferecendo o mais elevado padrão de segurança operacional.
              </p>

              <h4 className="font-bold text-slate-200 mt-2 uppercase text-[11px] tracking-wide">
                6. Política de Tolerância Zero para Abusos
              </h4>
              <p>
                Comentários depreciativos, avaliações fraudulentas de fornecedores ou motoristas, e comportamento hostil no chat corporativo 
                não serão tolerados. O Império reserva-se o direito de remover conteúdos ofensivos e revogar o acesso de qualquer conta que deponha contra 
                as boas práticas comerciais e de conduta.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
                Política de Privacidade de Dados - Conformidade com a LGPD (Lei Nº 13.709/2018)
              </h3>
              <p>
                A sua privacidade é um compromisso fundamental para nós. Esta Política de Privacidade explica detalhadamente 
                como coletamos, armazenamos, tratamos e compartilhamos seus dados na plataforma Império, em estrito cumprimento 
                com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD)</strong> brasileira.
              </p>

              <h4 className="font-bold text-slate-200 mt-2 uppercase text-[11px] tracking-wide">
                1. Quais dados coletamos e por quê?
              </h4>
              <p>
                Coletamos apenas os dados essenciais para o pleno funcionamento das funcionalidades da plataforma:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-slate-200">Dados do perfil do usuário:</strong> Nome completo ou fantasia, e-mail, telefone para 
                  contato físico/WhatsApp, senha criptografada e documento (CPF ou CNPJ) usado para evitar crimes de falsidade ideológica no marketplace.
                </li>
                <li>
                  <strong className="text-slate-250">Dados de localização (GPS):</strong> Coordenadas em tempo real obtidas com o consentimento do 
                  usuário final para buscar oficinas próximas no mapa, roteamento de peças e acionamento de socorro SOS mecânico.
                </li>
                <li>
                  <strong className="text-slate-250">Imagens de Catálogo e Chat:</strong> Fotos enviadas espontaneamente para o catálogo de peças 
                  ou enviadas no chat para demonstrar componentes mecânicos que necessitam de reposição.
                </li>
              </ul>

              <h4 className="font-bold text-slate-200 mt-2 uppercase text-[11px] tracking-wide">
                2. Direitos dos Titulares dos Dados (Art. 18 da LGPD)
              </h4>
              <p>
                Você, titular de dados pessoais, possui os seguintes direitos garantidos por lei, exercíveis a qualquer momento diretamente no app:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 font-medium">
                <li className="text-green-400">
                  <strong>Confirmação e Acesso aos seus dados:</strong> Saber exatamente quais dados seus estão armazenados em nosso Firestore.
                </li>
                <li className="text-green-400">
                  <strong>Retificação:</strong> Corrigir dados desatualizados, incompletos ou inexatos.
                </li>
                <li className="text-green-400">
                  <strong>Exclusão Pessoal Permanente (Esquecimento):</strong> Deletar de forma definitiva sua conta e todos os dados associados 
                  (pedidos, catálogos, avaliações enviadas e cadastro).
                </li>
              </ul>

              <h4 className="font-bold text-slate-200 mt-2 uppercase text-[11px] tracking-wide">
                3. Compartilhamento de Informações com Terceiros
              </h4>
              <p>
                Nós <strong>nunca vendemos ou comercializamos dados de usuários</strong> para empresas de publicidade de terceiros. 
                Os dados são transmitidos apenas para cumprir a transação mercantil e operacional solicitada por você (por exemplo, quando você 
                envia um WhatsApp ou inicia um chat com um fornecedor de peças, compartilhamos seu número ou nome para permitir a negociação).
              </p>

              <h4 className="font-bold text-slate-200 mt-2 uppercase text-[11px] tracking-wide">
                4. Segurança e Hospedagem de Nuvem
              </h4>
              <p>
                Seus dados são armazenados de forma extremamente segura através da sincronização em tempo real do nosso parceiro tecnológico 
                <strong> Google Firebase/Firestore</strong>, protegido por chaves criptográficas SSL/TLS de ponta a ponta e regras restritivas do 
                banco de dados que impedem acessos criminosos não autorizados de terceiros.
              </p>

              <h4 className="font-bold text-slate-200 mt-2 uppercase text-[11px] tracking-wide flex items-center gap-1 text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
                <span>5. Exclusão de Conta e Solicitamento Direto</span>
              </h4>
              <p>
                Em absoluta conformidade com as exigências da Google Play Store e a Apple App Store, você possui acesso a um mecanismo simples de 
                autodeleção de conta. Ao acessar as configurações do seu perfil no aplicativo (seja você Motorista ou Fornecedor), 
                clique em <strong>"Excluir Minha Conta / Deletar Dados"</strong>. Todos os registros atrelados ao seu nome de usuário, CNPJ/CPF, 
                itens de catálogo e chat serão removidos permanentemente das coleções ativas e backups dentro de poucos segundos.
              </p>

              <h4 className="font-bold text-slate-200 mt-2 uppercase text-[11px] tracking-wide">
                6. Atualizações e Contatos DPO
              </h4>
              <p>
                Esta política poderá sofrer ajustes para inclusão de novos regulamentos das lojas de aplicativos ou mudanças na ANPD. 
                Em caso de dúvidas sobre LGPD, fale com nosso Encarregado de Proteção de Dados (DPO) através da central de suporte técnico da plataforma Império.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#151515] p-4 border-t border-neutral-850 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Versão compilada em total conformidade com a LGPD & GDPR</span>
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-neutral-100 hover:bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
          >
            Entendi e Aceito
          </button>
        </div>
      </motion.div>
    </div>
  );
}
