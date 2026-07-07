/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Compass, Shield, ZoomIn, Eye } from 'lucide-react';
import { Supplier } from '../types';

interface CoverageMapProps {
  suppliers: Supplier[];
  selectedCategory: string;
  onSelectSupplier: (supplier: Supplier) => void;
  activeSupplierId?: string;
  searchRadius?: number;
}

// Preset coordinate coordinates for default suppliers to align with their actual rodovias / distances
const SUPPLIER_PRESE_COORDS: Record<string, { x: number; y: number; label: string }> = {
  s1: { x: 74, y: 38, label: 'KM 221 - Rod. Pres. Dutra' },       // Tietê Diesel Autopeças: 4.8 km to NE
  s2: { x: 26, y: 28, label: 'KM 98 - Rod. Anhanguera' },       // Mecânica Diesel: 12.3 km to NW
  s3: { x: 20, y: 78, label: 'KM 72 - BR-116 Sul' },            // Posto da Serra: 18.5 km to SW
  s4: { x: 44, y: 46, label: 'KM 300 - Rod. Washington Luís' }, // Borracharia: 2.1 km to NW (very close)
  s5: { x: 82, y: 64, label: 'KM 45 - Rod. dos Bandeirantes' },  // Auto Elétrica: 25.1 km to SE
};

