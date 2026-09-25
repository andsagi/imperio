/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  AlertTriangle, Clock, Users, ShieldAlert, CheckCircle2, TrendingUp, 
  Calendar, Wrench, Truck, Phone, RefreshCw, BarChart3, Activity, 
  Flame, ChevronRight, Download, Filter, Info, PlusCircle
} from 'lucide-react';
import { SOSRequest, Supplier } from '../types';
import { loadSOSRequests, saveSOSRequests } from '../mockData';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface HourlyStat {
  hour: number;
  label: string;
  count: number;
  types: Record<string, number>;
}

export interface TimelineDayStat {
  date: Date;
  dateStr: string;
  count: number;
  breakdowns: Record<string, number>;
}

export interface MatrixCellStat {
  day: string;
  dayIdx: number;
  shift: string;
  shiftIdx: number;
  count: number;
}

interface SOSDistressVisualizationProps {
  supplier: Supplier | null;
  companyName: string;
}

export default function SOSDistressVisualization({ supplier, companyName }: SOSDistressVisualizationProps) {
  const [sosList, setSosList] = useState<SOSRequest[]>(() => loadSOSRequests());
  const [activeVizMode, setActiveVizMode] = useState<'24h' | 'timeline' | 'heatmap'>('24h');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('todos');
  const [timeRangeDays, setTimeRangeDays] = useState<number>(30); // 7, 30, 90
  const [hoveredData, setHoveredData] = useState<any | null>(null);

  // Workforce Planning state simulator
  const [onDutyMechanics, setOnDutyMechanics] = useState<number>(2);
  const [onDutyTowingOperators, setOnDutyTowingOperators] = useState<number>(1);
  const [onDutyElectricians, setOnDutyElectricians] = useState<number>(1);
  const [simulationAlert, setSimulationAlert] = useState<string | null>(null);

  // SVG Chart Container Refs
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Listen to Firestore real-time sos_requests updates
  useEffect(() => {
    let isMounted = true;
    try {
      const unsub = onSnapshot(collection(db, 'sos_requests'), (snapshot) => {
        if (!isMounted) return;
        const items: SOSRequest[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as SOSRequest);
        });
        if (items.length > 0) {
          setSosList(items);
        }
      }, (err) => {
        console.warn('Realtime SOS listener notice: ', err);
      });

      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      console.warn('Fallback to local SOS requests: ', e);
    }
  }, []);

  // Filtered SOS list based on category & timeframe
  const filteredSosList = useMemo(() => {
    const now = new Date('2026-09-24T23:59:59Z').getTime();
    const cutoff = now - (timeRangeDays * 24 * 60 * 60 * 1000);

    return sosList.filter(item => {
      // Time cut
      const itemTime = new Date(item.timestamp).getTime();
      if (itemTime < cutoff) return false;

      // Category filter
      if (selectedFilterCategory === 'todos') return true;
      return item.type.toLowerCase().includes(selectedFilterCategory.toLowerCase());
    });
  }, [sosList, selectedFilterCategory, timeRangeDays]);

  // Hourly Aggregation (00:00 to 23:00)
  const hourlyData: HourlyStat[] = useMemo(() => {
    const hours: HourlyStat[] = [];
    for (let h = 0; h < 24; h++) {
      hours.push({
        hour: h,
        label: `${String(h).padStart(2, '0')}h`,
        count: 0,
        types: {}
      });
    }

    filteredSosList.forEach(req => {
      try {
        const d = new Date(req.timestamp);
        const h = d.getUTCHours(); // Standardized UTC hour
        if (hours[h]) {
          hours[h].count += 1;
          const t = req.type.split('/')[0].trim();
          hours[h].types[t] = (hours[h].types[t] || 0) + 1;
        }
      } catch {}
    });

    return hours;
  }, [filteredSosList]);

  // Identify Peak Hours & Critical Metrics
  const peakAnalytics = useMemo(() => {
    let maxHour = 0;
    let maxCount = -1;
    let nightCount = 0; // 21h to 05h
    let morningCount = 0; // 06h to 11h
    let afternoonCount = 0; // 12h to 17h
    let eveningCount = 0; // 18h to 20h

    hourlyData.forEach(item => {
      if (item.count > maxCount) {
        maxCount = item.count;
        maxHour = item.hour;
      }
      if (item.hour >= 21 || item.hour <= 5) nightCount += item.count;
      else if (item.hour >= 6 && item.hour <= 11) morningCount += item.count;
      else if (item.hour >= 12 && item.hour <= 17) afternoonCount += item.count;
      else eveningCount += item.count;
    });

    const total = filteredSosList.length || 1;
    const nightPercent = Math.round((nightCount / total) * 100);

    // Most common breakdown overall
    const breakdownCounts: Record<string, number> = {};
    filteredSosList.forEach(r => {
      const cat = r.type.split('/')[0].trim();
      breakdownCounts[cat] = (breakdownCounts[cat] || 0) + 1;
    });
    const sortedBreakdowns = Object.entries(breakdownCounts).sort((a, b) => b[1] - a[1]);
    const topBreakdown = sortedBreakdowns[0] ? sortedBreakdowns[0][0] : 'Pane Geral';

    return {
      peakHour: maxHour,
      peakHourLabel: `${String(maxHour).padStart(2, '0')}:00 - ${String(maxHour + 1).padStart(2, '0')}:00`,
      peakCount: maxCount,
      nightPercent,
      nightCount,
      morningCount,
      afternoonCount,
      eveningCount,
      topBreakdown,
      avgEta: 21.4 // Average minutes to reach distress spot
    };
  }, [hourlyData, filteredSosList]);

  // Workforce Coverage Score Simulator
  const workforceScore = useMemo(() => {
    // Required minimum for critical peak night shift: 2 mechanics, 1 towing, 1 elec
    const idealMechanics = 3;
    const idealTowing = 2;
    const idealElec = 1;

    const mechRatio = Math.min(1, onDutyMechanics / idealMechanics);
    const towRatio = Math.min(1, onDutyTowingOperators / idealTowing);
    const elecRatio = Math.min(1, onDutyElectricians / idealElec);

    const score = Math.round((mechRatio * 0.45 + towRatio * 0.35 + elecRatio * 0.20) * 100);
    return score;
  }, [onDutyMechanics, onDutyTowingOperators, onDutyElectricians]);

  // Render D3 Visualization whenever activeVizMode or filtered data changes
  useEffect(() => {
    if (!svgRef.current || !svgContainerRef.current) return;

    const container = svgContainerRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = container.clientWidth || 700;
    const height = 280;
    const margin = { top: 35, right: 30, bottom: 45, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Define Gradients and Filters
    const defs = svg.append('defs');

    // Peak Red gradient
    const redGrad = defs.append('linearGradient')
      .attr('id', 'peakRedGrad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    redGrad.append('stop').attr('offset', '0%').attr('stop-color', '#EF4444').attr('stop-opacity', 0.95);
    redGrad.append('stop').attr('offset', '100%').attr('stop-color', '#991B1B').attr('stop-opacity', 0.7);

    // Warning Amber gradient
    const amberGrad = defs.append('linearGradient')
      .attr('id', 'peakAmberGrad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    amberGrad.append('stop').attr('offset', '0%').attr('stop-color', '#F59E0B').attr('stop-opacity', 0.95);
    amberGrad.append('stop').attr('offset', '100%').attr('stop-color', '#B45309').attr('stop-opacity', 0.7);

    // Normal Green/Cyan gradient
    const greenGrad = defs.append('linearGradient')
      .attr('id', 'normalGreenGrad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    greenGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10B981').attr('stop-opacity', 0.9);
    greenGrad.append('stop').attr('offset', '100%').attr('stop-color', '#047857').attr('stop-opacity', 0.6);

    // Spline curve gradient area
    const areaGrad = defs.append('linearGradient')
      .attr('id', 'splineAreaGrad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    areaGrad.append('stop').attr('offset', '0%').attr('stop-color', '#EF4444').attr('stop-opacity', 0.35);
    areaGrad.append('stop').attr('offset', '60%').attr('stop-color', '#F59E0B').attr('stop-opacity', 0.15);
    areaGrad.append('stop').attr('offset', '100%').attr('stop-color', '#FF8C00').attr('stop-opacity', 0.0);

    // MODE 1: 24-HOUR DISTRESS DISTRIBUTION (BARS + DENSITY SPLINE)
    if (activeVizMode === '24h') {
      const maxVal: number = Number(d3.max(hourlyData, (d: HourlyStat) => d.count) ?? 5);

      const xScale = d3.scaleBand()
        .domain(hourlyData.map(d => d.label))
        .range([0, innerWidth])
        .padding(0.25);

      const yScale = d3.scaleLinear()
        .domain([0, Math.ceil(maxVal * 1.2)])
        .nice()
        .range([innerHeight, 0]);

      // Background Night Risk Shading Zone (21h to 05h)
      // Zone 1: 21h-23h
      g.append('rect')
        .attr('x', xScale('21h') ?? 0)
        .attr('y', 0)
        .attr('width', innerWidth - (xScale('21h') ?? 0))
        .attr('height', innerHeight)
        .attr('fill', '#EF4444')
        .attr('opacity', 0.07);

      // Zone 2: 00h-05h
      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', (xScale('05h') ?? 0) + xScale.bandwidth())
        .attr('height', innerHeight)
        .attr('fill', '#EF4444')
        .attr('opacity', 0.07);

      // Risk zone label
      g.append('text')
        .attr('x', 8)
        .attr('y', 14)
        .attr('fill', '#EF4444')
        .attr('font-size', '9px')
        .attr('font-weight', '900')
        .attr('letter-spacing', '0.5px')
        .text('🚨 ZONA CRÍTICA NOTURNA (00h-05h)');

      g.append('text')
        .attr('x', innerWidth - 6)
        .attr('y', 14)
        .attr('fill', '#EF4444')
        .attr('font-size', '9px')
        .attr('font-weight', '900')
        .attr('text-anchor', 'end')
        .text('ZONA DE ALTO PÂNICO (21h-23h) ⚠️');

      // Gridlines
      const yGrid = d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-innerWidth)
        .tickFormat(() => '');

      g.append('g')
        .attr('class', 'grid')
        .call(yGrid)
        .selectAll('line')
        .attr('stroke', '#262626')
        .attr('stroke-dasharray', '3,3');

      g.select('.grid .domain').remove();

      // D3 Area & Line Spline Generator
      const areaGen = d3.area<HourlyStat>()
        .x((d: HourlyStat) => (xScale(d.label) ?? 0) + xScale.bandwidth() / 2)
        .y0(innerHeight)
        .y1((d: HourlyStat) => yScale(d.count))
        .curve(d3.curveMonotoneX);

      const lineGen = d3.line<HourlyStat>()
        .x((d: HourlyStat) => (xScale(d.label) ?? 0) + xScale.bandwidth() / 2)
        .y((d: HourlyStat) => yScale(d.count))
        .curve(d3.curveMonotoneX);

      // Render Area Spline
      g.append('path')
        .datum(hourlyData)
        .attr('fill', 'url(#splineAreaGrad)')
        .attr('d', areaGen);

      // Render D3 Bars with smooth transition
      const bars = g.selectAll<SVGRectElement, HourlyStat>('.bar')
        .data(hourlyData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d: HourlyStat) => xScale(d.label) ?? 0)
        .attr('width', xScale.bandwidth())
        .attr('y', innerHeight)
        .attr('height', 0)
        .attr('rx', 4)
        .attr('fill', (d: HourlyStat) => {
          if (d.count >= 4) return 'url(#peakRedGrad)';
          if (d.count >= 2) return 'url(#peakAmberGrad)';
          return 'url(#normalGreenGrad)';
        })
        .attr('stroke', (d: HourlyStat) => (d.count >= 4 ? '#F87171' : d.count >= 2 ? '#FBBF24' : '#34D399'))
        .attr('stroke-width', 0.8)
        .attr('cursor', 'pointer');

      // Animated transition on entrance
      bars.transition()
        .duration(700)
        .delay((_, i) => i * 20)
        .attr('y', (d: HourlyStat) => yScale(d.count))
        .attr('height', (d: HourlyStat) => Math.max(0, innerHeight - yScale(d.count)));

      // Render Spline Line over bars
      g.append('path')
        .datum(hourlyData)
        .attr('fill', 'none')
        .attr('stroke', '#FF8C00')
        .attr('stroke-width', 2.2)
        .attr('d', lineGen);

      // Interactive hover overlay targets
      g.selectAll<SVGRectElement, HourlyStat>('.hover-target')
        .data(hourlyData)
        .enter()
        .append('rect')
        .attr('class', 'hover-target')
        .attr('x', (d: HourlyStat) => xScale(d.label) ?? 0)
        .attr('y', 0)
        .attr('width', xScale.bandwidth())
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('mouseenter', (event, d: HourlyStat) => {
          setHoveredData({
            type: 'hour',
            hourLabel: d.label,
            count: d.count,
            types: d.types,
            isPeak: d.count >= 3,
            recommendedStaff: d.hour >= 21 || d.hour <= 5 
              ? 'Reforço Noturno: 2 Mecânicos + 1 Guincho de prontidão com viatura pronta'
              : d.hour >= 6 && d.hour <= 9
              ? 'Pico Matutino: 1 Mecânico + 2 no balcão de peças com abertura às 06h30'
              : 'Escala Normal de Pista e Oficina'
          });
        })
        .on('mouseleave', () => setHoveredData(null));

      // X Axis
      const xAxis = d3.axisBottom(xScale)
        .tickValues(hourlyData.filter((_, i) => i % 2 === 0).map(d => d.label));

      const gX = g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis);

      gX.selectAll('text')
        .attr('fill', '#9CA3AF')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold');

      gX.select('.domain').attr('stroke', '#374151');
      gX.selectAll('line').attr('stroke', '#374151');

      // Y Axis
      const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d3.format('d'));

      const gY = g.append('g').call(yAxis);
      gY.selectAll('text')
        .attr('fill', '#9CA3AF')
        .attr('font-size', '10px')
        .attr('font-mono', 'true');
      gY.select('.domain').attr('stroke', '#374151');
      gY.selectAll('line').attr('stroke', '#374151');

    } 
    // MODE 2: TIME-SERIES TIMELINE (DAYS OVER TIME)
    else if (activeVizMode === 'timeline') {
      // Group calls by calendar day
      const dayMap: Record<string, TimelineDayStat> = {};

      filteredSosList.forEach(item => {
        try {
          const d = new Date(item.timestamp);
          const key = d.toISOString().slice(0, 10);
          if (!dayMap[key]) {
            dayMap[key] = { date: new Date(key + 'T12:00:00Z'), dateStr: key, count: 0, breakdowns: {} };
          }
          dayMap[key].count += 1;
          const t = item.type.split('/')[0].trim();
          dayMap[key].breakdowns[t] = (dayMap[key].breakdowns[t] || 0) + 1;
        } catch {}
      });

      const timelineData: TimelineDayStat[] = Object.values(dayMap).sort((a, b) => a.date.getTime() - b.date.getTime());

      if (timelineData.length === 0) {
        g.append('text')
          .attr('x', innerWidth / 2)
          .attr('y', innerHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#6B7280')
          .attr('font-size', '12px')
          .text('Nenhum chamado de SOS registrado no período selecionado.');
        return;
      }

      const xExtent = d3.extent(timelineData, (d: TimelineDayStat) => d.date) as [Date, Date];
      const maxCount: number = Number(d3.max(timelineData, (d: TimelineDayStat) => d.count) ?? 4);

      const xScale = d3.scaleTime()
        .domain(xExtent)
        .range([0, innerWidth]);

      const yScale = d3.scaleLinear()
        .domain([0, Math.ceil(maxCount * 1.25)])
        .nice()
        .range([innerHeight, 0]);

      // Y Grid
      const yGrid = d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-innerWidth)
        .tickFormat(() => '');

      g.append('g')
        .attr('class', 'grid')
        .call(yGrid)
        .selectAll('line')
        .attr('stroke', '#262626')
        .attr('stroke-dasharray', '3,3');
      g.select('.grid .domain').remove();

      // Area and Line
      const areaGen = d3.area<TimelineDayStat>()
        .x((d: TimelineDayStat) => xScale(d.date))
        .y0(innerHeight)
        .y1((d: TimelineDayStat) => yScale(d.count))
        .curve(d3.curveMonotoneX);

      const lineGen = d3.line<TimelineDayStat>()
        .x((d: TimelineDayStat) => xScale(d.date))
        .y((d: TimelineDayStat) => yScale(d.count))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(timelineData)
        .attr('fill', 'url(#splineAreaGrad)')
        .attr('d', areaGen);

      g.append('path')
        .datum(timelineData)
        .attr('fill', 'none')
        .attr('stroke', '#EF4444')
        .attr('stroke-width', 2.5)
        .attr('d', lineGen);

      // Data Points
      g.selectAll<SVGCircleElement, TimelineDayStat>('.dot')
        .data(timelineData)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', (d: TimelineDayStat) => xScale(d.date))
        .attr('cy', (d: TimelineDayStat) => yScale(d.count))
        .attr('r', 4.5)
        .attr('fill', '#EF4444')
        .attr('stroke', '#1E1E1E')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .on('mouseenter', (event, d: TimelineDayStat) => {
          setHoveredData({
            type: 'date',
            dateStr: d.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            count: d.count,
            breakdowns: d.breakdowns,
            recommendedStaff: 'Demanda de apoio de frota para esta data'
          });
        })
        .on('mouseleave', () => setHoveredData(null));

      // X Axis
      const xAxis = d3.axisBottom(xScale)
        .ticks(Math.min(7, timelineData.length))
        .tickFormat(d => d3.timeFormat('%d/%m')(d as Date));

      const gX = g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis);
      gX.selectAll('text').attr('fill', '#9CA3AF').attr('font-size', '10px').attr('font-weight', 'bold');
      gX.select('.domain').attr('stroke', '#374151');

      // Y Axis
      const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('d'));
      const gY = g.append('g').call(yAxis);
      gY.selectAll('text').attr('fill', '#9CA3AF').attr('font-size', '10px');
      gY.select('.domain').attr('stroke', '#374151');

    }
    // MODE 3: SHIFT HEATMAP MATRIX (7 DAYS x 4 SHIFTS)
    else if (activeVizMode === 'heatmap') {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const shifts = [
        { id: 0, label: 'Madrugada (00h-06h)' },
        { id: 1, label: 'Manhã (06h-12h)' },
        { id: 2, label: 'Tarde (12h-18h)' },
        { id: 3, label: 'Noite (18h-24h)' },
      ];

      // Build matrix
      const matrix: MatrixCellStat[] = [];
      days.forEach((day, dIdx) => {
        shifts.forEach((shift, sIdx) => {
          matrix.push({ day, dayIdx: dIdx, shift: shift.label, shiftIdx: sIdx, count: 0 });
        });
      });

      filteredSosList.forEach(item => {
        try {
          const d = new Date(item.timestamp);
          const dayIdx = d.getUTCDay();
          const hour = d.getUTCHours();
          let sIdx = 0;
          if (hour >= 6 && hour < 12) sIdx = 1;
          else if (hour >= 12 && hour < 18) sIdx = 2;
          else if (hour >= 18) sIdx = 3;

          const cell = matrix.find(c => c.dayIdx === dayIdx && c.shiftIdx === sIdx);
          if (cell) cell.count += 1;
        } catch {}
      });

      const maxCount: number = Number(d3.max(matrix, (d: MatrixCellStat) => d.count) ?? 4);

      const xBand = d3.scaleBand()
        .domain(days)
        .range([0, innerWidth])
        .padding(0.08);

      const yBand = d3.scaleBand()
        .domain(shifts.map(s => s.label))
        .range([0, innerHeight])
        .padding(0.08);

      const colorScale = d3.scaleSequential()
        .domain([0, maxCount])
        .interpolator(d3.interpolateYlOrRd);

      // Render heatmap cells
      g.selectAll<SVGRectElement, MatrixCellStat>('.cell')
        .data(matrix)
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('x', (d: MatrixCellStat) => xBand(d.day) ?? 0)
        .attr('y', (d: MatrixCellStat) => yBand(d.shift) ?? 0)
        .attr('width', xBand.bandwidth())
        .attr('height', yBand.bandwidth())
        .attr('rx', 6)
        .attr('fill', (d: MatrixCellStat) => (d.count === 0 ? '#1F2937' : colorScale(d.count)))
        .attr('stroke', '#111827')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .on('mouseenter', (event, d: MatrixCellStat) => {
          setHoveredData({
            type: 'heatmap',
            day: d.day,
            shift: d.shift,
            count: d.count,
            recommendedStaff: d.shift.includes('Madrugada') 
              ? 'Plano Noturno: 2 Mecânicos + 1 Guincho' 
              : d.shift.includes('Noite') 
              ? 'Plano Noturno: 1 Eletricista + 1 Mecânico' 
              : 'Escala Normal de Atendimento'
          });
        })
        .on('mouseleave', () => setHoveredData(null));

      // Text labels inside cells
      g.selectAll<SVGTextElement, MatrixCellStat>('.cell-text')
        .data(matrix)
        .enter()
        .append('text')
        .attr('class', 'cell-text')
        .attr('x', (d: MatrixCellStat) => (xBand(d.day) ?? 0) + xBand.bandwidth() / 2)
        .attr('y', (d: MatrixCellStat) => (yBand(d.shift) ?? 0) + yBand.bandwidth() / 2 + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', (d: MatrixCellStat) => (d.count > maxCount * 0.5 ? '#000' : '#E5E7EB'))
        .attr('font-size', '11px')
        .attr('font-weight', '900')
        .attr('pointer-events', 'none')
        .text((d: MatrixCellStat) => d.count);

      // Axes for heatmap
      const xAxis = d3.axisBottom(xBand);
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .attr('fill', '#9CA3AF')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold');

      const yAxis = d3.axisLeft(yBand);
      g.append('g')
        .call(yAxis)
        .selectAll('text')
        .attr('fill', '#9CA3AF')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold');
    }

  }, [activeVizMode, hourlyData, filteredSosList]);

  // Handler to inject a live simulated SOS distress event
  const handleSimulateNewDistressCall = () => {
    const emergencyTypes = [
      'Pneu Furado / Estourado', 
      'Necessito de Guincho Pesado', 
      'Problema Elétrico / Bateria', 
      'Pane Mecânica / Motor', 
      'Falta de Freio / Compressor'
    ];
    const pickedType = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
    const highways = ['Rod. Presidente Dutra', 'Rod. Anhanguera', 'Rod. dos Bandeirantes', 'Rod. Washington Luís'];
    const pickedHighway = highways[Math.floor(Math.random() * highways.length)];

    const newReq: SOSRequest = {
      id: `sos_live_${Date.now()}`,
      type: pickedType,
      description: `Chamado simulado de emergência em tempo real para teste de escala e dimensionamento.`,
      status: 'searching',
      matchedSupplierId: supplier?.id || 's1',
      matchedSupplierName: supplier?.name || companyName,
      etaMinutes: Math.floor(Math.random() * 15) + 12,
      timestamp: new Date().toISOString(),
      highway: `${pickedHighway}, KM ${Math.floor(Math.random() * 200) + 20}`,
      km: Math.floor(Math.random() * 200) + 20,
      driverName: 'Motorista de Teste na Rota',
      truckModel: 'Scania R450 6x2',
      responseTimeMinutes: 18
    };

    const updated = [newReq, ...sosList];
    setSosList(updated);
    saveSOSRequests(updated);

    setSimulationAlert(`🚨 Chamado SOS Simulado Disparado (${pickedType}) às ${new Date().toLocaleTimeString('pt-BR')}. D3 atualizado!`);
    setTimeout(() => setSimulationAlert(null), 5000);
  };

  return (
    <div id="sos-workforce-d3-section" className="space-y-6">
      
      {/* Section Header with Distress Badge */}
      <div className="bg-gradient-to-r from-red-950/60 via-[#181818] to-[#181818] border border-red-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldAlert size={120} className="text-red-500" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-500 animate-pulse fill-red-500" />
                <span>Módulo D3 - Inteligência de Socorro & Plantão</span>
              </span>
              <span className="text-slate-500 text-xs font-mono">v4.2</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1.5 flex items-center gap-2">
              <span>Frequência de Chamados SOS & Planejamento de Escala</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Mapeamento estatístico da frequência de emergências na rodovia ao longo do tempo. Identifique os horários de maior sinistro para dimensionar mecânicos, guinchos e eletricistas com máxima rentabilidade e menor tempo de resposta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleSimulateNewDistressCall}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-red-600/25 cursor-pointer"
              title="Disparar novo sinistro para testar atualização em tempo real do gráfico D3"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Simular Chamado SOS</span>
            </button>
          </div>
        </div>

        {simulationAlert && (
          <div className="mt-3 p-3 bg-red-600/20 border border-red-500/40 rounded-xl text-red-300 text-xs font-bold animate-pulse flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{simulationAlert}</span>
          </div>
        )}
      </div>

      {/* Distress & Peak Metrics Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" id="sos-peak-metrics-cards">
        <div className="bg-[#181818] border border-neutral-800 p-4 rounded-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Pico Crítico (Horário)</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-black text-red-400">{peakAnalytics.peakHourLabel}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Concentra <strong>{peakAnalytics.peakCount} chamados</strong> no período analisado
            </p>
          </div>
          <div className="text-[9px] text-red-400/90 font-bold bg-red-950/40 px-2 py-0.5 rounded border border-red-900/40">
            🚨 Turno de Prontidão Máxima
          </div>
        </div>

        <div className="bg-[#181818] border border-neutral-800 p-4 rounded-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Concentração Noturna</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-black text-amber-400">{peakAnalytics.nightPercent}%</div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Sinistros ocorrem entre <strong>21h00 e 05h00</strong>
            </p>
          </div>
          <div className="text-[9px] text-amber-400/90 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
            ⚠️ Oportunidade de Tarifação de Plantão
          </div>
        </div>

        <div className="bg-[#181818] border border-neutral-800 p-4 rounded-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Sinistro Predominante</span>
            <Wrench className="w-4 h-4 text-[#FF8C00]" />
          </div>
          <div>
            <div className="text-lg md:text-xl font-black text-white truncate">{peakAnalytics.topBreakdown}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Maior volume de peças demandadas na pista
            </p>
          </div>
          <div className="text-[9px] text-[#FF8C00] font-bold bg-orange-950/40 px-2 py-0.5 rounded border border-orange-900/40">
            📦 Manter estoque no furgão móvel
          </div>
        </div>

        <div className="bg-[#181818] border border-neutral-800 p-4 rounded-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total de Chamados SOS</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-black text-emerald-400">{filteredSosList.length}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Tempo médio de chegada: <strong>~{peakAnalytics.avgEta} min</strong>
            </p>
          </div>
          <div className="text-[9px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
            ⚡ Resposta rápida na Dutra/Anhanguera
          </div>
        </div>
      </div>

      {/* D3 Chart Master Card */}
      <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
        
        {/* Controls: Mode Switcher & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          
          {/* Viz Mode Tabs */}
          <div className="flex bg-[#121212] p-1 rounded-xl border border-neutral-800 self-start md:self-auto">
            <button
              onClick={() => setActiveVizMode('24h')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeVizMode === '24h'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Distribuição 24 Horas</span>
            </button>

            <button
              onClick={() => setActiveVizMode('timeline')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeVizMode === 'timeline'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Linha do Tempo (Dias)</span>
            </button>

            <button
              onClick={() => setActiveVizMode('heatmap')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeVizMode === 'heatmap'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Matriz de Calor (Turnos)</span>
            </button>
          </div>

          {/* Time range & category filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 bg-[#121212] p-1 rounded-lg border border-neutral-800 text-[10px] font-bold">
              {[
                { val: 7, label: '7D' },
                { val: 30, label: '30D' },
                { val: 90, label: '90D' }
              ].map(t => (
                <button
                  key={t.val}
                  onClick={() => setTimeRangeDays(t.val)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    timeRangeDays === t.val ? 'bg-[#FF8C00] text-black font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Category Select */}
            <select
              value={selectedFilterCategory}
              onChange={(e) => setSelectedFilterCategory(e.target.value)}
              className="bg-[#121212] border border-neutral-800 text-xs text-slate-200 py-1.5 px-3 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="todos">Todos os Sinistros</option>
              <option value="Pneu">Pneus / Borracharia</option>
              <option value="Guincho">Guincho Pesado</option>
              <option value="Elétrico">Elétrica / Baterias</option>
              <option value="Mecânica">Mecânica / Motor</option>
              <option value="Freio">Freios & Ar</option>
            </select>
          </div>
        </div>

        {/* Dynamic D3 SVG Container */}
        <div ref={svgContainerRef} className="w-full relative min-h-[290px] bg-[#121212] rounded-xl border border-neutral-850 p-2 overflow-hidden">
          <svg ref={svgRef} className="w-full h-72 block"></svg>

          {/* Floating Hover Information Tooltip */}
          {hoveredData && (
            <div className="absolute top-3 right-4 bg-black/95 text-slate-100 border border-neutral-700 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs z-20 max-w-xs animate-fadeIn space-y-1.5 pointer-events-none">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                <span className="font-black text-red-400 uppercase text-[10px] tracking-wider">
                  {hoveredData.type === 'hour' && `Janela: ${hoveredData.hourLabel}`}
                  {hoveredData.type === 'date' && `Data: ${hoveredData.dateStr}`}
                  {hoveredData.type === 'heatmap' && `${hoveredData.day} - ${hoveredData.shift}`}
                </span>
                <span className="bg-red-500/20 text-red-400 font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                  {hoveredData.count} Chamado(s)
                </span>
              </div>

              {hoveredData.types && Object.keys(hoveredData.types).length > 0 && (
                <div className="text-[10px] text-slate-300">
                  <span className="font-bold text-slate-400">Distribuição:</span>{' '}
                  {Object.entries(hoveredData.types).map(([k, v]) => `${k} (${v})`).join(', ')}
                </div>
              )}

              <div className="pt-1 text-[10px] text-amber-300 font-medium">
                💡 <strong>Ação de Escala:</strong> {hoveredData.recommendedStaff}
              </div>
            </div>
          )}
        </div>

        {/* Legend bar */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 gap-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-red-500 inline-block" />
              <span>Pico Crítico (≥ 4 chamados)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
              <span>Atenção Moderada (2-3)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span>Demanda Baixa (0-1)</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Renderizado via D3.js v7</span>
        </div>
      </div>

      {/* Workforce Planning & Shift Roster Optimizer */}
      <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-5 space-y-5 shadow-xl" id="workforce-planning-recommendations">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF8C00]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Planejamento e Dimensionamento de Equipe</h3>
              <p className="text-xs text-slate-400">Sugestões de escala calculadas a partir dos picos de chamados SOS</p>
            </div>
          </div>

          {/* Readiness Score Pill */}
          <div className="bg-[#121212] border border-neutral-800 px-4 py-2 rounded-xl flex items-center space-x-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Índice de Prontidão</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{workforceScore}%</span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* 4 Shift Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Shift 1: Madrugada */}
          <div className="bg-[#141414] border border-red-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-600/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">1. Madrugada</span>
                <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  Pico Severo
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 block mb-2 font-bold">00:00 às 06:00</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sinistros críticos em acostamento escuro. Alta demanda por <strong>Guinchos Pesados</strong> e <strong>Troca de Pneus</strong>.
              </p>
            </div>
            <div className="bg-[#1C1C1C] p-2.5 rounded-lg border border-neutral-800 text-[11px] space-y-1">
              <span className="text-[10px] text-red-400 font-black uppercase block">Equipe Sugerida:</span>
              <p className="text-slate-300">🛡️ <strong>2 Mecânicos</strong> Socorristas</p>
              <p className="text-slate-300">🚛 <strong>1 Operador</strong> de Guincho</p>
              <p className="text-slate-300">⚡ <strong>1 Eletricista</strong> de sobreaviso</p>
            </div>
          </div>

          {/* Shift 2: Manhã */}
          <div className="bg-[#141414] border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">2. Manhã</span>
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  Saída de Frotas
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 block mb-2 font-bold">06:00 às 12:00</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Partida de comboios dos postos de abastecimento. Frequência de <strong>Superaquecimento</strong> e <strong>Freios</strong>.
              </p>
            </div>
            <div className="bg-[#1C1C1C] p-2.5 rounded-lg border border-neutral-800 text-[11px] space-y-1">
              <span className="text-[10px] text-amber-400 font-black uppercase block">Equipe Sugerida:</span>
              <p className="text-slate-300">🔧 <strong>1 Mecânico</strong> de Pista Móvel</p>
              <p className="text-slate-300">📦 <strong>2 Consultores</strong> Balcão de Peças</p>
              <p className="text-slate-300">🕒 Abertura antecipada às 06h30</p>
            </div>
          </div>

          {/* Shift 3: Tarde */}
          <div className="bg-[#141414] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">3. Tarde</span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  Fluxo Estável
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 block mb-2 font-bold">12:00 às 18:00</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Menor incidência de panes repentinas na rodovia. Período propício para <strong>revisões programadas</strong> e expedição.
              </p>
            </div>
            <div className="bg-[#1C1C1C] p-2.5 rounded-lg border border-neutral-800 text-[11px] space-y-1">
              <span className="text-[10px] text-emerald-400 font-black uppercase block">Equipe Sugerida:</span>
              <p className="text-slate-300">⚙️ Foco na oficina central e estoque</p>
              <p className="text-slate-300">🚚 Expedição de peças para a rota</p>
            </div>
          </div>

          {/* Shift 4: Noite */}
          <div className="bg-[#141414] border border-orange-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">4. Noite</span>
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  Aumento Noturno
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 block mb-2 font-bold">18:00 às 24:00</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Chegada aos pátios de carga. Pico de <strong>falhas de alternador, lâmpadas e iluminação da carreta</strong>.
              </p>
            </div>
            <div className="bg-[#1C1C1C] p-2.5 rounded-lg border border-neutral-800 text-[11px] space-y-1">
              <span className="text-[10px] text-[#FF8C00] font-black uppercase block">Equipe Sugerida:</span>
              <p className="text-slate-300">⚡ <strong>1 Eletricista</strong> Automotivo</p>
              <p className="text-slate-300">🛞 <strong>1 Borracheiro</strong> de Plantão</p>
            </div>
          </div>

        </div>

        {/* Interactive Shift Roster Simulator Slider */}
        <div className="bg-[#141414] border border-neutral-850 p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Simulador de Dimensionamento da Próxima Escala</h4>
              <p className="text-[11px] text-slate-400">Ajuste os profissionais alocados para verificar se a cobertura atende a demanda histórica</p>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono">
              Capacidade: {onDutyMechanics + onDutyTowingOperators + onDutyElectricians} profissionais ativos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            <div className="space-y-2 bg-[#1C1C1C] p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-300">Mecânicos de Plantão:</span>
                <span className="text-sm font-black text-[#FF8C00]">{onDutyMechanics}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnDutyMechanics(Math.max(1, onDutyMechanics - 1))}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={onDutyMechanics}
                  onChange={(e) => setOnDutyMechanics(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <button
                  onClick={() => setOnDutyMechanics(Math.min(6, onDutyMechanics + 1))}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2 bg-[#1C1C1C] p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-300">Operadores de Guincho:</span>
                <span className="text-sm font-black text-red-400">{onDutyTowingOperators}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnDutyTowingOperators(Math.max(0, onDutyTowingOperators - 1))}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={onDutyTowingOperators}
                  onChange={(e) => setOnDutyTowingOperators(Number(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
                <button
                  onClick={() => setOnDutyTowingOperators(Math.min(4, onDutyTowingOperators + 1))}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2 bg-[#1C1C1C] p-3 rounded-xl border border-neutral-800">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-300">Eletricistas Automotivos:</span>
                <span className="text-sm font-black text-amber-400">{onDutyElectricians}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnDutyElectricians(Math.max(0, onDutyElectricians - 1))}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={onDutyElectricians}
                  onChange={(e) => setOnDutyElectricians(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <button
                  onClick={() => setOnDutyElectricians(Math.min(3, onDutyElectricians + 1))}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-850 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className={`w-4 h-4 ${workforceScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-slate-300 font-medium">
                {workforceScore >= 90 && 'Excelente! Cobertura completa para absorver os picos noturnos sem fila de espera.'}
                {workforceScore >= 70 && workforceScore < 90 && 'Adequado. Risco moderado de sobrecarga se houver 3 chamados simultâneos de guincho.'}
                {workforceScore < 70 && 'Alerta de Subdimensionamento. Risco alto de perder chamados na madrugada por falta de viatura pronta.'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono shrink-0">SLA Previsto: {workforceScore >= 80 ? '< 20 min' : '~40 min'}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
