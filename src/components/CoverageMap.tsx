/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Compass, Shield, ZoomIn, Eye, Map as MapIcon, Layers, ExternalLink, HelpCircle } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Supplier } from '../types';

interface CoverageMapProps {
  suppliers: Supplier[];
  selectedCategory: string;
  onSelectSupplier: (supplier: Supplier) => void;
  activeSupplierId?: string;
  searchRadius?: number;
}

// Preset coordinate coordinates for default suppliers to align with their actual rodovias / distances
const SUPPLIER_PRESET_COORDS: Record<string, { x: number; y: number; label: string }> = {
  s1: { x: 74, y: 38, label: 'KM 221 - Rod. Pres. Dutra' },       // Tietê Diesel Autopeças: 4.8 km to NE
  s2: { x: 26, y: 28, label: 'KM 98 - Rod. Anhanguera' },       // Mecânica Diesel: 12.3 km to NW
  s3: { x: 20, y: 78, label: 'KM 72 - BR-116 Sul' },            // Posto da Serra: 18.5 km to SW
  s4: { x: 44, y: 46, label: 'KM 300 - Rod. Washington Luís' }, // Borracharia: 2.1 km to NW (very close)
  s5: { x: 82, y: 64, label: 'KM 45 - Rod. dos Bandeirantes' },  // Auto Elétrica: 25.1 km to SE
};

// Real-world coordinates mapping for Google Maps around Sao Paulo / Dutra BR-116 area
const CENTER_COORD = { lat: -23.5000, lng: -46.5800 }; // Centered around Guarulhos / SP (Rod. Dutra)

const SUPPLIER_MAP_COORDS: Record<string, { lat: number; lng: number }> = {
  s1: { lat: -23.4750, lng: -46.5500 }, // Tietê Diesel (Dutra KM 221)
  s2: { lat: -23.4200, lng: -46.6500 }, // Mecânica Diesel Express (Anhanguera KM 98)
  s3: { lat: -23.6300, lng: -46.7200 }, // Posto da Serra (BR-116 KM 72)
  s4: { lat: -23.5150, lng: -46.5950 }, // Borracharia KM 300
  s5: { lat: -23.3600, lng: -46.4200 }, // Auto Elétrica Bandeirantes
};

// Read Google Maps API Key from injected Vite configuration environment
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY !== '';

