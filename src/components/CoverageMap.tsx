/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Compass, ExternalLink } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Supplier } from '../types';

interface CoverageMapProps {
  suppliers: Supplier[];
  selectedCategory: string;
  onSelectSupplier: (supplier: Supplier) => void;
  activeSupplierId?: string;
  searchRadius?: number;
}

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
  const [selectedGoogleSupplier, setSelectedGoogleSupplier] = useState<Supplier | null>(null);
  const [showKeyHelp, setShowKeyHelp] = useState<boolean>(false);

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
            Localização em Tempo Real
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
        <div className="flex items-center space-x-1.5 flex-wrap gap-1 text-[9px] text-slate-400 bg-black/20 px-2 py-1.5 rounded-lg border border-neutral-800/40">
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-[#FF8C00] rounded-full inline-block" /> Peças</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" /> Mecânica</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-sky-400 rounded-full inline-block" /> Postos</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" /> Pneus</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" /> Socorro</span>
        </div>
      </div>

      {/* Main Map Display Area */}
      <div className="relative w-full aspect-[16/10] md:aspect-[16/8] bg-[#0E0E0E] rounded-xl border border-neutral-850 overflow-hidden select-none">
        
        {/* GOOGLE MAPS PLATFORM REAL INTEGRATION VIEW */}
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
      </div>

      {/* Dynamic Mini Status and Helper Message beneath map */}
      <div className="mt-3 flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-2 text-slate-400 font-medium">
          <MapPin className="w-4 h-4 text-orange-500 animate-bounce shrink-0" />
          <span>
            Você está no <strong className="text-slate-200">Mapa Satélite Real (Google Maps)</strong>. Navegue, dê zoom e clique nos pinos para ver detalhes geográficos reais.
          </span>
        </div>
      </div>
    </div>
  );
}
