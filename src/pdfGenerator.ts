/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';

export function generateBusinessPlanPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Color Palette
  const orangeColor = [255, 122, 0]; // #FF7A00
  const darkBackground = [18, 18, 18]; // #121212
  const lightGray = [120, 120, 120];

  let pageNumber = 1;

  // Header and Footer helper
  function drawPageTemplate(title: string) {
    // Dark top stripe
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, 210, 20, 'F');

    // Title text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 122, 0); // Orange
    doc.text('IMPÉRIO PESADOS - PLANO DE NEGÓCIOS DE STARTUP', 15, 12);

    // Footer
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 282, 210, 15, 'F');

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('O poder da sua frota em um só lugar | b2c.imperiopesados.com.br', 15, 290);
    doc.text(`Página ${pageNumber}`, 190, 290, { align: 'right' });

    // Decorative line
    doc.setDrawColor(255, 122, 0);
    doc.setLineWidth(0.5);
    doc.line(0, 20, 210, 20);
    doc.line(15, 282, 195, 282);
  }

  // --- PAGE 1: COVER PAGE ---
  doc.setFillColor(18, 18, 18); // #121212
  doc.rect(0, 0, 210, 297, 'F');

  // Orange highlight accent blocks
  doc.setFillColor(255, 122, 0);
  doc.rect(0, 0, 10, 297, 'F');
  doc.rect(15, 45, 180, 4, 'F');

  // Title on Cover
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(38);
  doc.setTextColor(255, 255, 255);
  doc.text('IMPÉRIO', 25, 75);
  doc.setTextColor(255, 122, 0);
  doc.text('PESADOS', 25, 92);

  // Slogan
  doc.setFont('Helvetica', 'oblique');
  doc.setFontSize(16);
  doc.setTextColor(200, 200, 200);
  doc.text('O poder da sua frota em um só lugar.', 25, 108);

  // Metadata block
  doc.setFillColor(30, 30, 30);
  doc.rect(25, 140, 160, 90, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 122, 0);
  doc.text('MODELO DE NEGÓCIOS DE STARTUP B2C DE LOGÍSTICA', 35, 155);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(230, 230, 230);
  doc.text('Autor: Colegiado de Fundadores Império Pesados', 35, 170);
  doc.text('Público-Alvo: Fornecedores de Autopeças, Oficinas e Transportadores', 35, 180);
  doc.text('Período de Carência: 90 dias de teste gratuito para motoristas', 35, 190);
  doc.text('Plano de Monetização: Cobrança de Fornecedores por Planos e Anúncios', 35, 200);
  doc.text('Data de Emissão: Junho de 2026', 35, 210);

  // Interactive footer of cover
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('© IMPÉRIO PESADOS INC. TODOS OS DIREITOS RESERVADOS.', 25, 270);

  // --- PAGE 2: EXECUTIVE SUMMARY & STRATEGY ---
  doc.addPage();
  pageNumber++;
  drawPageTemplate('1. Sumário Executivo');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text('1. Sumário Executivo do Negócio', 15, 35);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  const sec1Text = 
    `O Império Pesados surge no ecossistema logístico das rodovias brasileiras como um facilitador de B2C e B2B de autopeças e serviços mecânicos. O principal foco da plataforma é diminuir o tempo ocioso que caminhoneiros autônomos e transportistas passam parados em margens de rodovias aguardando socorro ou procurando pelas peças corretas para consertar o seus cavalos mecânicos.\n\nAtravés da geolocalização conectada, da triagem do modelo do caminhão e, principalmente, do inovador canal de Atendimento Humano Integrado por Vendedores de cada Fornecedor, o caminhoneiro consegue orçar com dezenas de oficinas próximas sem sair do ambiente do aplicativo.`;
  
  const splitSec1 = doc.splitTextToSize(sec1Text, 180);
  doc.text(splitSec1, 15, 45);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 122, 0);
  doc.text('1.1 Proposta de Valor e Diferencial Crítico', 15, 125);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  const diffText = 
    `• Atendimento Humano em Tempo Real: Cada distribuidora, borracharia e oficina tem vendedores cadastrados com indicadores de status real ("Online"). O caminhoneiro abre um chat imediato, envia fotos da peça quebrada (recurso de imagens assistido) e recebe orçamentos e links de pagamento diretos.\n\n• Botão SOS Integrado: Em caso de pânico na serra, colisão ou quebra súbita, o motorista pressiona um único botão vermelho. Um alerta com o diagnóstico é disparado para todas as oficinas registradas em um raio de até 50km, iniciando um leilão reverso automático de socorro mecânico.\n\n• Gestão Preventiva de Viagem (Próxima Parada): O motorista lança a quilometragem atualizada de seu caminhão, recebendo alertas proativos baseados no desgaste de pneus, frenagens e fluidos com cupons de descontos para postos de combustíveis cadastrados ao longo da sua rota comercial planeada.`;

  const splitDiff = doc.splitTextToSize(diffText, 180);
  doc.text(splitDiff, 15, 135);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 122, 0);
  doc.text('1.2 Estratégia de Tração de Motoristas', 15, 215);

  const tractionText =
    `Considerando o perfil desconfiado do autônomo, o Império Pesados concede 3 MESES DE CARÊNCIA SEM TAXAS para os motoristas. O aplicativo básico permanecerá gratuito perpetuamente (permitindo buscas rápidas e geolocalização simples). Após os 90 dias, a conversão é incentivada através de planos de vantagens que concedem descontos em postos Siga Bem e redes credenciadas.`;

  const splitTraction = doc.splitTextToSize(tractionText, 180);
  doc.text(splitTraction, 15, 225);

  // --- PAGE 3: REVENUE MODEL & SERVICE TIERS ---
  doc.addPage();
  pageNumber++;
  drawPageTemplate('2. Modelo de Receitas');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text('2. Modelo de Monetização e Planos de Fornecedor', 15, 35);

  const modelIntro = 
    `O acesso para os motoristas é isento de taxas mensais de adesão básicas. O motor gerador de faturamento do Império Pesados provém de planos de assinatura recorrente e taxas de destaque para os Fornecedores e Prestadores de Serviços cadastrados.`;
  doc.text(doc.splitTextToSize(modelIntro, 180), 15, 45);

  // DRAW TABLE FOR PLANS
  let yPos = 65;
  const plans = [
    {
      name: 'Plano Bronze (Presença Digital)',
      price: 'R$ 79,90/mês',
      features: 'Cadastro da empresa, geolocalização no mapa, telefone básico e perfil institucional.'
    },
    {
      name: 'Plano Prata (Vendas Ativas)',
      price: 'R$ 199,00/mês',
      features: 'Tudo do Bronze + Catálogo de até 50 autopeças + Canal de Chat com Atendentes Online em tempo real + Suporte simplificado.'
    },
    {
      name: 'Plano Ouro (Supremacia Império)',
      price: 'R$ 349,00/mês',
      features: 'Tudo do Prata + Catálogo ILIMITADO + Selo de Fornecedor Verificado + Destaque no topo dos resultados de busca regional + Relatórios mensais de cliques e conversões de chat.'
    }
  ];

  plans.forEach((plan, idx) => {
    // Plan box
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(230, 230, 230);
    doc.rect(15, yPos, 180, 35, 'FD');

    doc.setFillColor(255, 122, 0); // Orange indicator
    doc.rect(15, yPos, 3, 35, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(plan.name, 22, yPos + 8);
    
    doc.setTextColor(255, 122, 0);
    doc.text(plan.price, 190, yPos + 8, { align: 'right' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    
    const featLines = doc.splitTextToSize(plan.features, 170);
    doc.text(featLines, 22, yPos + 18);

    yPos += 42;
  });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('2.2 Taxas de Intermediação e Checkout Seguro', 15, 200);

  const splitCheck = doc.splitTextToSize(
    `Além das assinaturas de visibilidade, o Império Pesados implementará a partir do 6º mês o Checkout Seguro com Split de Pagamentos automático. Ao comprar uma peça diretamente no chat, a transação é processada em um ambiente virtual restrito. Uma taxa de comissão que varia entre 3.5% e 5% é retida pelo aplicativo de forma de comissão de segurança, e a receita remanescente cai diretamente para a conta cadastrada do lojista.\n\nEste modelo fornece extrema segurança ao caminhoneiro que teme fraudes, já que o repasse de valores para o vendedor só é liberado mediante a confirmação física de recebimento de peças de alta durabilidade ou execução de reparos técnicos.`,
    180
  );
  doc.text(splitCheck, 15, 210);

  // --- PAGE 4: TECHNICAL ARCHITECTURE & COMPLIANCE ---
  doc.addPage();
  pageNumber++;
  drawPageTemplate('3. Termos Legais & Segurança');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text('3. Termos de Uso e Normas Legais da Plataforma', 15, 35);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 122, 0);
  doc.text('3.1 Cláusula de Isenção de Responsabilidade (Intermediador)', 15, 45);

  const t1 = 
    `O IMPÉRIO PESADOS opera estritamente sob o regime de intermediação tecnológica de serviços de terceiros. A plataforma aproxima o motorista profissional das lojas parceiras cadastradas, não possuindo qualquer vínculo societário, trabalhista ou de subordinação em relação aos serviços técnicos prestados ou peças automotivas fornecidas por anunciantes.\n\nA responsabilidade civil, tributária e comercial sobre a garantia mecânica, troca de componentes, entrega pontual na malha rodoviária e faturamento do frete recai integralmente e exclusivamente sobre o fornecedor que firmou a venda. Quaisquer divergências devem ser dirimidas diretamente com o atendente ou responsável legal da marca prestadora.`;
  doc.text(doc.splitTextToSize(t1, 180), 15, 55);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 122, 0);
  doc.text('3.2 Privacidade dos Usuários e Conformidade da LGPD', 15, 115);

  const t2 = 
    `O Império Pesados realiza de forma transparente a coleta e tratamento da geolocalização e histórico de posição em tempo real do motorista, visando mapear com extrema precisão os fornecedores num raio de 50km adequados à sua rota ou ponto de parada imediata. Em total conformidade com a Lei Geral de Proteção de Dados (LGPD), todos os dados transmitidos são criptografados end-to-end e eliminados dos servidores centrais após a conclusão da rota ou expiração das sessões abertas de SOS.\n\nOs motoristas mantêm pleno controle de revogação de acessos de GPS e dados do caminhão (como placa, marca, modelo e ano do chassi) diretamente na aba "Meu Perfil" do software comercial.`;
  doc.text(doc.splitTextToSize(t2, 180), 15, 125);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 122, 0);
  doc.text('3.3 Políticas de Qualificação e Banimento Preventivo', 15, 185);

  const t3 = 
    `Com o intuito de prezar pela integridade mecânica das estradas nacionais, todos os fornecedores cadastrados passam por auditorias iniciais de CNPJ ativo, alvará técnico de corpo de bombeiros e verificação de reclamações. Usuários (motorista) avaliam as oficinas e lojas em um sistema binário de 1 a 5 estrelas.\n\nEmpresas ou consultores com avaliações inferiores a 4.1 estrelas em um período contínuo de 30 dias de operação serão suspensos de maneira arbitrária da listagem principal até que passem por reciclagens ou comprovem a resolução de pendências pós-venda.`;
  doc.text(doc.splitTextToSize(t3, 180), 15, 195);

  // --- PAGE 5: SCRIPT PLAYBOOKS & MARKETING ---
  doc.addPage();
  pageNumber++;
  drawPageTemplate('4. Atendimento e Marketing');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text('4. Script de Vendas e Planejamento de Marketing', 15, 35);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 122, 0);
  doc.text('4.1 Playbook de Abordagem Atendimento Online', 15, 45);

  const playbookText = 
    `Como o atendimento em tempo real é o coração da conversão rápida, todos os consultores recebem ao se cadastrarem o script otimizado Império Pesados:\n\n1. Saudação Rápida Estilo Rodovia:\n"Opa parceiro, bão? Sou o [Nome do Vendedor] da [Oficina]. Vi que você precisa de socorro mecânico ou peças. Como posso te agilizar a voltar pro trecho hoje?"\n\n2. Triagem e Validação de Imagem:\n"Para evitar erro do modelo ou lote, envia uma foto da peça quebrada ou uma foto do documento do caminhão aqui no chat. Eu já vou no meu estoque checar!"\n\n3. Conversão Imediata:\n"Temos a peça a pronta entrega aqui chefe. O preço especial do app é R$ X. Já vou gerar o seu link de retirada garantida. Posso deixar reservado para quando você passar?"`;
  doc.text(doc.splitTextToSize(playbookText, 180), 15, 55);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 122, 0);
  doc.text('4.2 Campanhas de Marketing de Guerrilha em Rodovias', 15, 145);

  const mktText = 
    `• Adesivação em Pátios de Postos e Paradas de Caminhões:\nAdesivos com QR Codes de 15cm colados em pontos estratégicos de banheiros, pátios de carretas, churrascarias e postos de pesagem com slogans chamativos: "Quebrou na estrada? Não fique parado. Tenha atendimento online agora na beira das pistas pelo Império Pesados com 3 meses grátis."\n\n• Parcerias com Rádios Regionais e Canais do Trecho:\nSpots curtos de 15 segundos transmitidos em horários de pico noturnos (22h às 02h) de canais do YouTube dedicados a diários de bordo e em frequências de rádio AM/FM de concessionárias com foco na ativação da ferramenta de SOS de 1 clique.`;
  doc.text(doc.splitTextToSize(mktText, 180), 15, 155);

  // Save the PDF
  doc.save('Plano_Complete_Imperio_Pesados.pdf');
}
