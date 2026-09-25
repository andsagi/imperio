/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Supplier, CatalogItem, Chat, TruckProfile, SOSRequest, OrderStats, Seller, Review } from './types';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { perfMonitor } from './services/perfMonitor';

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'r1',
    targetId: 's1', // Tietê Diesel Autopeças
    targetName: 'Tietê Diesel Autopeças',
    targetType: 'supplier',
    reviewerName: 'Roberto da Silva',
    reviewerRole: 'trucker',
    rating: 5,
    comment: 'Atendimento nota 10! Consegui as peças para o Scania à pronta entrega e o vendedor Lucas me deu um desconto excelente na faturização.',
    timestamp: '2026-06-15T14:30:00Z'
  },
  {
    id: 'r2',
    targetId: 's2', // Mecânica Diesel Express 24h
    targetName: 'Mecânica Diesel Express 24h',
    targetType: 'supplier',
    reviewerName: 'Carlos Henrique',
    reviewerRole: 'trucker',
    rating: 4,
    comment: 'Socorro rápido na rodovia Dutra. O guincho chegou em menos de 40 minutos. Recomendo bastante para emergências de motor.',
    timestamp: '2026-06-18T18:15:00Z'
  },
  {
    id: 'r3',
    targetId: 'Roberto da Silva', // Roberto da Silva (trucker)
    targetName: 'Roberto da Silva',
    targetType: 'trucker',
    reviewerName: 'Tietê Diesel Autopeças',
    reviewerRole: 'supplier',
    rating: 5,
    comment: 'Excelente cliente! Motorista muito educado, pagamento correto e comunicação rápida durante a entrega das peças no pátio.',
    timestamp: '2026-06-20T10:00:00Z'
  },
  {
    id: 'r4',
    targetId: 's3', // Rede Siga Bem - Posto da Serra
    targetName: 'Rede Siga Bem - Posto da Serra',
    targetType: 'supplier',
    reviewerName: 'Augusto F.',
    reviewerRole: 'trucker',
    rating: 5,
    comment: 'Posto super completo! Ótima estrutura de banho e descanso para nós caminhoneiros. Troca de óleo rápida no box.',
    timestamp: '2026-06-21T11:00:00Z'
  },
  {
    id: 'r5',
    targetId: 'Carlos Henrique', // Carlos Henrique (trucker)
    targetName: 'Carlos Henrique',
    targetType: 'trucker',
    reviewerName: 'Mecânica Diesel Express 24h',
    reviewerRole: 'supplier',
    rating: 4,
    comment: 'Ótima comunicação e clareza no relato do problema no motor. Recomendo negociar com ele!',
    timestamp: '2026-06-22T09:30:00Z'
  }
];

export const INITIAL_SELLERS: Seller[] = [
  {
    id: 'v1',
    supplierId: 's1', // Tietê Diesel Autopeças
    name: 'Lucas Vendedor',
    email: 'lucas@gmail.com',
    phone: '(11) 98888-7777',
    isAuthorized: true,
    registeredAt: '2026-05-10T12:00:00Z',
  },
  {
    id: 'v2',
    supplierId: 's1', // Tietê Diesel Autopeças
    name: 'Mariana Vendas',
    email: 'mariana@tietediesel.com.br',
    phone: '(11) 97777-6666',
    isAuthorized: true,
    registeredAt: '2026-05-15T15:30:00Z',
  },
  {
    id: 'v3',
    supplierId: 's2', // Mecânica Diesel Express 24h
    name: 'Carlos Técnico',
    email: 'carlos@express24h.com',
    phone: '(19) 99888-5555',
    isAuthorized: true,
    registeredAt: '2026-06-01T09:15:00Z',
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    name: 'Tietê Diesel Autopeças',
    specialty: 'Distribuidora Oficial Scania & Volvo',
    category: 'pecas',
    distance: 4.8,
    rating: 4.9,
    reviewsCount: 142,
    isOnline: true,
    contactPhone: '(11) 98765-4321',
    whatsappNumber: '5511987654321',
    address: 'Rod. Presidente Dutra, KM 221 - Guarulhos, SP',
    isVerified: true,
    isFoundingPartner: true,
    niche: 'pesados',
  },
  {
    id: 's2',
    name: 'Mecânica Diesel Express 24h',
    specialty: 'Socorro de Motores, Ar Condicionado e Suspensão',
    category: 'mecanica',
    distance: 12.3,
    rating: 4.7,
    reviewsCount: 89,
    isOnline: true,
    contactPhone: '(19) 99321-7654',
    whatsappNumber: '5519993217654',
    address: 'Rod. Anhanguera, KM 98 - Campinas, SP',
    isVerified: true,
    isFoundingPartner: true,
    niche: 'pesados',
  },
  {
    id: 's3',
    name: 'Rede Siga Bem - Posto da Serra',
    specialty: 'Combustível, Troca de Óleo Shell Rimula & Conveniência',
    category: 'postos',
    distance: 18.5,
    rating: 4.5,
    reviewsCount: 310,
    isOnline: false,
    contactPhone: '(41) 98111-2222',
    whatsappNumber: '5541981112222',
    address: 'BR-116, KM 72 - Quatro Barras, PR',
    isVerified: true,
    isFoundingPartner: false,
    niche: 'pesados',
  },
  {
    id: 's4',
    name: 'Borracharia e Truck Center KM 300',
    specialty: 'Alinhamento, Recauchutagem e Venda de Pneus Michelin',
    category: 'pneus',
    distance: 2.1,
    rating: 4.8,
    reviewsCount: 64,
    isOnline: true,
    contactPhone: '(16) 99123-8877',
    whatsappNumber: '5516991238877',
    address: 'Rod. Washington Luís, KM 300 - Araraquara, SP',
    isVerified: false,
    isFoundingPartner: true,
    niche: 'pesados',
  },
  {
    id: 's5',
    name: 'Auto Elétrica e Guincho Rodovias',
    specialty: 'Guincho Pesado, Lanternas, Baterias Heliar & Alternadores',
    category: 'socorro',
    distance: 25.1,
    rating: 4.6,
    reviewsCount: 77,
    isOnline: true,
    contactPhone: '(11) 97111-8899',
    whatsappNumber: '5511971118899',
    address: 'Rod. dos Bandeirantes, KM 45 - Jundiaí, SP',
    isVerified: true,
    isFoundingPartner: false,
    niche: 'pesados',
  },
  {
    id: 's6',
    name: 'Império Auto Center Cidade',
    specialty: 'Troca de Óleo, Amortecedores, Alinhamento e Suspensão Leve',
    category: 'mecanica',
    distance: 3.2,
    rating: 4.8,
    reviewsCount: 194,
    isOnline: true,
    contactPhone: '(11) 98888-5555',
    whatsappNumber: '5511988885555',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo, SP',
    isVerified: true,
    isFoundingPartner: true,
    niche: 'passeio',
  },
  {
    id: 's7',
    name: 'Elite Bosch Service Car',
    specialty: 'Injeção Eletrônica, Freio ABS, Correias e Filtros Leves',
    category: 'pecas',
    distance: 8.5,
    rating: 4.9,
    reviewsCount: 112,
    isOnline: true,
    contactPhone: '(11) 97777-4444',
    whatsappNumber: '5511977774444',
    address: 'Av. das Nações Unidas, 12551 - Pinheiros, São Paulo, SP',
    isVerified: true,
    isFoundingPartner: false,
    niche: 'passeio',
  },
  {
    id: 's8',
    name: 'Império Duas Rodas Racing',
    specialty: 'Kit Relação, Pneus Pirelli, Óleo Motul, Alinhamento de Aro',
    category: 'pecas',
    distance: 1.5,
    rating: 4.9,
    reviewsCount: 304,
    isOnline: true,
    contactPhone: '(11) 96666-3333',
    whatsappNumber: '5511966663333',
    address: 'Av. Rudge, 500 - Bom Retiro, São Paulo, SP',
    isVerified: true,
    isFoundingPartner: true,
    niche: 'motos',
  },
  {
    id: 's9',
    name: 'Oficina SOS Clínica das Motos 24h',
    specialty: 'Mecânica Geral, Relação, Carburação, Freios e Injeção de Motos',
    category: 'socorro',
    distance: 6.7,
    rating: 4.7,
    reviewsCount: 88,
    isOnline: true,
    contactPhone: '(11) 95555-2222',
    whatsappNumber: '5511955552222',
    address: 'Rua da Consolação, 2500 - Consolação, São Paulo, SP',
    isVerified: true,
    isFoundingPartner: false,
    niche: 'motos',
  }
];