export default function CoverageMap({
  suppliers,
  selectedCategory,
  onSelectSupplier,
  activeSupplierId,
  searchRadius,
}: CoverageMapProps) {
  const [hoveredSupplier, setHoveredSupplier] = useState<Supplier | null>(null);
  const [mapScale, setMapScale] = useState<number>(1);

  // Getter helper computing coords dynamically (robust fallback for new user-inserted suppliers)
  const getCoordinates = (supplier: Supplier) => {
    if (SUPPLIER_PRESE_COORDS[supplier.id]) {
      return SUPPLIER_PRESE_COORDS[supplier.id];
    }
    // Deterministic fallback based on ID and distance to keep it static on re-renders
    const idNum = supplier.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const angle = (idNum + Math.round(supplier.distance * 15)) % 360;
    const rad = (angle * Math.PI) / 180;
    
    // Scale distance (0 to 35km mapped to radius 12% to 45%)
    const maxDist = 35;
    const distanceRatio = Math.min(supplier.distance, maxDist) / maxDist;
    const r = 12 + distanceRatio * 32; // stay within the bounds of the map container
    
    const x = 50 + r * Math.cos(rad);
    const y = 50 + r * Math.sin(rad);
    
    return { 
      x: Math.min(Math.max(x, 10), 90), 
      y: Math.min(Math.max(y, 10), 90), 
      label: `~${supplier.distance} km de distância` 
    };
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'pecas': return '⚙️';
      case 'mecanica': return '🔧';
      case 'postos': return '⛽';
      case 'pneus': return '🛞';
      case 'socorro': return '🚨';
      default: return '📍';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pecas': return 'text-[#FF8C00] fill-[#FF8C00]/20';
      case 'mecanica': return 'text-amber-400 fill-amber-400/20';
      case 'postos': return 'text-sky-400 fill-sky-400/20';
      case 'pneus': return 'text-emerald-400 fill-emerald-400/20';
      case 'socorro': return 'text-red-500 fill-red-500/20';
      default: return 'text-orange-500 fill-orange-500/20';
    }
  };

  return (
    <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-4 md:p-5 shadow-xl transition-all relative overflow-hidden" id="interactive-coverage-map">
      {/* Map Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-neutral-800 pb-3">
        <div>
          <span className="text-[10px] text-[#FF8C00] font-black uppercase tracking-widest flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            Radar de Cobertura em Tempo Real
          </span>
          <h3 className="text-white font-black text-sm md:text-base tracking-tight flex items-center gap-1.5 mt-0.5">
            <span>Seu Trecho: Rodovia BR-116, SP</span>
            <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sinal Ativo</span>
            </span>
          </h3>
        </div>
        
        {/* Legends */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-1 text-[9px] text-slate-400">
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-[#FF8C00] rounded-full inline-block" /> Peças</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" /> Mecânica</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-sky-400 rounded-full inline-block" /> Postos</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" /> Pneus</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" /> Socorro</span>
        </div>
      </div>

      {/* SVG Interactive Map Container */}
      <div className="relative w-full aspect-[16/10] md:aspect-[16/8] bg-[#0E0E0E] rounded-xl border border-neutral-850 overflow-hidden select-none">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(#FF8C00 0.75px, transparent 0.75px), radial-gradient(#FF8C00 0.75px, #0E0E0E 0.75px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px'
        }} />

        {/* Tactical UI Corners */}
        <div className="absolute top-2 left-2 flex items-center space-x-1 border border-neutral-800/80 bg-black/70 px-2 py-1 rounded text-[8px] font-mono text-slate-500">
          <Shield className="w-2.5 h-2.5 text-amber-500" />
          <span>SISTEMA DE MONITORAMENTO IMPÉRIO</span>
        </div>
        <div className="absolute bottom-2 right-2 border border-neutral-800/80 bg-black/70 px-2 py-1 rounded text-[8px] font-mono text-slate-500">
          <span>LAT: -23.5505 | LNG: -46.6333</span>
        </div>

        {/* Map SVG Canvas */}
        <svg 
          viewBox="0 0 100 50" 
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${mapScale})` }}
        >
          {/* Definitions for map effects */}
          <defs>
            <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF8C00" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FF8C00" stopOpacity="0" />
            </radialGradient>
            
            <radialGradient id="emergency-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Large sweep radar rings around driver */}
          <circle cx="50" cy="25" r="8" fill="url(#radar-glow)" stroke="#FF8C00" strokeWidth="0.05" strokeDasharray="0.3, 0.3" className="pointer-events-none" />
          <circle cx="50" cy="25" r="16" fill="none" stroke="#FF8C00" strokeWidth="0.04" strokeDasharray="0.5, 0.5" className="pointer-events-none" />
          <circle cx="50" cy="25" r="28" fill="none" stroke="#FF8C00" strokeWidth="0.03" strokeDasharray="1, 1" className="pointer-events-none" />

          {/* Rodovia Lines (Styled as elegant wireframes representing SP main roads) */}
          {/* 1. BR-116 Presidente Dutra / Régis Bittencourt (Diagonal SW to NE) */}
          <path 
            d="M 5,45 Q 35,30 50,25 T 95,5" 
            fill="none" 
            stroke="#262626" 
            strokeWidth="0.5" 
            strokeLinecap="round"
            className="pointer-events-none"
          />
          <path 
            d="M 5,45 Q 35,30 50,25 T 95,5" 
            fill="none" 
            stroke="#111111" 
            strokeWidth="0.1" 
            strokeLinecap="round"
            className="pointer-events-none"
          />
          <text x="25" y="36.5" fill="#3D3D3D" fontSize="0.9" fontWeight="900" transform="rotate(-15, 25, 36.5)" className="font-mono select-none">BR-116 (PRES. DUTRA)</text>
          
          {/* 2. Rodovia Anhanguera (From top-left towards center-south) */}
          <path 
            d="M 12,5 Q 38,18 50,25 T 80,48" 
            fill="none" 
            stroke="#202020" 
            strokeWidth="0.4" 
            strokeLinecap="round"
            className="pointer-events-none"
          />
          <text x="75" y="44" fill="#313131" fontSize="0.9" fontWeight="900" transform="rotate(35, 75, 44)" className="font-mono select-none">ROD. ANHANGUERA</text>

          {/* 3. Rodovia dos Bandeirantes (Runs parallel to Anhanguera) */}
          <path 
            d="M 22,5 Q 44,20 50,25 T 88,48" 
            fill="none" 
            stroke="#1B1B1B" 
            strokeWidth="0.3" 
            strokeLinecap="round"
            strokeDasharray="1, 0.4"
            className="pointer-events-none"
          />
          <text x="56" y="29.5" fill="#2C2C2C" fontSize="0.7" fontWeight="bold" transform="rotate(34, 56, 29.5)" className="font-mono select-none">ROD. BANDEIRANTES</text>

          {/* Interactive supplier nodes */}
          {suppliers.map((supplier) => {
            const { x, y, label } = getCoordinates(supplier);
            
            // Normalize coordinates for the svg viewBox aspect 100 x 50 (input coords run 0-100 x 0-100, so compress y to 0-50 range)
            const mapX = x;
            const mapY = (y / 100) * 50;
            
            const isTargeted = (() => {
              if (searchRadius !== undefined && supplier.distance > searchRadius) return false;
              if (selectedCategory === 'todos') return true;
              if (selectedCategory === 'eletrica') {
                return supplier.category === 'socorro' || 
                       supplier.name.toLowerCase().includes('elétrica') || 
                       supplier.specialty.toLowerCase().includes('elétrica') || 
                       supplier.specialty.toLowerCase().includes('bateria');
              }
              if (selectedCategory === 'guincho') {
                return supplier.category === 'socorro' || 
                       supplier.name.toLowerCase().includes('guincho') || 
                       supplier.specialty.toLowerCase().includes('guincho');
              }
              return supplier.category === selectedCategory;
            })();
            const isActive = activeSupplierId === supplier.id;
            const isHovered = hoveredSupplier?.id === supplier.id;
            const markerColor = getCategoryColor(supplier.category);
            
            return (
              <g 
                key={supplier.id}
                onClick={() => onSelectSupplier(supplier)}
                onMouseEnter={() => setHoveredSupplier(supplier)}
                onMouseLeave={() => setHoveredSupplier(null)}
                className="cursor-pointer group"
                style={{ opacity: isTargeted ? 1 : 0.25, transition: 'opacity 0.3s ease' }}
              >
                {/* Active node glow ripple effect */}
                {isActive && (
                  <circle 
                    cx={mapX} 
                    cy={mapY} 
                    r="2.5" 
                    fill="none" 
                    stroke="#FF8C00" 
                    strokeWidth="0.1" 
                    className="animate-pulse"
                  />
                )}

                {/* Slight hover bubble visual */}
                {isHovered && (
                  <circle 
                    cx={mapX} 
                    cy={mapY} 
                    r="2.2" 
                    fill="none" 
                    stroke="#FFFFFF" 
                    strokeWidth="0.08" 
                  />
                )}

                {/* SVG Marker Pin Wrapper */}
                <circle 
                  cx={mapX} 
                  cy={mapY} 
                  r="1.4" 
                  className={`transition-all duration-300 stroke-[#121212] stroke-[0.15] ${markerColor} ${
                    isActive ? 'scale-125' : 'group-hover:scale-110'
                  }`}
                />

                {/* Floating miniature category emoji on map */}
                <text 
                  x={mapX} 
                  y={mapY + 0.4} 
                  fontSize="1.1" 
                  textAnchor="middle" 
                  className="pointer-events-none select-none select-none-all font-sans"
                >
                  {getCategoryEmoji(supplier.category)}
                </text>

                {/* Micro Label under the category pin */}
                <text
                  x={mapX}
                  y={mapY + 2.2}
                  fontSize="0.6"
                  fontWeight="bold"
                  fill={isActive ? '#FF8C00' : isHovered ? '#FFFFFF' : '#888888'}
                  textAnchor="middle"
                  className="font-mono pointer-events-none select-none transition-colors"
                >
                  {supplier.name.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* DRIVER / TRUCKER AT CENTER NODE */}
          <g>
            {/* Pulsing radar ripple centered on driver */}
            <circle cx="50" cy="25" r="1.8" fill="none" stroke="#FF8C00" strokeWidth="0.1" className="animate-ping" style={{ transformOrigin: '50px 25px' }} />
            <circle cx="50" cy="25" r="1" fill="#FF8C00" stroke="#FFFFFF" strokeWidth="0.15" />
            
            {/* Center truck representation */}
            <path 
              d="M 49.3,24 L 50.7,24 L 50.7,25.5 L 49.3,25.5 Z" 
              fill="#000000" 
              className="pointer-events-none"
            />
            
            {/* Glowing Crown on pilot client locator */}
            <polygon 
              points="49,23.3 49.5,23.8 50,23.1 50.5,23.8 51,23.3 50.7,24 49.3,24" 
              fill="#F97316" 
              className="pointer-events-none"
            />
            
            <text 
              x="50" 
              y="22.2" 
              fontSize="0.7" 
              fontWeight="900" 
              fill="#FF8C00" 
              textAnchor="middle" 
              className="font-mono tracking-wider pointer-events-none select-none"
            >
              VOCÊ (Carga)
            </text>
          </g>
        </svg>

        {/* Hover / Highlight Supplier Card Overlay in the SVG corner */}
        {hoveredSupplier && (
          <div className="absolute top-2 right-2 bg-black/90 border border-neutral-800 p-2.5 rounded-lg max-w-[200px] shadow-xl text-left backdrop-blur-md animate-fade-in pointer-events-none z-10 transition-all">
            <span className="text-[8px] uppercase font-black text-[#FF8C00] tracking-wider block">
              {getCategoryEmoji(hoveredSupplier.category)} {hoveredSupplier.category.toUpperCase()}
            </span>
            <h4 className="text-white text-xs font-black truncate leading-tight mt-0.5">{hoveredSupplier.name}</h4>
            <p className="text-[10px] text-slate-400 mt-1 lines-clamp-1 truncate">{hoveredSupplier.specialty}</p>
            <div className="flex items-center justify-between text-[9px] mt-1.5 pt-1.5 border-t border-neutral-900 font-mono">
              <span className="text-[#FF8C00] font-bold">KM {hoveredSupplier.distance}</span>
              <span className="text-slate-500">Clique para Orçar</span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Mini Status and Helper Message beneath map */}
      <div className="mt-3 flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-2 text-slate-400 font-medium">
          <MapPin className="w-4 h-4 text-orange-500 animate-bounce shrink-0" />
          <span>
            Selecione qualquer fornecedor no mapa clicando no marcador para abrir a <strong className="text-slate-200">ficha técnica</strong> e iniciar comunicação do app.
          </span>
        </div>
        
        {/* Zoom scale / Control Buttons demo */}
        <div className="flex items-center space-x-1 font-bold">
          <button 
            type="button"
            onClick={() => setMapScale(s => s === 1 ? 1.4 : s === 1.4 ? 1.8 : 1)}
            className="bg-[#1A1A1A] hover:bg-neutral-800 border border-neutral-800 text-[10px] text-slate-300 font-black px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5 text-[#FF8C00]" />
            <span>Escala Radar (x{mapScale})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