export default function CoverageMap({
  suppliers,
  selectedCategory,
  onSelectSupplier,
  activeSupplierId,
  searchRadius = 50,
}: CoverageMapProps) {
  const [hoveredSupplier, setHoveredSupplier] = useState<Supplier | null>(null);
  const [mapScale, setMapScale] = useState<number>(1);
  const [mapMode, setMapMode] = useState<'radar' | 'google'>('radar');
  const [selectedGoogleSupplier, setSelectedGoogleSupplier] = useState<Supplier | null>(null);
  const [showKeyHelp, setShowKeyHelp] = useState<boolean>(false);

  // Getter helper computing coords dynamically (robust fallback for new user-inserted suppliers)
  const getCoordinates = (supplier: Supplier) => {
    if (SUPPLIER_PRESET_COORDS[supplier.id]) {
      return SUPPLIER_PRESET_COORDS[supplier.id];
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

  // Google Map coords dynamic resolver (robust fallback)
  const getGoogleCoords = (supplier: Supplier) => {
    if (SUPPLIER_MAP_COORDS[supplier.id]) {
      return SUPPLIER_MAP_COORDS[supplier.id];
    }
    // Deterministic offset relative to center coordinates
    const idNum = supplier.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const angle = (idNum + Math.round(supplier.distance * 10)) % 360;
    const rad = (angle * Math.PI) / 180;
    
    // Approx 1km = 0.009 degrees of lat/lng
    const offset = supplier.distance * 0.009;
    const lat = CENTER_COORD.lat + offset * Math.sin(rad);
    const lng = CENTER_COORD.lng + offset * Math.cos(rad);

    return { lat, lng };
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

  const getCategoryHexColor = (category: string) => {
    switch (category) {
      case 'pecas': return '#FF8C00';
      case 'mecanica': return '#FBBF24';
      case 'postos': return '#38BDF8';
      case 'pneus': return '#34D399';
      case 'socorro': return '#EF4444';
      default: return '#F97316';
    }
  };

  // Filter suppliers by category and distance to render on map correctly
  const getIsSupplierVisible = (supplier: Supplier) => {
    if (supplier.distance > searchRadius) return false;
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
  };

  return (
    <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-4 md:p-5 shadow-xl transition-all relative overflow-hidden" id="interactive-coverage-map">
      
      {/* Map Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-neutral-800 pb-3">
        <div>
          <span className="text-[10px] text-[#FF8C00] font-black uppercase tracking-widest flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 animate-spin-slow text-[#FF8C00]" />
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

        {/* View Mode Switcher and Legends */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Map Mode Selector Tabs */}
          <div className="bg-black/40 border border-neutral-800 p-0.5 rounded-xl flex items-center shadow-sm">
            <button
              type="button"
              onClick={() => {
                setMapMode('radar');
                setSelectedGoogleSupplier(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                mapMode === 'radar' 
                  ? 'bg-[#FF8C00] text-black font-black' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Radar Tático</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMapMode('google');
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                mapMode === 'google' 
                  ? 'bg-[#FF8C00] text-black font-black' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3 h-3" />
              <span>Mapa Real</span>
            </button>
          </div>

          {/* Legends */}
          <div className="flex items-center space-x-1.5 flex-wrap gap-1 text-[9px] text-slate-400 bg-black/20 px-2 py-1.5 rounded-lg border border-neutral-800/40">
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-[#FF8C00] rounded-full inline-block" /> Peças</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" /> Mecânica</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-sky-400 rounded-full inline-block" /> Postos</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" /> Pneus</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" /> Socorro</span>
          </div>
        </div>
      </div>

      {/* Main Map Display Area */}
      <div className="relative w-full aspect-[16/10] md:aspect-[16/8] bg-[#0E0E0E] rounded-xl border border-neutral-850 overflow-hidden select-none">
        
        {mapMode === 'radar' ? (
          /* RADAR TÁTICO VIEW */
          <>
            {/* Subtle grid background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(#FF8C00 0.75px, transparent 0.75px), radial-gradient(#FF8C00 0.75px, #0E0E0E 0.75px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px'
            }} />

            {/* Tactical UI Corners */}
            <div className="absolute top-2 left-2 flex items-center space-x-1 border border-neutral-800/80 bg-black/70 px-2 py-1 rounded text-[8px] font-mono text-slate-500 z-10">
              <Shield className="w-2.5 h-2.5 text-amber-500" />
              <span>SISTEMA DE MONITORAMENTO IMPÉRIO — RADAR</span>
            </div>
            <div className="absolute bottom-2 right-2 border border-neutral-800/80 bg-black/70 px-2 py-1 rounded text-[8px] font-mono text-slate-500 z-10">
              <span>LAT: -23.5000 | LNG: -46.5800</span>
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

              {/* Rodovia Lines */}
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
              
              <path 
                d="M 12,5 Q 38,18 50,25 T 80,48" 
                fill="none" 
                stroke="#202020" 
                strokeWidth="0.4" 
                strokeLinecap="round"
                className="pointer-events-none"
              />
              <text x="75" y="44" fill="#313131" fontSize="0.9" fontWeight="900" transform="rotate(35, 75, 44)" className="font-mono select-none">ROD. ANHANGUERA</text>

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
                const { x, y } = getCoordinates(supplier);
                
                const mapX = x;
                const mapY = (y / 100) * 50;
                
                const isTargeted = getIsSupplierVisible(supplier);
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
                    style={{ opacity: isTargeted ? 1 : 0.2, transition: 'opacity 0.3s ease' }}
                  >
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

                    <circle 
                      cx={mapX} 
                      cy={mapY} 
                      r="1.4" 
                      className={`transition-all duration-300 stroke-[#121212] stroke-[0.15] ${markerColor} ${
                        isActive ? 'scale-125' : 'group-hover:scale-110'
                      }`}
                    />

                    <text 
                      x={mapX} 
                      y={mapY + 0.4} 
                      fontSize="1.1" 
                      textAnchor="middle" 
                      className="pointer-events-none select-none font-sans"
                    >
                      {getCategoryEmoji(supplier.category)}
                    </text>

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
                <circle cx="50" cy="25" r="1.8" fill="none" stroke="#FF8C00" strokeWidth="0.1" className="animate-ping" style={{ transformOrigin: '50px 25px' }} />
                <circle cx="50" cy="25" r="1" fill="#FF8C00" stroke="#FFFFFF" strokeWidth="0.15" />
                
                <path 
                  d="M 49.3,24 L 50.7,24 L 50.7,25.5 L 49.3,25.5 Z" 
                  fill="#000000" 
                  className="pointer-events-none"
                />
                
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

            {/* Hover supplier card overlay */}
            {hoveredSupplier && (
              <div className="absolute top-2 right-2 bg-black/90 border border-neutral-800 p-2.5 rounded-lg max-w-[200px] shadow-xl text-left backdrop-blur-md animate-fade-in pointer-events-none z-10 transition-all">
                <span className="text-[8px] uppercase font-black text-[#FF8C00] tracking-wider block">
                  {getCategoryEmoji(hoveredSupplier.category)} {hoveredSupplier.category.toUpperCase()}
                </span>
                <h4 className="text-white text-xs font-black truncate leading-tight mt-0.5">{hoveredSupplier.name}</h4>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{hoveredSupplier.specialty}</p>
                <div className="flex items-center justify-between text-[9px] mt-1.5 pt-1.5 border-t border-neutral-900 font-mono">
                  <span className="text-[#FF8C00] font-bold">KM {hoveredSupplier.distance}</span>
                  <span className="text-slate-500 font-bold">Orçar</span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* GOOGLE MAPS PLATFORM REAL INTEGRATION VIEW */
          <div className="w-full h-full relative" id="google-maps-integration-view">
            {!hasValidKey ? (
              /* Splash screen informative card for missing API key */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center select-text z-20">
                <div className="max-w-md bg-[#161616] border border-neutral-800 p-5 rounded-2xl shadow-2xl space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-950/50 border border-orange-500/30 flex items-center justify-center mx-auto text-xl">
                    ⚠️
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Chave do Google Maps Requerida</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Para visualizar o Mapa Real integrado por satélite e geolocalização exata, você precisa associar uma Chave de API do Google Maps Platform nos Secrets do seu workspace.
                    </p>
                  </div>

                  <div className="bg-black/65 border border-neutral-850 p-3 rounded-xl text-left text-[10px] text-slate-350 space-y-1.5 leading-normal">
                    <p className="font-black text-orange-400 uppercase tracking-widest text-[9px]">Passo a Passo de Configuração:</p>
                    <p><strong>1.</strong> Obtenha uma chave no console: <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline inline-flex items-center gap-0.5 font-bold">Obter Chave <ExternalLink className="w-3 h-3" /></a></p>
                    <p><strong>2.</strong> Abra as <strong>Configurações do AI Studio</strong> (ícone de engrenagem ⚙️ no canto superior direito).</p>
                    <p><strong>3.</strong> Acesse a aba <strong>Secrets</strong> e clique em <strong>Add Secret</strong>.</p>
                    <p><strong>4.</strong> Digite o nome <code>GOOGLE_MAPS_PLATFORM_KEY</code> e insira a sua chave como valor.</p>
                    <p className="text-slate-500 font-bold italic mt-1">O projeto irá se recompilar automaticamente e o Mapa Real carregará em tempo real!</p>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setMapMode('radar')}
                      className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      Voltar ao Radar Tático
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowKeyHelp(!showKeyHelp)}
                      className="px-4 py-2 bg-[#FF8C00] text-black rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-orange-500 cursor-pointer"
                    >
                      Como Obter Grátis
                    </button>
                  </div>

                  {showKeyHelp && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-left text-slate-400 leading-normal border-t border-neutral-850 pt-2.5 space-y-1"
                    >
                      <p>O Google Maps Platform oferece um crédito gratuito mensal de <strong>$200 dólares</strong> para todos os desenvolvedores. Esse crédito cobre até <strong>28.000 carregamentos de mapa</strong> mensais de forma 100% gratuita para testes e homologação.</p>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              /* REAL GOOGLE MAPS PLATFORM ELEMENT */
              <APIProvider apiKey={API_KEY} version="weekly">
                <Map
                  defaultCenter={CENTER_COORD}
                  defaultZoom={12}
                  mapId="DEMO_MAP_ID"
                  gestureHandling="cooperative"
                  disableDefaultUI={false}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* Driver locator pin */}
                  <AdvancedMarker position={CENTER_COORD} title="Você (Sua Carga)">
                    <Pin background="#FF8C00" borderColor="#FFFFFF" glyphColor="#000000" scale={1.2}>
                      🚚
                    </Pin>
                  </AdvancedMarker>

                  {/* Active suppliers pins on real map */}
                  {suppliers.filter(getIsSupplierVisible).map((supplier) => {
                    const coords = getGoogleCoords(supplier);
                    const isSelected = activeSupplierId === supplier.id || selectedGoogleSupplier?.id === supplier.id;
                    const hexColor = getCategoryHexColor(supplier.category);
                    const emoji = getCategoryEmoji(supplier.category);

                    return (
                      <AdvancedMarker
                        key={supplier.id}
                        position={coords}
                        title={supplier.name}
                        onClick={() => {
                          setSelectedGoogleSupplier(supplier);
                          onSelectSupplier(supplier);
                        }}
                      >
                        <Pin 
                          background={hexColor} 
                          borderColor={isSelected ? "#FFFFFF" : "#1A1A1A"} 
                          glyphColor="#FFFFFF"
                          scale={isSelected ? 1.25 : 1}
                        >
                          <span className="text-xs">{emoji}</span>
                        </Pin>
                      </AdvancedMarker>
                    );
                  })}

                  {/* Info Window overlay for clicked supplier on real map */}
                  {selectedGoogleSupplier && (
                    <InfoWindow
                      position={getGoogleCoords(selectedGoogleSupplier)}
                      onCloseClick={() => setSelectedGoogleSupplier(null)}
                    >
                      <div className="p-1.5 text-black font-sans max-w-[200px] text-left select-text">
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{getCategoryEmoji(selectedGoogleSupplier.category)}</span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-[#FF8C00]">{selectedGoogleSupplier.category}</span>
                        </div>
                        <h4 className="text-[11px] font-bold text-neutral-900 mt-0.5 leading-tight">{selectedGoogleSupplier.name}</h4>
                        <p className="text-[9px] text-neutral-650 mt-1 leading-normal">{selectedGoogleSupplier.specialty}</p>
                        
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-200 text-[9px] font-mono">
                          <span className="font-extrabold text-neutral-800">Distância: {selectedGoogleSupplier.distance} KM</span>
                          <span className="text-emerald-600 font-extrabold bg-emerald-50 px-1 rounded">⭐ {selectedGoogleSupplier.rating}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectSupplier(selectedGoogleSupplier);
                          }}
                          className="w-full mt-2 bg-[#FF8C00] hover:bg-orange-500 text-black text-[9px] font-black uppercase tracking-wider py-1.5 rounded text-center transition-colors block cursor-pointer"
                        >
                          Solicitar Orçamento / Chat
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Mini Status and Helper Message beneath map */}
      <div className="mt-3 flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-2 text-slate-400 font-medium">
          <MapPin className="w-4 h-4 text-orange-500 animate-bounce shrink-0" />
          <span>
            {mapMode === 'radar' ? (
              <>Selecione qualquer fornecedor no mapa clicando no marcador para abrir a <strong className="text-slate-200">ficha técnica</strong> e iniciar comunicação do app.</>
            ) : (
              <>Você está no <strong className="text-slate-200">Mapa Satélite Real (Google Maps)</strong>. Navegue, dê zoom e clique nos pinos para ver detalhes geográficos reais.</>
            )}
          </span>
        </div>
        
        {/* Zoom scale / Control Buttons demo */}
        {mapMode === 'radar' && (
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
        )}
      </div>
    </div>
  );
}