export const INITIAL_CATALOG_ITEMS: CatalogItem[] = [
  {
    id: 'p1',
    supplierId: 's1',
    title: 'Kit de Embreagem Sachs Scania R440',
    category: 'Peças de Transmissão',
    code: 'EP-440-SACS',
    price: 3450.00,
    compatibleWith: 'Scania R440 / R420',
    description: 'Kit completo de embreagem Sachs original contendo platô, disco e rolamento guia. Alta durabilidade para trechos pesados de longa distância.',
    image: '⚙️',
    niche: 'pesados',
  },
  {
    id: 'p2',
    supplierId: 's1',
    title: 'Turbina BorgWarner Volvo FK540',
    category: 'Componentes de Motor',
    code: 'TB-V540-BGWN',
    price: 6890.00,
    compatibleWith: 'Volvo FH 540 / FH 460',
    description: 'Turbocompressor genuíno BorgWarner. Excelente eficiência energética, gerando economia real de diesel e mantendo a potência nominal.',
    image: '🌀',
    niche: 'pesados',
  },
  {
    id: 'p3',
    supplierId: 's1',
    title: 'Pastilha de Freio Dianteira Fras-le',
    category: 'Freios e Segurança',
    code: 'PF-FL-902',
    price: 489.90,
    compatibleWith: 'Scania R, Volvo FH, MB Actros',
    description: 'Pastilhas de freio Fras-le de cerâmica composta. Menor desgaste do disco de freio e alto coeficiente de atrito sob altas temperaturas.',
    image: '🛞',
    niche: 'pesados',
  },
  {
    id: 'p4',
    supplierId: 's2',
    title: 'Bolsa de Ar Suspensão Traseira Firestone',
    category: 'Suspensão',
    code: 'BS-FS-991',
    price: 820.00,
    compatibleWith: 'Mercedes-Benz Actros / Axor',
    description: 'Foles de ar suspensão a ar Firestone original. Excelente estabilização da carroceria e melhor absorção de impactos no trecho.',
    image: '🎈',
    niche: 'pesados',
  },
  {
    id: 'p5',
    supplierId: 's4',
    title: 'Pneu Bridgestone M729 295/80R22.5',
    category: 'Pneus e Rodas',
    code: 'PN-BS-295',
    price: 2490.00,
    compatibleWith: 'Todos os eixos de tração pesada (22.5)',
    description: 'Pneu radial Bridgestone de tração com alta quilometragem. Excelente tração em piso seco ou molhado, com ótima recapabilidade.',
    image: '🛞',
    niche: 'pesados',
  },
  {
    id: 'p6',
    supplierId: 's7',
    title: 'Óleo Castrol Magnatec 5W-30 Sintético 1L',
    category: 'Componentes de Motor',
    code: 'OL-CAS-5W30',
    price: 64.90,
    compatibleWith: 'Toyota Corolla, Honda Civic, Chevrolet Onix, Hyundai HB20',
    description: 'Lubrificante 100% sintético para motores leves a gasolina, flex e diesel. Moléculas inteligentes para proteção instantânea desde a partida.',
    image: '🧴',
    niche: 'passeio',
  },
  {
    id: 'p7',
    supplierId: 's7',
    title: 'Jogo de Pastilhas de Freio Cobreq Dianteira',
    category: 'Freios e Segurança',
    code: 'PF-COB-N117',
    price: 159.90,
    compatibleWith: 'Chevrolet Onix, Hyundai HB20, Fiat Argo',
    description: 'Segurança extrema e frenagem macia com baixo nível de ruído metálico. Tecnologia orgânica de fricção homologada pelas montadoras.',
    image: '🛞',
    niche: 'passeio',
  },
  {
    id: 'p8',
    supplierId: 's6',
    title: 'Kit Amortecedor Monroe OESpectrum (Par)',
    category: 'Suspensão',
    code: 'AM-MON-OE48',
    price: 890.00,
    compatibleWith: 'Toyota Corolla (2015-2022), Honda Civic',
    description: 'Par de amortecedores pressurizados a gás de alta estabilidade para vias urbanas e estradas de asfalto irregular. Tecnologia de amortecimento instantâneo.',
    image: '🔩',
    niche: 'passeio',
  },
  {
    id: 'p9',
    supplierId: 's8',
    title: 'Pneu Traseiro Pirelli Diablo Rosso II 140/70-17',
    category: 'Pneus e Rodas',
    code: 'PN-PIR-DR2',
    price: 549.90,
    compatibleWith: 'Yamaha Fazer 250, Honda CB 300, Kawasaki Ninja 300',
    description: 'Pneu esportivo radial de perfil super agressivo. Fantástica aderência em curvas radicais e escoamento acelerado em pistas molhadas.',
    image: '🛞',
    niche: 'motos',
  },
  {
    id: 'p10',
    supplierId: 's8',
    title: 'Kit Transmissão DID O-Ring Completo',
    category: 'Peças de Transmissão',
    code: 'KT-DID-CG16',
    price: 349.00,
    compatibleWith: 'Honda CG 160 Titan / Fan / Start / Cargo',
    description: 'Kit composto por corrente com retentores O-ring de baixíssimo atrito e coroas endurecidas em aço estrutural de alta especificação.',
    image: '⚙️',
    niche: 'motos',
  },
  {
    id: 'p11',
    supplierId: 's9',
    title: 'Capacete LS2 Rapid Classic Preto Fosco',
    category: 'Equipamento e Segurança',
    code: 'CP-LS2-RPD',
    price: 519.00,
    compatibleWith: 'Pilotos e Passageiros em Geral',
    description: 'Capacete leve em resina termoplástica de alta segurança. Espuma hipoalergênica removível, viseira com proteção UV e engate micrométrico rápido.',
    image: '🪖',
    niche: 'motos',
  }
];

