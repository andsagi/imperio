/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { OrderStats } from './types';

export function generateSupplierAnalyticsPDF(
  companyName: string,
  stats: OrderStats,
  catalogCount: number,
  period: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Colors
  const primaryOrange = [255, 140, 0]; // #FF8C00
  const blackBackground = [18, 18, 18]; // #121212
  const textColor = [31, 41, 55]; // Gray 800
  const lightGrayBg = [249, 250, 251]; // Gray 50

  const todayStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // --- PAGE TEMPLATE HEADER ---
  const drawHeaderFooter = (pageNum: number) => {
    // Header block
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, 210, 24, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 140, 0);
    doc.text('IMPÉRIO PESADOS ANALYTICS', 15, 11);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Relatório Executivo de Rendimento e Tráfego', 15, 16);

    // Right header logo
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('PARCEIRO PREMIUM', 195, 14, { align: 'right' });

    // Header divider line (Orange)
    doc.setDrawColor(255, 140, 0);
    doc.setLineWidth(0.7);
    doc.line(0, 24, 210, 24);

    // Footer
    doc.setFillColor(243, 244, 246);
    doc.rect(0, 282, 210, 15, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Império Pesados - Conectando Cargas, Caminhoneiros e Autopeças', 15, 291);
    doc.text(`Página ${pageNum}`, 195, 291, { align: 'right' });

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(15, 282, 195, 282);
  };

  // COVER SECTION / PAGE 1
  drawHeaderFooter(1);

  // Title Block
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(17, 24, 39);
  doc.text('RELATÓRIO DE DESEMPENHO COMERCIAL', 15, 42);

  // Supplier Name Subtitle
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 140, 0);
  doc.text(companyName, 15, 50);

  // Period Badge
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(15, 55, 180, 15, 2, 2, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text(`Filtro Tempos: ${period.toUpperCase()}`, 20, 64);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Extraído em: ${todayStr}`, 190, 64, { align: 'right' });

  // Summary Metrics Section
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('1. Indicadores Chave de Performance (KPIs)', 15, 85);

  // Draw 4 KPI Boxes
  const kpis = [
    { label: 'Cliques / Visualizações', val: stats.views.toString(), desc: 'Tráfego de vitrine' },
    { label: 'Contatos WhatsApp', val: stats.clicks.toString(), desc: 'Leads qualificados' },
    { label: 'Solicitações de Cotações', val: stats.quotesCount.toString(), desc: 'Em negociação' },
    { label: 'Vendas Convertidas', val: stats.salesClosed.toString(), desc: 'Conversões diretas' }
  ];

  let xStart = 15;
  let boxWidth = 42;
  let boxHeight = 26;

  kpis.forEach((kpi, index) => {
    // Draw box border and light fill
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(xStart, 92, boxWidth, boxHeight, 2, 2, 'FD');

    // Orange top tiny bar
    doc.setFillColor(255, 140, 0);
    doc.rect(xStart, 92, boxWidth, 1.5, 'F');

    // Title label
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    // Wrap text if needed
    const textLines = doc.splitTextToSize(kpi.label, boxWidth - 4);
    doc.text(textLines, xStart + 3, 98);

    // Number value
    doc.setFont('Helvetica', 'black');
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text(kpi.val, xStart + 3, 110);

    // Short desc
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(156, 163, 175);
    doc.text(kpi.desc, xStart + 3, 115);

    xStart += boxWidth + 4;
  });

  // Funnel / Conversion Rates
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('2. Funil de Conversão e Aproveitamento Digital', 15, 133);

  // Math conversions
  const clickRate = stats.views > 0 ? ((stats.clicks / stats.views) * 100).toFixed(1) : '0';
  const quoteRate = stats.clicks > 0 ? ((stats.quotesCount / stats.clicks) * 100).toFixed(1) : '0';
  const closeRate = stats.quotesCount > 0 ? ((stats.salesClosed / stats.quotesCount) * 100).toFixed(1) : '0';

  // Draw Horizontal Bars
  const steps = [
    { stage: 'Visibilidade / Cliques Vitrine', percent: '100%', absolute: `${stats.views} visualizações`, w: 140, color: [229, 231, 235] },
    { stage: 'Engajamento / Leads Whatsapp', percent: `${clickRate}%`, absolute: `${stats.clicks} cliques de contato`, w: Math.max(15, Math.min(140, parseFloat(clickRate) * 1.4)), color: [255, 140, 0] },
    { stage: 'Interesse Real / Cotações Abertas', percent: `${quoteRate}%`, absolute: `${stats.quotesCount} chats de cotação`, w: Math.max(15, Math.min(140, parseFloat(quoteRate) * 1.4)), color: [147, 51, 234] },
    { stage: 'Iniciação Venda / Fechamento', percent: `${closeRate}%`, absolute: `${stats.salesClosed} acordos confirmados`, w: Math.max(15, Math.min(140, parseFloat(closeRate) * 1.4)), color: [16, 185, 129] }
  ];

  let yBar = 139;
  steps.forEach((step) => {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text(step.stage, 15, yBar + 4);

    // Under gray background bar
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(80, yBar, 100, 5, 1.5, 1.5, 'F');

    // Dynamic color filler bar
    doc.setFillColor(step.color[0], step.color[1], step.color[2]);
    doc.roundedRect(80, yBar, Math.max(8, step.w), 5, 1.5, 1.5, 'F');

    // Values labels
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(`${step.percent}`, 185, yBar + 4);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(step.absolute, 82, yBar + 9);

    yBar += 13;
  });

  // Section 3: Diagnostic and Insights
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('3. Diagnóstico de Negócios e Dicas de Tração', 15, 200);

  doc.setFillColor(254, 243, 199); // Amber background
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(15, 206, 180, 42, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(146, 64, 14);
  doc.text('Conselhos do Estrategista do Império:', 20, 212);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 53, 4);

  const tipsText = 
    `• Otimização do Inventário: Identificamos ${catalogCount} componentes ativos cadastrados em seu e-estoque de anúncio. Lojas qualificadas com mais de 15 peças mantêm um aumento médio de 2.4x mais visualizações do que anunciantes de nicho único.\n\n• Tempo de Resposta nos Chats: Atualmente, seu atendente está logado como "Online". Responder ao caminhoneiro em menos de 4 minutos no primeiro contato eleva a eficiência de venda em mais de 72%, pois o pavor da beira-pista exige respostas urgentes.\n\n• Selo Verificado: Sua distribuidora é uma Parceira Fundadora pioneira no trecho brasileiro. Continue promovendo cupons de desconto pelo chat rápido para fidelizar caminhoneiros de rotas rotineiras.`;

  const splitTips = doc.splitTextToSize(tipsText, 170);
  doc.text(splitTips, 20, 218);

  // Sign-off
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('Império Pesados Inc. - Gerando força nas rodovias', 15, 265);
  doc.setFont('Helvetica', 'normal');
  doc.text('Qualquer dúvida de faturamento, canais de suporte ou upgrades de anúncio, chame no SAC.', 15, 270);

  // Save document
  doc.save(`Analise_${companyName.replace(/\s+/g, '_')}.pdf`);
}