export const INITIAL_TRUCK_PROFILE: TruckProfile = {
  brand: 'Volvo',
  model: 'FH 540 Globetrotter (6x4)',
  year: 2021,
  plate: 'IMP-8C40',
  currentKm: 345000,
  engineType: 'D13K 540hp',
  lastOilChangeKm: 340000, // 5000 km ago. Change required every 20,000 km.
  lastTireChangeKm: 320000, // 25,000 km ago. Rotate or check required every 40,000 km.
  lastBrakeChangeKm: 290000, // 55,000 km ago. Check required every 60,000 km.
};

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'c_s1',
    supplierId: 's1',
    supplierName: 'Tietê Diesel Autopeças',
    lastMessage: 'Temos em estoque sim, parceiro! Se fechar fechamos a entrega agora.',
    unreadCount: 1,
    timestamp: '18:14',
    isOnline: true,
    messages: [
      {
        id: 'm1',
        sender: 'trucker',
        text: 'Olá amigo, precisava saber se vocês têm a pastilha de freio Fras-le para o Volvo FH 540 ano 2021.',
        timestamp: '18:10',
      },
      {
        id: 'm2',
        sender: 'supplier',
        text: 'Opa, boa tarde bão? Sou o João, especialista de vendas da Tietê Diesel.',
        timestamp: '18:12',
      },
      {
        id: 'm3',
        sender: 'supplier',
        text: 'Temos em estoque sim, parceiro! Da marca Fras-le original, tá saindo por R$ 489,90 o jogo dianteiro. Se fechar fechamos a entrega rápido na beira da estrada.',
        timestamp: '18:14',
      }
    ]
  },
  {
    id: 'c_s2',
    supplierId: 's2',
    supplierName: 'Mecânica Diesel Express 24h',
    lastMessage: 'Pode deixar, o mecânico já está a caminho!',
    unreadCount: 0,
    timestamp: 'Ontem',
    isOnline: true,
    messages: [
      {
        id: 'm4',
        sender: 'trucker',
        text: 'Estou com o caminhão rateando perto do posto de combustível, vocês conseguem mandar socorro?',
        timestamp: 'Ontem 14:30',
      },
      {
        id: 'm5',
        sender: 'supplier',
        text: 'Consigo sim chefe, qual é o seu modelo? Vou mandar o nosso mecânico Alair com as chaves principais.',
        timestamp: 'Ontem 14:35',
      },
      {
        id: 'm6',
        sender: 'supplier',
        text: 'Pode deixar, o mecânico já está a caminho!',
        timestamp: 'Ontem 14:40',
      }
    ]
  }
];

export const INITIAL_STATS: OrderStats = {
  views: 842,
  clicks: 147,
  quotesCount: 34,
  salesClosed: 19,
};

export const INITIAL_SOS_REQUESTS: SOSRequest[] = [
  // Today's distress calls (2026-09-24)
  {
    id: 'sos_101',
    type: 'Pneu Furado / Estourado',
    description: 'Estouro de pneu duplo traseiro no trecho de subida com carga pesada.',
    status: 'completed',
    matchedSupplierId: 's4',
    matchedSupplierName: 'Borracharia e Truck Center KM 300',
    etaMinutes: 22,
    timestamp: '2026-09-24T02:15:00Z',
    highway: 'Rod. Washington Luís, KM 298',
    km: 298,
    driverName: 'Marcos Aurelio',
    truckModel: 'Scania R450',
    responseTimeMinutes: 19
  },
  {
    id: 'sos_102',
    type: 'Necessito de Guincho Pesado',
    description: 'Quebra de eixo cardan travou o cavalo mecânico na faixa 2 da rodovia.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 35,
    timestamp: '2026-09-24T02:45:00Z',
    highway: 'Rod. dos Bandeirantes, KM 48',
    km: 48,
    driverName: 'Claudio Peixoto',
    truckModel: 'Volvo FH 540',
    responseTimeMinutes: 28
  },
  {
    id: 'sos_103',
    type: 'Problema Elétrico / Bateria',
    description: 'Alternador parou de carregar, painel apagou completamente no escuro.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 25,
    timestamp: '2026-09-24T03:20:00Z',
    highway: 'Rod. dos Bandeirantes, KM 52',
    km: 52,
    driverName: 'José Fernandes',
    truckModel: 'Mercedes-Benz Actros 2651',
    responseTimeMinutes: 21
  },
  {
    id: 'sos_104',
    type: 'Pneu Furado / Estourado',
    description: 'Pneu do cavalo estourou no acostamento após passar sobre cinta metálica solta.',
    status: 'completed',
    matchedSupplierId: 's4',
    matchedSupplierName: 'Borracharia e Truck Center KM 300',
    etaMinutes: 18,
    timestamp: '2026-09-24T03:55:00Z',
    highway: 'Rod. Anhanguera, KM 102',
    km: 102,
    driverName: 'Roberto da Silva',
    truckModel: 'Volvo FH 540',
    responseTimeMinutes: 16
  },
  {
    id: 'sos_105',
    type: 'Falta de Freio / Compressor',
    description: 'Vazamento de ar na cuíca de freio travou as rodas traseiras da carreta.',
    status: 'completed',
    matchedSupplierId: 's2',
    matchedSupplierName: 'Mecânica Diesel Express 24h',
    etaMinutes: 28,
    timestamp: '2026-09-24T04:30:00Z',
    highway: 'Rod. Anhanguera, KM 94',
    km: 94,
    driverName: 'Adilson Prado',
    truckModel: 'DAF XF 530',
    responseTimeMinutes: 24
  },
  {
    id: 'sos_106',
    type: 'Pane Mecânica / Motor',
    description: 'Mangueira do intercooler rompeu na subida da serra, fumaça preta e perda de pressão.',
    status: 'completed',
    matchedSupplierId: 's2',
    matchedSupplierName: 'Mecânica Diesel Express 24h',
    etaMinutes: 20,
    timestamp: '2026-09-24T07:15:00Z',
    highway: 'Rod. Presidente Dutra, KM 218',
    km: 218,
    driverName: 'Wellington Gomes',
    truckModel: 'Scania R440',
    responseTimeMinutes: 18
  },
  {
    id: 'sos_107',
    type: 'Motor Fervendo / Arrefecimento',
    description: 'Vazamento na carcaça da válvula termostática provocou superaquecimento.',
    status: 'completed',
    matchedSupplierId: 's1',
    matchedSupplierName: 'Tietê Diesel Autopeças',
    etaMinutes: 25,
    timestamp: '2026-09-24T07:50:00Z',
    highway: 'Rod. Presidente Dutra, KM 225',
    km: 225,
    driverName: 'Carlos Henrique',
    truckModel: 'Volvo FH 460',
    responseTimeMinutes: 22
  },
  {
    id: 'sos_108',
    type: 'Pneu Furado / Estourado',
    description: 'Pneu direcional esquerdo perdeu pressão bruscamente no início da viagem.',
    status: 'completed',
    matchedSupplierId: 's4',
    matchedSupplierName: 'Borracharia e Truck Center KM 300',
    etaMinutes: 15,
    timestamp: '2026-09-24T08:35:00Z',
    highway: 'Rod. Washington Luís, KM 305',
    km: 305,
    driverName: 'Lucas Matos',
    truckModel: 'Volkswagen Meteor 29.520',
    responseTimeMinutes: 14
  },
  {
    id: 'sos_109',
    type: 'Pane Mecânica / Motor',
    description: 'Embreagem patinando na arrancada da praça de pedágio.',
    status: 'completed',
    matchedSupplierId: 's1',
    matchedSupplierName: 'Tietê Diesel Autopeças',
    etaMinutes: 30,
    timestamp: '2026-09-24T11:20:00Z',
    highway: 'Rod. Presidente Dutra, KM 210',
    km: 210,
    driverName: 'Valdir Silveira',
    truckModel: 'Scania Streamline',
    responseTimeMinutes: 26
  },
  {
    id: 'sos_110',
    type: 'Falta de Freio / Compressor',
    description: 'Luz de falha do freio motor e compressor não atinge 10 bar.',
    status: 'completed',
    matchedSupplierId: 's2',
    matchedSupplierName: 'Mecânica Diesel Express 24h',
    etaMinutes: 24,
    timestamp: '2026-09-24T14:40:00Z',
    highway: 'Rod. Anhanguera, KM 110',
    km: 110,
    driverName: 'Gilberto Lima',
    truckModel: 'Mercedes-Benz Axor',
    responseTimeMinutes: 20
  },
  {
    id: 'sos_111',
    type: 'Problema Elétrico / Bateria',
    description: 'Faróis e iluminação da carreta apagaram no trecho de neblina.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 20,
    timestamp: '2026-09-24T19:30:00Z',
    highway: 'Rod. dos Bandeirantes, KM 42',
    km: 42,
    driverName: 'Fabio Costa',
    truckModel: 'Volvo FH 540',
    responseTimeMinutes: 17
  },
  {
    id: 'sos_112',
    type: 'Pneu Furado / Estourado',
    description: 'Furo duplo no 4º eixo da carreta bitrem carregada.',
    status: 'completed',
    matchedSupplierId: 's4',
    matchedSupplierName: 'Borracharia e Truck Center KM 300',
    etaMinutes: 25,
    timestamp: '2026-09-24T21:10:00Z',
    highway: 'Rod. Washington Luís, KM 290',
    km: 290,
    driverName: 'Moacir Santos',
    truckModel: 'Scania R500',
    responseTimeMinutes: 22
  },
  {
    id: 'sos_113',
    type: 'Necessito de Guincho Pesado',
    description: 'Correia de acessórios arrebentou e travou bomba d’água.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 32,
    timestamp: '2026-09-24T21:45:00Z',
    highway: 'Rod. dos Bandeirantes, KM 58',
    km: 58,
    driverName: 'Sebastião Ramos',
    truckModel: 'Mercedes-Benz Actros',
    responseTimeMinutes: 27
  },
  {
    id: 'sos_114',
    type: 'Pane Mecânica / Motor',
    description: 'Ruído metálico no cabeçote e perda de rendimento.',
    status: 'completed',
    matchedSupplierId: 's1',
    matchedSupplierName: 'Tietê Diesel Autopeças',
    etaMinutes: 28,
    timestamp: '2026-09-24T22:30:00Z',
    highway: 'Rod. Presidente Dutra, KM 220',
    km: 220,
    driverName: 'Edilson Miranda',
    truckModel: 'Scania R440',
    responseTimeMinutes: 24
  },
  {
    id: 'sos_115',
    type: 'Problema Elétrico / Bateria',
    description: 'Bateria descarregada após parada para reabastecimento.',
    status: 'accepted',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 19,
    timestamp: '2026-09-24T23:15:00Z',
    highway: 'Rod. dos Bandeirantes, KM 39',
    km: 39,
    driverName: 'Renato Nogueira',
    truckModel: 'Volvo FM 370',
    responseTimeMinutes: 15
  },

  // 2026-09-23 Distress calls
  {
    id: 'sos_116',
    type: 'Necessito de Guincho Pesado',
    description: 'Pane no diferencial em trecho sem acostamento na serra.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 35,
    timestamp: '2026-09-23T01:30:00Z',
    highway: 'Rod. Presidente Dutra, KM 195',
    km: 195,
    driverName: 'Jair Messias',
    truckModel: 'Scania R450',
    responseTimeMinutes: 30
  },
  {
    id: 'sos_117',
    type: 'Pneu Furado / Estourado',
    description: 'Dois pneus estourados em buraco na pista da direita.',
    status: 'completed',
    matchedSupplierId: 's4',
    matchedSupplierName: 'Borracharia e Truck Center KM 300',
    etaMinutes: 20,
    timestamp: '2026-09-23T02:20:00Z',
    highway: 'Rod. Washington Luís, KM 312',
    km: 312,
    driverName: 'Leandro Viana',
    truckModel: 'Iveco Stralis',
    responseTimeMinutes: 18
  },
  {
    id: 'sos_118',
    type: 'Problema Elétrico / Bateria',
    description: 'Chave geral desarmando e cheiro de queimado no chicote.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 24,
    timestamp: '2026-09-23T03:10:00Z',
    highway: 'Rod. dos Bandeirantes, KM 65',
    km: 65,
    driverName: 'Anderson Silva',
    truckModel: 'Volvo FH 500',
    responseTimeMinutes: 21
  },
  {
    id: 'sos_119',
    type: 'Falta de Freio / Compressor',
    description: 'Válvula moduladora do freio EBS com falha de comunicação.',
    status: 'completed',
    matchedSupplierId: 's2',
    matchedSupplierName: 'Mecânica Diesel Express 24h',
    etaMinutes: 26,
    timestamp: '2026-09-23T03:45:00Z',
    highway: 'Rod. Anhanguera, KM 89',
    km: 89,
    driverName: 'Tiago Rocha',
    truckModel: 'Scania R440',
    responseTimeMinutes: 23
  },
  {
    id: 'sos_120',
    type: 'Pane Mecânica / Motor',
    description: 'Filtro racor entupiu com borra de diesel, motor apagando.',
    status: 'completed',
    matchedSupplierId: 's2',
    matchedSupplierName: 'Mecânica Diesel Express 24h',
    etaMinutes: 18,
    timestamp: '2026-09-23T07:30:00Z',
    highway: 'Rod. Anhanguera, KM 97',
    km: 97,
    driverName: 'Henrique Alves',
    truckModel: 'Volvo FH 540',
    responseTimeMinutes: 15
  },
  {
    id: 'sos_121',
    type: 'Pneu Furado / Estourado',
    description: 'Pneu esvaziando lentamente na roda traseira externa.',
    status: 'completed',
    matchedSupplierId: 's4',
    matchedSupplierName: 'Borracharia e Truck Center KM 300',
    etaMinutes: 15,
    timestamp: '2026-09-23T08:15:00Z',
    highway: 'Rod. Washington Luís, KM 285',
    km: 285,
    driverName: 'Marcio Souza',
    truckModel: 'Mercedes Actros',
    responseTimeMinutes: 13
  },
  {
    id: 'sos_122',
    type: 'Problema Elétrico / Bateria',
    description: 'Falha no motor de partida após pernoite.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 22,
    timestamp: '2026-09-23T08:50:00Z',
    highway: 'Rod. dos Bandeirantes, KM 30',
    km: 30,
    driverName: 'Paulo Cesar',
    truckModel: 'DAF XF 480',
    responseTimeMinutes: 19
  },
  {
    id: 'sos_123',
    type: 'Pane Mecânica / Motor',
    description: 'Correia do alternador esgarçada emitindo chiado intenso.',
    status: 'completed',
    matchedSupplierId: 's1',
    matchedSupplierName: 'Tietê Diesel Autopeças',
    etaMinutes: 27,
    timestamp: '2026-09-23T15:20:00Z',
    highway: 'Rod. Presidente Dutra, KM 215',
    km: 215,
    driverName: 'Rodrigo Brandão',
    truckModel: 'Scania R450',
    responseTimeMinutes: 22
  },
  {
    id: 'sos_124',
    type: 'Pneu Furado / Estourado',
    description: 'Pneu estourou na descida de serra com risco de tombo de carga.',
    status: 'completed',
    matchedSupplierId: 's4',
    matchedSupplierName: 'Borracharia e Truck Center KM 300',
    etaMinutes: 21,
    timestamp: '2026-09-23T20:45:00Z',
    highway: 'Rod. Washington Luís, KM 318',
    km: 318,
    driverName: 'Bruno Carvalho',
    truckModel: 'Volvo FH 540',
    responseTimeMinutes: 18
  },
  {
    id: 'sos_125',
    type: 'Necessito de Guincho Pesado',
    description: 'Caminhão tombou no canteiro central em pista molhada.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 40,
    timestamp: '2026-09-23T22:10:00Z',
    highway: 'Rod. dos Bandeirantes, KM 72',
    km: 72,
    driverName: 'Sergio Andrade',
    truckModel: 'Iveco Hi-Way',
    responseTimeMinutes: 34
  },
  {
    id: 'sos_126',
    type: 'Problema Elétrico / Bateria',
    description: 'Pane total no sistema de iluminação de comboio noturno.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 22,
    timestamp: '2026-09-23T23:40:00Z',
    highway: 'Rod. Presidente Dutra, KM 230',
    km: 230,
    driverName: 'Celson Dias',
    truckModel: 'Scania R440',
    responseTimeMinutes: 19
  },

  // 2026-09-22 Distress calls
  {
    id: 'sos_127',
    type: 'Pneu Furado / Estourado',
    description: 'Estouro de pneu em rodagem noturna pesada.',
    status: 'completed',
    matchedSupplierId: 's4',
    matchedSupplierName: 'Borracharia e Truck Center KM 300',
    etaMinutes: 19,
    timestamp: '2026-09-22T02:05:00Z',
    highway: 'Rod. Anhanguera, KM 105',
    km: 105,
    driverName: 'Geraldo Nunes',
    truckModel: 'Volvo FH 540',
    responseTimeMinutes: 16
  },
  {
    id: 'sos_128',
    type: 'Necessito de Guincho Pesado',
    description: 'Transmissão automática travou em Neutro no meio da rodovia.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 38,
    timestamp: '2026-09-22T02:50:00Z',
    highway: 'Rod. dos Bandeirantes, KM 50',
    km: 50,
    driverName: 'Nelson Pires',
    truckModel: 'Scania R500',
    responseTimeMinutes: 31
  },
  {
    id: 'sos_129',
    type: 'Motor Fervendo / Arrefecimento',
    description: 'Radiador furou por impacto de pedra solta na pista.',
    status: 'completed',
    matchedSupplierId: 's1',
    matchedSupplierName: 'Tietê Diesel Autopeças',
    etaMinutes: 26,
    timestamp: '2026-09-22T07:20:00Z',
    highway: 'Rod. Presidente Dutra, KM 222',
    km: 222,
    driverName: 'Mauricio Ramos',
    truckModel: 'Mercedes Actros',
    responseTimeMinutes: 22
  },
  {
    id: 'sos_130',
    type: 'Pneu Furado / Estourado',
    description: 'Pneu traseiro da carreta esvaziou totalmente.',
    status: 'completed',
    matchedSupplierId: 's4',
    matchedSupplierName: 'Borracharia e Truck Center KM 300',
    etaMinutes: 16,
    timestamp: '2026-09-22T08:10:00Z',
    highway: 'Rod. Washington Luís, KM 295',
    km: 295,
    driverName: 'Felipe Ribeiro',
    truckModel: 'Volkswagen Meteor',
    responseTimeMinutes: 14
  },
  {
    id: 'sos_131',
    type: 'Pane Mecânica / Motor',
    description: 'Bomba de combustível falhando em alta rotação.',
    status: 'completed',
    matchedSupplierId: 's2',
    matchedSupplierName: 'Mecânica Diesel Express 24h',
    etaMinutes: 24,
    timestamp: '2026-09-22T13:45:00Z',
    highway: 'Rod. Anhanguera, KM 91',
    km: 91,
    driverName: 'Luciano Costa',
    truckModel: 'DAF XF',
    responseTimeMinutes: 20
  },
  {
    id: 'sos_132',
    type: 'Problema Elétrico / Bateria',
    description: 'Faróis piscando e pane no módulo eletrônico do cavalo.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 20,
    timestamp: '2026-09-22T21:30:00Z',
    highway: 'Rod. dos Bandeirantes, KM 44',
    km: 44,
    driverName: 'Renato Lima',
    truckModel: 'Volvo FH 460',
    responseTimeMinutes: 17
  },
  {
    id: 'sos_133',
    type: 'Necessito de Guincho Pesado',
    description: 'Pane seca e sistema injetor com ar na linha.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 30,
    timestamp: '2026-09-22T22:50:00Z',
    highway: 'Rod. Presidente Dutra, KM 205',
    km: 205,
    driverName: 'Wagner Melo',
    truckModel: 'Scania R440',
    responseTimeMinutes: 25
  },

  // 2026-09-20 / 2026-09-18 Historical calls (demonstrating persistent 24h peak trends)
  {
    id: 'sos_134',
    type: 'Pneu Furado / Estourado',
    description: 'Pneu furado na madrugada em trecho isolado sem sinal celular.',
    status: 'completed',
    matchedSupplierId: 's4',
    matchedSupplierName: 'Borracharia e Truck Center KM 300',
    etaMinutes: 23,
    timestamp: '2026-09-20T01:45:00Z',
    highway: 'Rod. Washington Luís, KM 308',
    km: 308,
    driverName: 'Diego Castro',
    truckModel: 'Volvo FH 540',
    responseTimeMinutes: 20
  },
  {
    id: 'sos_135',
    type: 'Necessito de Guincho Pesado',
    description: 'Diferencial quebrou na subida de serra com bloqueio parcial.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 36,
    timestamp: '2026-09-20T02:35:00Z',
    highway: 'Rod. dos Bandeirantes, KM 55',
    km: 55,
    driverName: 'Antonio Carlos',
    truckModel: 'Mercedes Actros',
    responseTimeMinutes: 29
  },
  {
    id: 'sos_136',
    type: 'Falta de Freio / Compressor',
    description: 'Válvula de descarga rápida travou aberta, ar esgotando.',
    status: 'completed',
    matchedSupplierId: 's2',
    matchedSupplierName: 'Mecânica Diesel Express 24h',
    etaMinutes: 25,
    timestamp: '2026-09-20T03:30:00Z',
    highway: 'Rod. Anhanguera, KM 100',
    km: 100,
    driverName: 'Reginaldo Silva',
    truckModel: 'Scania R450',
    responseTimeMinutes: 21
  },
  {
    id: 'sos_137',
    type: 'Pane Mecânica / Motor',
    description: 'Correia dentada auxiliar partiu na partida da manhã.',
    status: 'completed',
    matchedSupplierId: 's1',
    matchedSupplierName: 'Tietê Diesel Autopeças',
    etaMinutes: 22,
    timestamp: '2026-09-20T07:40:00Z',
    highway: 'Rod. Presidente Dutra, KM 219',
    km: 219,
    driverName: 'Gustavo Paiva',
    truckModel: 'Scania R440',
    responseTimeMinutes: 18
  },
  {
    id: 'sos_138',
    type: 'Problema Elétrico / Bateria',
    description: 'Alternador em curto provocou descarga total da bateria.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 21,
    timestamp: '2026-09-20T21:15:00Z',
    highway: 'Rod. dos Bandeirantes, KM 46',
    km: 46,
    driverName: 'Everton Santos',
    truckModel: 'Volvo FM 370',
    responseTimeMinutes: 18
  },
  {
    id: 'sos_139',
    type: 'Pneu Furado / Estourado',
    description: 'Pneu estourou na descida de viaduto de entroncamento.',
    status: 'completed',
    matchedSupplierId: 's4',
    matchedSupplierName: 'Borracharia e Truck Center KM 300',
    etaMinutes: 24,
    timestamp: '2026-09-20T22:40:00Z',
    highway: 'Rod. Washington Luís, KM 292',
    km: 292,
    driverName: 'Silvio Batista',
    truckModel: 'Iveco Stralis',
    responseTimeMinutes: 20
  },
  {
    id: 'sos_140',
    type: 'Necessito de Guincho Pesado',
    description: 'Falha no engate da quinta roda e sem sustentação de pino rei.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 34,
    timestamp: '2026-09-18T02:15:00Z',
    highway: 'Rod. Presidente Dutra, KM 198',
    km: 198,
    driverName: 'Alexandre Lopes',
    truckModel: 'Scania R500',
    responseTimeMinutes: 28
  },
  {
    id: 'sos_141',
    type: 'Pneu Furado / Estourado',
    description: 'Recapagem se soltou em alta velocidade causando vibração no volante.',
    status: 'completed',
    matchedSupplierId: 's4',
    matchedSupplierName: 'Borracharia e Truck Center KM 300',
    etaMinutes: 18,
    timestamp: '2026-09-18T03:00:00Z',
    highway: 'Rod. Anhanguera, KM 96',
    km: 96,
    driverName: 'Gilmar Oliveira',
    truckModel: 'Mercedes Actros',
    responseTimeMinutes: 15
  },
  {
    id: 'sos_142',
    type: 'Falta de Freio / Compressor',
    description: 'Tambor de freio superaqueceu com fumaça nas lonas na descida.',
    status: 'completed',
    matchedSupplierId: 's2',
    matchedSupplierName: 'Mecânica Diesel Express 24h',
    etaMinutes: 26,
    timestamp: '2026-09-18T08:00:00Z',
    highway: 'Rod. dos Bandeirantes, KM 51',
    km: 51,
    driverName: 'Roberto da Silva',
    truckModel: 'Volvo FH 540',
    responseTimeMinutes: 22
  },
  {
    id: 'sos_143',
    type: 'Problema Elétrico / Bateria',
    description: 'Faróis auxiliares apagaram no acostamento escuro.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 20,
    timestamp: '2026-09-18T21:50:00Z',
    highway: 'Rod. Washington Luís, KM 302',
    km: 302,
    driverName: 'Vitor Hugo',
    truckModel: 'DAF XF',
    responseTimeMinutes: 17
  },
  {
    id: 'sos_144',
    type: 'Necessito de Guincho Pesado',
    description: 'Quebra de cruzeta do cardan travou as rodas traseiras.',
    status: 'completed',
    matchedSupplierId: 's5',
    matchedSupplierName: 'Auto Elétrica e Guincho Rodovias',
    etaMinutes: 35,
    timestamp: '2026-09-15T02:40:00Z',
    highway: 'Rod. Anhanguera, KM 108',
    km: 108,
    driverName: 'Marcos Vinicius',
    truckModel: 'Volvo FH 540',
    responseTimeMinutes: 29
  },
  {
    id: 'sos_145',
    type: 'Pneu Furado / Estourado',
    description: 'Pneu do cavalo estourou ao passar sobre objeto pontiagudo.',
    status: 'completed',
    matchedSupplierId: 's4',
    matchedSupplierName: 'Borracharia e Truck Center KM 300',
    etaMinutes: 17,
    timestamp: '2026-09-15T22:15:00Z',
    highway: 'Rod. Presidente Dutra, KM 212',
    km: 212,
    driverName: 'Fabiano Toledo',
    truckModel: 'Scania R440',
    responseTimeMinutes: 14
  }
];

// LocalStorage Helper functions
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const item = localStorage.getItem(`imperio_pesados_${key}`);
  return item ? JSON.parse(item) : defaultValue;
};

const setStorageItem = <T>(key: string, value: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`imperio_pesados_${key}`, JSON.stringify(value));
  }
};

export const loadSuppliers = (): Supplier[] => getStorageItem('suppliers', INITIAL_SUPPLIERS);
export const saveSuppliers = (suppliers: Supplier[]): void => {
  setStorageItem('suppliers', suppliers);
  // Async Sync to Firestore measured by perfMonitor
  suppliers.forEach(async (supplier) => {
    try {
      await perfMonitor.measureQuery(
        `setDoc:suppliers/${supplier.id}`,
        () => setDoc(doc(db, 'suppliers', supplier.id), supplier),
        { type: 'mutation' }
      );
    } catch (e) {
      console.warn('Failed to sync supplier to Firestore: ', e);
    }
  });
};

export const loadCatalogItems = (): CatalogItem[] => getStorageItem('catalog', INITIAL_CATALOG_ITEMS);
export const saveCatalogItems = (items: CatalogItem[]): void => {
  setStorageItem('catalog', items);
  // Async Sync to Firestore measured by perfMonitor
  items.forEach(async (item) => {
    try {
      await perfMonitor.measureQuery(
        `setDoc:catalog/${item.id}`,
        () => setDoc(doc(db, 'catalog', item.id), item),
        { type: 'mutation' }
      );
    } catch (e) {
      console.warn('Failed to sync catalog item to Firestore: ', e);
    }
  });
};

export const loadChats = (): Chat[] => getStorageItem('chats', INITIAL_CHATS);
export const saveChats = (chats: Chat[]): void => {
  setStorageItem('chats', chats);
  // Async Sync to Firestore measured by perfMonitor
  chats.forEach(async (chat) => {
    try {
      await perfMonitor.measureQuery(
        `setDoc:chats/${chat.id}`,
        () => setDoc(doc(db, 'chats', chat.id), chat),
        { type: 'mutation' }
      );
    } catch (e) {
      console.warn('Failed to sync chat to Firestore: ', e);
    }
  });
};

export const loadTruckProfile = (): TruckProfile => getStorageItem('truck_profile', INITIAL_TRUCK_PROFILE);
export const saveTruckProfile = (profile: TruckProfile): void => {
  setStorageItem('truck_profile', profile);
  // Async Sync to Firestore measured by perfMonitor
  perfMonitor.measureQuery(
    'setDoc:truck_profiles/default_profile',
    () => setDoc(doc(db, 'truck_profiles', 'default_profile'), profile),
    { type: 'mutation' }
  ).catch(e => {
    console.warn('Failed to sync truck profile to Firestore: ', e);
  });
};

export const loadSOSRequests = (): SOSRequest[] => getStorageItem('sos_requests', INITIAL_SOS_REQUESTS);
export const saveSOSRequests = (requests: SOSRequest[]): void => {
  setStorageItem('sos_requests', requests);
  // Async Sync to Firestore measured by perfMonitor
  requests.forEach(async (req) => {
    try {
      await perfMonitor.measureQuery(
        `setDoc:sos_requests/${req.id}`,
        () => setDoc(doc(db, 'sos_requests', req.id), req),
        { type: 'mutation' }
      );
    } catch (e) {
      console.warn('Failed to sync SOS request to Firestore: ', e);
    }
  });
};

export const loadStats = (): OrderStats => getStorageItem('stats', INITIAL_STATS);
export const saveStats = (stats: OrderStats): void => {
  setStorageItem('stats', stats);
  // Async Sync to Firestore measured by perfMonitor
  perfMonitor.measureQuery(
    'setDoc:stats/global_stats',
    () => setDoc(doc(db, 'stats', 'global_stats'), stats),
    { type: 'mutation' }
  ).catch(e => {
    console.warn('Failed to sync stats to Firestore: ', e);
  });
};

export const loadReviews = (): Review[] => getStorageItem('reviews', INITIAL_REVIEWS);
export const saveReviews = (reviews: Review[]): void => {
  setStorageItem('reviews', reviews);
  // Async Sync to Firestore measured by perfMonitor
  reviews.forEach(async (review) => {
    try {
      await perfMonitor.measureQuery(
        `setDoc:reviews/${review.id}`,
        () => setDoc(doc(db, 'reviews', review.id), review),
        { type: 'mutation' }
      );
    } catch (e) {
      console.warn('Failed to sync review to Firestore: ', e);
    }
  });
};

// Database Initial Seeding and Validation Connection function
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    console.log('Validating connection and checking database state with performance monitoring...');
    
    // 1. Check to seed Suppliers
    let suppliersSnap;
    try {
      suppliersSnap = await perfMonitor.measureQuery(
        'getDocs:suppliers',
        () => getDocs(collection(db, 'suppliers'))
      );
    } catch (err) {
      console.error('Error reading suppliers collection:', err);
      handleFirestoreError(err, OperationType.GET, 'suppliers');
    }

    if (suppliersSnap && suppliersSnap.empty) {
      console.log('Database empty! Seeding INITIAL_SUPPLIERS...');
      for (const supplier of INITIAL_SUPPLIERS) {
        try {
          await perfMonitor.measureQuery(
            `seed:suppliers/${supplier.id}`,
            () => setDoc(doc(db, 'suppliers', supplier.id), supplier),
            { type: 'mutation' }
          );
        } catch (err) {
          console.error(`Error writing supplier ${supplier.id}:`, err);
          handleFirestoreError(err, OperationType.WRITE, `suppliers/${supplier.id}`);
        }
      }
    }

    // 2. Check to seed Catalog
    let catalogSnap;
    try {
      catalogSnap = await perfMonitor.measureQuery(
        'getDocs:catalog',
        () => getDocs(collection(db, 'catalog'))
      );
    } catch (err) {
      console.error('Error reading catalog collection:', err);
      handleFirestoreError(err, OperationType.GET, 'catalog');
    }

    if (catalogSnap && catalogSnap.empty) {
      console.log('Database empty! Seeding INITIAL_CATALOG_ITEMS...');
      for (const item of INITIAL_CATALOG_ITEMS) {
        try {
          await perfMonitor.measureQuery(
            `seed:catalog/${item.id}`,
            () => setDoc(doc(db, 'catalog', item.id), item),
            { type: 'mutation' }
          );
        } catch (err) {
          console.error(`Error writing catalog item ${item.id}:`, err);
          handleFirestoreError(err, OperationType.WRITE, `catalog/${item.id}`);
        }
      }
    }

    // 3. Check to seed Chats
    let chatsSnap;
    try {
      chatsSnap = await perfMonitor.measureQuery(
        'getDocs:chats',
        () => getDocs(collection(db, 'chats'))
      );
    } catch (err) {
      console.error('Error reading chats collection:', err);
      handleFirestoreError(err, OperationType.GET, 'chats');
    }

    if (chatsSnap && chatsSnap.empty) {
      console.log('Database empty! Seeding INITIAL_CHATS...');
      for (const chat of INITIAL_CHATS) {
        try {
          await perfMonitor.measureQuery(
            `seed:chats/${chat.id}`,
            () => setDoc(doc(db, 'chats', chat.id), chat),
            { type: 'mutation' }
          );
        } catch (err) {
          console.error(`Error writing chat ${chat.id}:`, err);
          handleFirestoreError(err, OperationType.WRITE, `chats/${chat.id}`);
        }
      }
    }

    // 4. Check to seed Stats
    let statsDoc;
    try {
      statsDoc = await perfMonitor.measureQuery(
        'getDoc:stats/global_stats',
        () => getDoc(doc(db, 'stats', 'global_stats'))
      );
    } catch (err) {
      console.error('Error reading stats/global_stats:', err);
      handleFirestoreError(err, OperationType.GET, 'stats/global_stats');
    }

    if (statsDoc && !statsDoc.exists()) {
      console.log('Seeding default stats...');
      try {
        await perfMonitor.measureQuery(
          'seed:stats/global_stats',
          () => setDoc(doc(db, 'stats', 'global_stats'), INITIAL_STATS),
          { type: 'mutation' }
        );
      } catch (err) {
        console.error('Error writing stats/global_stats:', err);
        handleFirestoreError(err, OperationType.WRITE, 'stats/global_stats');
      }
    }

    // 5. Check to seed Truck Profile
    let profileDoc;
    try {
      profileDoc = await perfMonitor.measureQuery(
        'getDoc:truck_profiles/default_profile',
        () => getDoc(doc(db, 'truck_profiles', 'default_profile'))
      );
    } catch (err) {
      console.error('Error reading truck_profiles/default_profile:', err);
      handleFirestoreError(err, OperationType.GET, 'truck_profiles/default_profile');
    }

    if (profileDoc && !profileDoc.exists()) {
      console.log('Seeding default truck profile...');
      try {
        await perfMonitor.measureQuery(
          'seed:truck_profiles/default_profile',
          () => setDoc(doc(db, 'truck_profiles', 'default_profile'), INITIAL_TRUCK_PROFILE),
          { type: 'mutation' }
        );
      } catch (err) {
        console.error('Error writing truck_profiles/default_profile:', err);
        handleFirestoreError(err, OperationType.WRITE, 'truck_profiles/default_profile');
      }
    }

    // 6. Check to seed Sellers
    let sellersSnap;
    try {
      sellersSnap = await perfMonitor.measureQuery(
        'getDocs:sellers',
        () => getDocs(collection(db, 'sellers'))
      );
    } catch (err) {
      console.error('Error reading sellers collection:', err);
      handleFirestoreError(err, OperationType.GET, 'sellers');
    }

    if (sellersSnap && sellersSnap.empty) {
      console.log('Database empty! Seeding INITIAL_SELLERS...');
      for (const seller of INITIAL_SELLERS) {
        try {
          await perfMonitor.measureQuery(
            `seed:sellers/${seller.id}`,
            () => setDoc(doc(db, 'sellers', seller.id), seller),
            { type: 'mutation' }
          );
        } catch (err) {
          console.error(`Error writing seller ${seller.id}:`, err);
          handleFirestoreError(err, OperationType.WRITE, `sellers/${seller.id}`);
        }
      }
    }

    // 7. Check to seed Reviews
    let reviewsSnap;
    try {
      reviewsSnap = await perfMonitor.measureQuery(
        'getDocs:reviews',
        () => getDocs(collection(db, 'reviews'))
      );
    } catch (err) {
      console.error('Error reading reviews collection:', err);
      handleFirestoreError(err, OperationType.GET, 'reviews');
    }

    if (reviewsSnap && reviewsSnap.empty) {
      console.log('Database empty! Seeding INITIAL_REVIEWS...');
      for (const rev of INITIAL_REVIEWS) {
        try {
          await perfMonitor.measureQuery(
            `seed:reviews/${rev.id}`,
            () => setDoc(doc(db, 'reviews', rev.id), rev),
            { type: 'mutation' }
          );
        } catch (err) {
          console.error(`Error writing review ${rev.id}:`, err);
          handleFirestoreError(err, OperationType.WRITE, `reviews/${rev.id}`);
        }
      }
    }

    // 8. Check to seed SOS Requests
    let sosSnap;
    try {
      sosSnap = await perfMonitor.measureQuery(
        'getDocs:sos_requests',
        () => getDocs(collection(db, 'sos_requests'))
      );
    } catch (err) {
      console.error('Error reading sos_requests collection:', err);
      handleFirestoreError(err, OperationType.GET, 'sos_requests');
    }

    if (sosSnap && sosSnap.empty) {
      console.log('Database empty! Seeding INITIAL_SOS_REQUESTS...');
      for (const req of INITIAL_SOS_REQUESTS) {
        try {
          await perfMonitor.measureQuery(
            `seed:sos_requests/${req.id}`,
            () => setDoc(doc(db, 'sos_requests', req.id), req),
            { type: 'mutation' }
          );
        } catch (err) {
          console.error(`Error writing sos_request ${req.id}:`, err);
          handleFirestoreError(err, OperationType.WRITE, `sos_requests/${req.id}`);
        }
      }
    }

    console.log('Database initialized and synced!');
    return true;
  } catch (error) {
    console.error('Failed to initialize database: ', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, 'initial_seeding');
    } catch {}
    return false;
  }
};

// Firestore deletion handler for the catalog management view
export const deleteCatalogItemFromDB = async (itemId: string): Promise<void> => {
  try {
    await perfMonitor.measureQuery(
      `deleteDoc:catalog/${itemId}`,
      () => deleteDoc(doc(db, 'catalog', itemId)),
      { type: 'mutation' }
    );
    // Update local cache too
    const current = loadCatalogItems().filter(i => i.id !== itemId);
    setStorageItem('catalog', current);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `catalog/${itemId}`);
  }
};

export const deleteSOSRequestFromDB = async (requestId: string): Promise<void> => {
  try {
    await perfMonitor.measureQuery(
      `deleteDoc:sos_requests/${requestId}`,
      () => deleteDoc(doc(db, 'sos_requests', requestId)),
      { type: 'mutation' }
    );
    // Update local cache too
    const current = loadSOSRequests().filter(r => r.id !== requestId);
    setStorageItem('sos_requests', current);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `sos_requests/${requestId}`);
  }
};

// Helper for resetting to factory settings
export const resetToDefaults = (): void => {
  localStorage.removeItem('imperio_pesados_suppliers');
  localStorage.removeItem('imperio_pesados_catalog');
  localStorage.removeItem('imperio_pesados_chats');
  localStorage.removeItem('imperio_pesados_truck_profile');
  localStorage.removeItem('imperio_pesados_sos_requests');
  localStorage.removeItem('imperio_pesados_stats');
  
  // Clean db elements in background if accessible
  INITIAL_SUPPLIERS.forEach(s => setDoc(doc(db, 'suppliers', s.id), s).catch(() => {}));
  INITIAL_CATALOG_ITEMS.forEach(c => setDoc(doc(db, 'catalog', c.id), c).catch(() => {}));
  INITIAL_CHATS.forEach(ch => setDoc(doc(db, 'chats', ch.id), ch).catch(() => {}));
  setDoc(doc(db, 'stats', 'global_stats'), INITIAL_STATS).catch(() => {});
  setDoc(doc(db, 'truck_profiles', 'default_profile'), INITIAL_TRUCK_PROFILE).catch(() => {});
};

// Compliance: Account deletion to meet Apple and Google App Store mandates
export const deleteUserAccountFromDB = async (nameOrId: string, role: 'trucker' | 'supplier' | 'seller'): Promise<void> => {
  try {
    if (role === 'supplier' || role === 'seller') {
      const currentSuppliers = loadSuppliers();
      const matches = currentSuppliers.filter(s => s.id === nameOrId || s.name.toLowerCase() === nameOrId.toLowerCase());
      for (const s of matches) {
        // Delete supplier from Firestore
        await deleteDoc(doc(db, 'suppliers', s.id));
        
        // Delete elements from catalogs
        const items = loadCatalogItems();
        const myItems = items.filter(item => item.supplierId === s.id);
        for (const item of myItems) {
          await deleteDoc(doc(db, 'catalog', item.id));
        }
        
        // Remove from local cache
        const remainingSuppliers = currentSuppliers.filter(su => su.id !== s.id);
        setStorageItem('suppliers', remainingSuppliers);
        
        const remainingItems = items.filter(item => item.supplierId !== s.id);
        setStorageItem('catalog', remainingItems);
      }
    } else {
      // Clear all local database cache for trucker
      localStorage.removeItem('imperio_pesados_truck_profile');
      localStorage.removeItem('imperio_pesados_sos_requests');
      localStorage.removeItem('imperio_pesados_chats');
      
      const userKey = nameOrId.trim().toLowerCase();
      localStorage.removeItem(`imperio_niche_${userKey}`);
      localStorage.removeItem('imperio_pesados_biometric_profile');
    }
  } catch (error) {
    console.error('Failed to execute compliant account deletion:', error);
    throw error;
  }
};

// Re-export pagination utilities for convenient access
export { fetchPaginatedSuppliers, fetchPaginatedCatalog } from './services/firestorePagination';
export type { SupplierPaginationOptions, CatalogPaginationOptions, PaginatedResult } from './services/firestorePagination';
export { indexAdvisor, RECOMMENDED_INDEXES } from './services/indexAdvisor';



