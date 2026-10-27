/**
 * Orbitron RPG Cósmico — Definições de Patentes e Conquistas Recalibradas
 * 308 marcos temáticos estelares calibrados para a escala real da vida humana (1 dia a 5 anos).
 */

const LEVEL_TITLES = [
  {
    "from": 1,
    "title": "Recruta Orbital"
  },
  {
    "from": 3,
    "title": "Explorador Novato"
  },
  {
    "from": 5,
    "title": "Piloto Espacial"
  },
  {
    "from": 6,
    "title": "Navegador"
  },
  {
    "from": 8,
    "title": "Cartógrafo Estelar"
  },
  {
    "from": 10,
    "title": "Comandante Orbital"
  },
  {
    "from": 11,
    "title": "Pioneiro Cósmico"
  },
  {
    "from": 13,
    "title": "Explorador Planetário"
  },
  {
    "from": 15,
    "title": "Colonizador Estelar"
  },
  {
    "from": 16,
    "title": "Navegador Interestelar"
  },
  {
    "from": 18,
    "title": "Especialista Estelar"
  },
  {
    "from": 20,
    "title": "Almirante Cósmico"
  },
  {
    "from": 21,
    "title": "Guardião Galáctico"
  },
  {
    "from": 23,
    "title": "Estrategista Cósmico"
  },
  {
    "from": 25,
    "title": "Senhor das Estrelas"
  },
  {
    "from": 26,
    "title": "Explorador do Abismo"
  },
  {
    "from": 28,
    "title": "Mestre Gravitacional"
  },
  {
    "from": 30,
    "title": "Lenda Interestelar"
  },
  {
    "from": 31,
    "title": "Pioneiro do Cosmos"
  },
  {
    "from": 33,
    "title": "Arquiteto Estelar"
  },
  {
    "from": 35,
    "title": "Soberano Galáctico"
  },
  {
    "from": 36,
    "title": "Engenheiro Cósmico"
  },
  {
    "from": 38,
    "title": "Arquiteto Galáctico"
  },
  {
    "from": 40,
    "title": "Regente Estelar"
  },
  {
    "from": 41,
    "title": "Viajante Intergaláctico"
  },
  {
    "from": 43,
    "title": "Entidade Estelar"
  },
  {
    "from": 45,
    "title": "Soberano do Infinito"
  },
  {
    "from": 46,
    "title": "Guardião da Singularidade"
  },
  {
    "from": 48,
    "title": "Consciência Cósmica"
  },
  {
    "from": 50,
    "title": "Arquiteto do Universo"
  }
];

const ACHIEVEMENTS = [
  {
    "id": "primeiro_extrato",
    "name": "Primeiro Sinal Detectado",
    "description": "Alcance 1 extratos importados no Orbitron.",
    "rarity": "comum",
    "icon": "FileUp",
    "category": "imports",
    "metric": "statements",
    "target": 1
  },
  {
    "id": "extratos_3",
    "name": "Sonda de Dados",
    "description": "Alcance 2 extratos importados no Orbitron.",
    "rarity": "comum",
    "icon": "FileUp",
    "category": "imports",
    "metric": "statements",
    "target": 2
  },
  {
    "id": "extratos_5",
    "name": "Três Transmissões",
    "description": "Alcance 3 extratos importados no Orbitron.",
    "rarity": "comum",
    "icon": "FolderArchive",
    "category": "imports",
    "metric": "statements",
    "target": 3
  },
  {
    "id": "extratos_10",
    "name": "Arquivo Orbital",
    "description": "Alcance 4 extratos importados no Orbitron.",
    "rarity": "comum",
    "icon": "FolderArchive",
    "category": "imports",
    "metric": "statements",
    "target": 4
  },
  {
    "id": "extratos_25",
    "name": "Cartógrafo de Extratos",
    "description": "Alcance 6 extratos importados no Orbitron.",
    "rarity": "comum",
    "icon": "Library",
    "category": "imports",
    "metric": "statements",
    "target": 6
  },
  {
    "id": "extratos_50",
    "name": "Biblioteca Estelar",
    "description": "Alcance 8 extratos importados no Orbitron.",
    "rarity": "raro",
    "icon": "Library",
    "category": "imports",
    "metric": "statements",
    "target": 8
  },
  {
    "id": "extratos_100",
    "name": "Guardião do Registro",
    "description": "Alcance 10 extratos importados no Orbitron.",
    "rarity": "raro",
    "icon": "Library",
    "category": "imports",
    "metric": "statements",
    "target": 10
  },
  {
    "id": "semanas_2",
    "name": "Rota de Dados Estável",
    "description": "Alcance 16 semanas consecutivas no Orbitron.",
    "rarity": "raro",
    "icon": "CalendarCheck",
    "category": "imports",
    "metric": "importStreak",
    "target": 16
  },
  {
    "id": "semanas_4",
    "name": "Ritmo de Transmissão",
    "description": "Alcance 20 semanas consecutivas no Orbitron.",
    "rarity": "raro",
    "icon": "CalendarCheck",
    "category": "imports",
    "metric": "importStreak",
    "target": 20
  },
  {
    "id": "semanas_8",
    "name": "Pulso Interestelar",
    "description": "Alcance 24 semanas consecutivas no Orbitron.",
    "rarity": "raro",
    "icon": "CalendarCheck",
    "category": "imports",
    "metric": "importStreak",
    "target": 24
  },
  {
    "id": "semanas_12",
    "name": "Constelação de Registros",
    "description": "Alcance 28 semanas consecutivas no Orbitron.",
    "rarity": "epico",
    "icon": "CalendarCheck",
    "category": "imports",
    "metric": "importStreak",
    "target": 28
  },
  {
    "id": "semanas_24",
    "name": "Arquivo do Cosmos",
    "description": "Alcance 32 semanas consecutivas no Orbitron.",
    "rarity": "epico",
    "icon": "Crown",
    "category": "imports",
    "metric": "importStreak",
    "target": 32
  },
  {
    "id": "orb_01_13",
    "name": "Observatório Financeiro",
    "description": "Alcance 36 extratos importados no Orbitron.",
    "rarity": "epico",
    "icon": "Satellite",
    "category": "imports",
    "metric": "statements",
    "target": 36
  },
  {
    "id": "orb_01_14",
    "name": "Explorador de Histórico",
    "description": "Alcance 40 semanas consecutivas no Orbitron.",
    "rarity": "epico",
    "icon": "CalendarCheck",
    "category": "imports",
    "metric": "importStreak",
    "target": 40
  },
  {
    "id": "orb_01_15",
    "name": "Navegador de Dados",
    "description": "Alcance 60 extratos importados no Orbitron.",
    "rarity": "epico",
    "icon": "Satellite",
    "category": "imports",
    "metric": "statements",
    "target": 60
  },
  {
    "id": "orb_01_16",
    "name": "Mestre da Cartografia",
    "description": "Alcance 48 semanas consecutivas no Orbitron.",
    "rarity": "epico",
    "icon": "CalendarCheck",
    "category": "imports",
    "metric": "importStreak",
    "target": 48
  },
  {
    "id": "orb_01_17",
    "name": "Sentinela de Transmissões",
    "description": "Alcance 84 extratos importados no Orbitron.",
    "rarity": "lendario",
    "icon": "Satellite",
    "category": "imports",
    "metric": "statements",
    "target": 84
  },
  {
    "id": "orb_01_18",
    "name": "Atlas de Extratos",
    "description": "Alcance 60 semanas consecutivas no Orbitron.",
    "rarity": "lendario",
    "icon": "CalendarCheck",
    "category": "imports",
    "metric": "importStreak",
    "target": 60
  },
  {
    "id": "orb_01_19",
    "name": "Cronista Galáctico",
    "description": "Alcance 108 extratos importados no Orbitron.",
    "rarity": "lendario",
    "icon": "Satellite",
    "category": "imports",
    "metric": "statements",
    "target": 108
  },
  {
    "id": "orb_01_20",
    "name": "Arquivo Infinito",
    "description": "Alcance 80 semanas consecutivas no Orbitron.",
    "rarity": "lendario",
    "icon": "CalendarCheck",
    "category": "imports",
    "metric": "importStreak",
    "target": 80
  },
  {
    "id": "orb_01_21",
    "name": "Oráculo de Dados",
    "description": "Alcance 140 extratos importados no Orbitron.",
    "rarity": "lendario",
    "icon": "Satellite",
    "category": "imports",
    "metric": "statements",
    "target": 140
  },
  {
    "id": "orb_01_22",
    "name": "Lenda da Cartografia",
    "description": "Alcance 104 semanas consecutivas no Orbitron.",
    "rarity": "lendario",
    "icon": "CalendarCheck",
    "category": "imports",
    "metric": "importStreak",
    "target": 104
  },
  {
    "id": "categorizador_10",
    "name": "Primeiro Mapa de Gastos",
    "description": "Alcance 10 lançamentos categorizados no Orbitron.",
    "rarity": "comum",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 10
  },
  {
    "id": "categorizador_50",
    "name": "Sinal Classificado",
    "description": "Alcance 25 lançamentos categorizados no Orbitron.",
    "rarity": "comum",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 25
  },
  {
    "id": "categorizador_100",
    "name": "Órbita Organizada",
    "description": "Alcance 50 lançamentos categorizados no Orbitron.",
    "rarity": "comum",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 50
  },
  {
    "id": "categorizador_250",
    "name": "Navegador de Categorias",
    "description": "Alcance 75 lançamentos categorizados no Orbitron.",
    "rarity": "comum",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 75
  },
  {
    "id": "categorizador_500",
    "name": "Cartógrafo Financeiro",
    "description": "Alcance 100 lançamentos categorizados no Orbitron.",
    "rarity": "comum",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 100
  },
  {
    "id": "categorizador_1000",
    "name": "Sistema em Ordem",
    "description": "Alcance 150 lançamentos categorizados no Orbitron.",
    "rarity": "raro",
    "icon": "GraduationCap",
    "category": "categorization",
    "metric": "categorized",
    "target": 150
  },
  {
    "id": "categorizador_2000",
    "name": "Analista de Constelações",
    "description": "Alcance 200 lançamentos categorizados no Orbitron.",
    "rarity": "raro",
    "icon": "GraduationCap",
    "category": "categorization",
    "metric": "categorized",
    "target": 200
  },
  {
    "id": "categorizador_5000",
    "name": "Mestre dos Setores",
    "description": "Alcance 300 lançamentos categorizados no Orbitron.",
    "rarity": "raro",
    "icon": "Crown",
    "category": "categorization",
    "metric": "categorized",
    "target": 300
  },
  {
    "id": "caixa_zero_20",
    "name": "Explorador de Padrões",
    "description": "Alcance 1 caixa de entrada zerada no Orbitron.",
    "rarity": "raro",
    "icon": "Inbox",
    "category": "categorization",
    "metric": "inboxZero20",
    "target": 1
  },
  {
    "id": "caixa_zero",
    "name": "Nebulosa Organizada",
    "description": "Alcance 1 caixa de entrada zerada no Orbitron.",
    "rarity": "raro",
    "icon": "Inbox",
    "category": "categorization",
    "metric": "inboxZero",
    "target": 1
  },
  {
    "id": "caixa_zero_100",
    "name": "Radar de Lançamentos",
    "description": "Alcance 1 caixa de entrada zerada no Orbitron.",
    "rarity": "epico",
    "icon": "Inbox",
    "category": "categorization",
    "metric": "inboxZero100",
    "target": 1
  },
  {
    "id": "caixa_zero_250",
    "name": "Centro de Comando Limpo",
    "description": "Alcance 1 caixa de entrada zerada no Orbitron.",
    "rarity": "epico",
    "icon": "Crown",
    "category": "categorization",
    "metric": "inboxZero250",
    "target": 1
  },
  {
    "id": "orb_02_13",
    "name": "Guardião da Ordem",
    "description": "Alcance 2000 lançamentos categorizados no Orbitron.",
    "rarity": "epico",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 2000
  },
  {
    "id": "orb_02_14",
    "name": "Mente Cartográfica",
    "description": "Alcance 2500 lançamentos categorizados no Orbitron.",
    "rarity": "epico",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 2500
  },
  {
    "id": "orb_02_15",
    "name": "Atlas de Categorias",
    "description": "Alcance 3500 lançamentos categorizados no Orbitron.",
    "rarity": "epico",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 3500
  },
  {
    "id": "orb_02_16",
    "name": "Especialista em Órbitas",
    "description": "Alcance 4500 lançamentos categorizados no Orbitron.",
    "rarity": "epico",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 4500
  },
  {
    "id": "orb_02_17",
    "name": "Sintonizador de Dados",
    "description": "Alcance 6000 lançamentos categorizados no Orbitron.",
    "rarity": "lendario",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 6000
  },
  {
    "id": "orb_02_18",
    "name": "Mestre da Classificação",
    "description": "Alcance 7500 lançamentos categorizados no Orbitron.",
    "rarity": "lendario",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 7500
  },
  {
    "id": "orb_02_19",
    "name": "Oráculo da Organização",
    "description": "Alcance 8500 lançamentos categorizados no Orbitron.",
    "rarity": "lendario",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 8500
  },
  {
    "id": "orb_02_20",
    "name": "Constelação Perfeita",
    "description": "Alcance 10000 lançamentos categorizados no Orbitron.",
    "rarity": "lendario",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 10000
  },
  {
    "id": "orb_02_21",
    "name": "Precisão Galáctica",
    "description": "Alcance 12000 lançamentos categorizados no Orbitron.",
    "rarity": "lendario",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 12000
  },
  {
    "id": "orb_02_22",
    "name": "Singularidade Organizada",
    "description": "Alcance 15000 lançamentos categorizados no Orbitron.",
    "rarity": "lendario",
    "icon": "Tags",
    "category": "categorization",
    "metric": "categorized",
    "target": 15000
  },
  {
    "id": "mes_azul",
    "name": "Primeiro Mês em Órbita Positiva",
    "description": "Alcance 1 meses positivos no Orbitron.",
    "rarity": "comum",
    "icon": "TrendingUp",
    "category": "positive_months",
    "metric": "positiveMonths",
    "target": 1
  },
  {
    "id": "azul_2",
    "name": "Trajetória Ascendente",
    "description": "Alcance 3 meses positivos consecutivos no Orbitron.",
    "rarity": "comum",
    "icon": "TrendingUp",
    "category": "positive_months",
    "metric": "positiveStreak",
    "target": 3
  },
  {
    "id": "azul_3",
    "name": "Duas Órbitas Favoráveis",
    "description": "Alcance 3 meses positivos consecutivos no Orbitron.",
    "rarity": "raro",
    "icon": "Flame",
    "category": "positive_months",
    "metric": "positiveStreak",
    "target": 3
  },
  {
    "id": "azul_6",
    "name": "Trimestre Estável",
    "description": "Alcance 5 meses positivos consecutivos no Orbitron.",
    "rarity": "comum",
    "icon": "Flame",
    "category": "positive_months",
    "metric": "positiveStreak",
    "target": 5
  },
  {
    "id": "azul_9",
    "name": "Semestre de Estabilidade",
    "description": "Alcance 6 meses positivos consecutivos no Orbitron.",
    "rarity": "comum",
    "icon": "Flame",
    "category": "positive_months",
    "metric": "positiveStreak",
    "target": 6
  },
  {
    "id": "azul_12",
    "name": "Nove Luas Positivas",
    "description": "Alcance 7 meses positivos consecutivos no Orbitron.",
    "rarity": "raro",
    "icon": "Crown",
    "category": "positive_months",
    "metric": "positiveStreak",
    "target": 7
  },
  {
    "id": "azul_18",
    "name": "Ano de Ouro Estelar",
    "description": "Alcance 8 meses positivos consecutivos no Orbitron.",
    "rarity": "raro",
    "icon": "Crown",
    "category": "positive_months",
    "metric": "positiveStreak",
    "target": 8
  },
  {
    "id": "total_meses_azul_3",
    "name": "Constância Cósmica",
    "description": "Alcance 12 meses positivos no Orbitron.",
    "rarity": "raro",
    "icon": "TrendingUp",
    "category": "positive_months",
    "metric": "positiveMonths",
    "target": 12
  },
  {
    "id": "total_meses_azul_6",
    "name": "Três Vitórias Orbitais",
    "description": "Alcance 15 meses positivos no Orbitron.",
    "rarity": "raro",
    "icon": "TrendingUp",
    "category": "positive_months",
    "metric": "positiveMonths",
    "target": 15
  },
  {
    "id": "total_meses_azul_12",
    "name": "Meia Órbita Vitoriosa",
    "description": "Alcance 18 meses positivos no Orbitron.",
    "rarity": "raro",
    "icon": "Trophy",
    "category": "positive_months",
    "metric": "positiveMonths",
    "target": 18
  },
  {
    "id": "total_meses_azul_24",
    "name": "Doze Ciclos de Sucesso",
    "description": "Alcance 21 meses positivos no Orbitron.",
    "rarity": "epico",
    "icon": "Trophy",
    "category": "positive_months",
    "metric": "positiveMonths",
    "target": 21
  },
  {
    "id": "orb_03_12",
    "name": "Dois Anos de Expansão",
    "description": "Alcance 24 meses positivos no Orbitron.",
    "rarity": "epico",
    "icon": "TrendingUp",
    "category": "positive_months",
    "metric": "positiveMonths",
    "target": 24
  },
  {
    "id": "orb_03_13",
    "name": "Rota Financeira Segura",
    "description": "Alcance 18 meses positivos consecutivos no Orbitron.",
    "rarity": "epico",
    "icon": "Flame",
    "category": "positive_months",
    "metric": "positiveStreak",
    "target": 18
  },
  {
    "id": "orb_03_14",
    "name": "Estabilidade de Marte",
    "description": "Alcance 32 meses positivos no Orbitron.",
    "rarity": "epico",
    "icon": "TrendingUp",
    "category": "positive_months",
    "metric": "positiveMonths",
    "target": 32
  },
  {
    "id": "orb_03_15",
    "name": "Órbita de Júpiter",
    "description": "Alcance 22 meses positivos consecutivos no Orbitron.",
    "rarity": "epico",
    "icon": "Flame",
    "category": "positive_months",
    "metric": "positiveStreak",
    "target": 22
  },
  {
    "id": "orb_03_16",
    "name": "Sistema em Equilíbrio",
    "description": "Alcance 40 meses positivos no Orbitron.",
    "rarity": "epico",
    "icon": "TrendingUp",
    "category": "positive_months",
    "metric": "positiveMonths",
    "target": 40
  },
  {
    "id": "orb_03_17",
    "name": "Ciclo de Prosperidade",
    "description": "Alcance 27 meses positivos consecutivos no Orbitron.",
    "rarity": "lendario",
    "icon": "Flame",
    "category": "positive_months",
    "metric": "positiveStreak",
    "target": 27
  },
  {
    "id": "orb_03_18",
    "name": "Constelação Favorável",
    "description": "Alcance 48 meses positivos no Orbitron.",
    "rarity": "lendario",
    "icon": "TrendingUp",
    "category": "positive_months",
    "metric": "positiveMonths",
    "target": 48
  },
  {
    "id": "orb_03_19",
    "name": "Ano-Luz de Progresso",
    "description": "Alcance 33 meses positivos consecutivos no Orbitron.",
    "rarity": "lendario",
    "icon": "Flame",
    "category": "positive_months",
    "metric": "positiveStreak",
    "target": 33
  },
  {
    "id": "orb_03_20",
    "name": "Domínio da Trajetória",
    "description": "Alcance 56 meses positivos no Orbitron.",
    "rarity": "lendario",
    "icon": "TrendingUp",
    "category": "positive_months",
    "metric": "positiveMonths",
    "target": 56
  },
  {
    "id": "orb_03_21",
    "name": "Horizonte Financeiro",
    "description": "Alcance 42 meses positivos consecutivos no Orbitron.",
    "rarity": "lendario",
    "icon": "Flame",
    "category": "positive_months",
    "metric": "positiveStreak",
    "target": 42
  },
  {
    "id": "orb_03_22",
    "name": "Equilíbrio Universal",
    "description": "Alcance 72 meses positivos no Orbitron.",
    "rarity": "lendario",
    "icon": "TrendingUp",
    "category": "positive_months",
    "metric": "positiveMonths",
    "target": 72
  },
  {
    "id": "primeira_reserva",
    "name": "Primeiro Escudo Ativado",
    "description": "Alcance 1 aportes realizados no Orbitron.",
    "rarity": "comum",
    "icon": "PiggyBank",
    "category": "reserve",
    "metric": "reserveAportes",
    "target": 1
  },
  {
    "id": "aportes_3",
    "name": "Reserva em Formação",
    "description": "Alcance 2 aportes realizados no Orbitron.",
    "rarity": "comum",
    "icon": "PiggyBank",
    "category": "reserve",
    "metric": "reserveAportes",
    "target": 2
  },
  {
    "id": "aportes_6",
    "name": "Três Cargas de Energia",
    "description": "Alcance 3 aportes realizados no Orbitron.",
    "rarity": "comum",
    "icon": "PiggyBank",
    "category": "reserve",
    "metric": "reserveAportes",
    "target": 3
  },
  {
    "id": "aportes_12",
    "name": "Escudo Reforçado",
    "description": "Alcance 4 aportes realizados no Orbitron.",
    "rarity": "comum",
    "icon": "PiggyBank",
    "category": "reserve",
    "metric": "reserveAportes",
    "target": 4
  },
  {
    "id": "aportes_24",
    "name": "Doze Reabastecimentos",
    "description": "Alcance 6 aportes realizados no Orbitron.",
    "rarity": "comum",
    "icon": "PiggyBank",
    "category": "reserve",
    "metric": "reserveAportes",
    "target": 6
  },
  {
    "id": "reserva_meio_mes",
    "name": "Muralha Planetária",
    "description": "Alcance 3 meses de cobertura no Orbitron.",
    "rarity": "raro",
    "icon": "Shield",
    "category": "reserve",
    "metric": "reserveCoverage",
    "target": 3
  },
  {
    "id": "reserva_1",
    "name": "Meio Mês Protegido",
    "description": "Alcance 3.5 meses de cobertura no Orbitron.",
    "rarity": "raro",
    "icon": "Shield",
    "category": "reserve",
    "metric": "reserveCoverage",
    "target": 3.5
  },
  {
    "id": "reserva_2",
    "name": "Um Mês de Oxigênio",
    "description": "Alcance 4 meses de cobertura no Orbitron.",
    "rarity": "raro",
    "icon": "ShieldCheck",
    "category": "reserve",
    "metric": "reserveCoverage",
    "target": 4
  },
  {
    "id": "reserva_3",
    "name": "Escudo Duplo",
    "description": "Alcance 4.5 meses de cobertura no Orbitron.",
    "rarity": "raro",
    "icon": "ShieldCheck",
    "category": "reserve",
    "metric": "reserveCoverage",
    "target": 4.5
  },
  {
    "id": "reserva_6",
    "name": "Colônia Segura",
    "description": "Alcance 5 meses de cobertura no Orbitron.",
    "rarity": "raro",
    "icon": "Castle",
    "category": "reserve",
    "metric": "reserveCoverage",
    "target": 5
  },
  {
    "id": "reserva_completa",
    "name": "Fortaleza de Seis Luas",
    "description": "Alcance 1 meta da reserva concluída no Orbitron.",
    "rarity": "epico",
    "icon": "Castle",
    "category": "reserve",
    "metric": "reserveComplete",
    "target": 1
  },
  {
    "id": "orb_04_12",
    "name": "Bastião Financeiro",
    "description": "Alcance 24 aportes realizados no Orbitron.",
    "rarity": "epico",
    "icon": "Orbit",
    "category": "reserve",
    "metric": "reserveAportes",
    "target": 24
  },
  {
    "id": "orb_04_13",
    "name": "Protetor da Órbita",
    "description": "Alcance 6.5 meses de cobertura no Orbitron.",
    "rarity": "epico",
    "icon": "Shield",
    "category": "reserve",
    "metric": "reserveCoverage",
    "target": 6.5
  },
  {
    "id": "orb_04_14",
    "name": "Reserva de Titã",
    "description": "Alcance 7 meses de cobertura no Orbitron.",
    "rarity": "epico",
    "icon": "Shield",
    "category": "reserve",
    "metric": "reserveCoverage",
    "target": 7
  },
  {
    "id": "orb_04_15",
    "name": "Escudo de Saturno",
    "description": "Alcance 36 aportes realizados no Orbitron.",
    "rarity": "epico",
    "icon": "Orbit",
    "category": "reserve",
    "metric": "reserveAportes",
    "target": 36
  },
  {
    "id": "orb_04_16",
    "name": "Barreira Interestelar",
    "description": "Alcance 8 meses de cobertura no Orbitron.",
    "rarity": "epico",
    "icon": "Shield",
    "category": "reserve",
    "metric": "reserveCoverage",
    "target": 8
  },
  {
    "id": "orb_04_17",
    "name": "Refúgio de Emergência",
    "description": "Alcance 44 aportes realizados no Orbitron.",
    "rarity": "lendario",
    "icon": "Orbit",
    "category": "reserve",
    "metric": "reserveAportes",
    "target": 44
  },
  {
    "id": "orb_04_18",
    "name": "Defesa de Longo Alcance",
    "description": "Alcance 48 aportes realizados no Orbitron.",
    "rarity": "lendario",
    "icon": "Orbit",
    "category": "reserve",
    "metric": "reserveAportes",
    "target": 48
  },
  {
    "id": "orb_04_19",
    "name": "Muralha de Andrômeda",
    "description": "Alcance 10.5 meses de cobertura no Orbitron.",
    "rarity": "lendario",
    "icon": "Shield",
    "category": "reserve",
    "metric": "reserveCoverage",
    "target": 10.5
  },
  {
    "id": "orb_04_20",
    "name": "Fortaleza Completa",
    "description": "Alcance 11 meses de cobertura no Orbitron.",
    "rarity": "lendario",
    "icon": "Shield",
    "category": "reserve",
    "metric": "reserveCoverage",
    "target": 11
  },
  {
    "id": "orb_04_21",
    "name": "Guardião do Sistema",
    "description": "Alcance 60 aportes realizados no Orbitron.",
    "rarity": "lendario",
    "icon": "Orbit",
    "category": "reserve",
    "metric": "reserveAportes",
    "target": 60
  },
  {
    "id": "orb_04_22",
    "name": "Escudo do Infinito",
    "description": "Alcance 12 meses de cobertura no Orbitron.",
    "rarity": "lendario",
    "icon": "Shield",
    "category": "reserve",
    "metric": "reserveCoverage",
    "target": 12
  },
  {
    "id": "fatura_1",
    "name": "Primeira Fatura em Dia",
    "description": "Alcance 1 faturas pagas em dia no Orbitron.",
    "rarity": "comum",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 1
  },
  {
    "id": "fatura_3",
    "name": "Piloto Pontual",
    "description": "Alcance 2 faturas pagas em dia no Orbitron.",
    "rarity": "comum",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 2
  },
  {
    "id": "fatura_6",
    "name": "Três Ciclos sem Atraso",
    "description": "Alcance 3 faturas pagas em dia no Orbitron.",
    "rarity": "comum",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 3
  },
  {
    "id": "fatura_12",
    "name": "Cartão sob Controle",
    "description": "Alcance 4 faturas pagas em dia no Orbitron.",
    "rarity": "comum",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 4
  },
  {
    "id": "fatura_18",
    "name": "Seis Órbitas Pontuais",
    "description": "Alcance 5 faturas pagas em dia no Orbitron.",
    "rarity": "comum",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 5
  },
  {
    "id": "fatura_24",
    "name": "Crédito de Ouro",
    "description": "Alcance 6 faturas pagas em dia no Orbitron.",
    "rarity": "raro",
    "icon": "Crown",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 6
  },
  {
    "id": "orb_05_07",
    "name": "Mestre dos Vencimentos",
    "description": "Alcance 8 faturas pagas em dia no Orbitron.",
    "rarity": "raro",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 8
  },
  {
    "id": "orb_05_08",
    "name": "Calendário Estelar",
    "description": "Alcance 10 faturas pagas em dia no Orbitron.",
    "rarity": "raro",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 10
  },
  {
    "id": "orb_05_09",
    "name": "Alinhamento de Pagamentos",
    "description": "Alcance 12 faturas pagas em dia no Orbitron.",
    "rarity": "raro",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 12
  },
  {
    "id": "orb_05_10",
    "name": "Rota sem Multas",
    "description": "Alcance 15 faturas pagas em dia no Orbitron.",
    "rarity": "raro",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 15
  },
  {
    "id": "orb_05_11",
    "name": "Sentinela do Vencimento",
    "description": "Alcance 18 faturas pagas em dia no Orbitron.",
    "rarity": "epico",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 18
  },
  {
    "id": "orb_05_12",
    "name": "Precisão Orbital",
    "description": "Alcance 21 faturas pagas em dia no Orbitron.",
    "rarity": "epico",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 21
  },
  {
    "id": "orb_05_13",
    "name": "Ciclo de Crédito Seguro",
    "description": "Alcance 24 faturas pagas em dia no Orbitron.",
    "rarity": "epico",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 24
  },
  {
    "id": "orb_05_14",
    "name": "Comandante Pontual",
    "description": "Alcance 28 faturas pagas em dia no Orbitron.",
    "rarity": "epico",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 28
  },
  {
    "id": "orb_05_15",
    "name": "Navegação sem Juros",
    "description": "Alcance 32 faturas pagas em dia no Orbitron.",
    "rarity": "epico",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 32
  },
  {
    "id": "orb_05_16",
    "name": "Protocolo de Pagamento",
    "description": "Alcance 36 faturas pagas em dia no Orbitron.",
    "rarity": "epico",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 36
  },
  {
    "id": "orb_05_17",
    "name": "Escudo contra Atrasos",
    "description": "Alcance 40 faturas pagas em dia no Orbitron.",
    "rarity": "lendario",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 40
  },
  {
    "id": "orb_05_18",
    "name": "Mestre da Fatura",
    "description": "Alcance 44 faturas pagas em dia no Orbitron.",
    "rarity": "lendario",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 44
  },
  {
    "id": "orb_05_19",
    "name": "Órbita de Precisão",
    "description": "Alcance 48 faturas pagas em dia no Orbitron.",
    "rarity": "lendario",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 48
  },
  {
    "id": "orb_05_20",
    "name": "Sistema de Crédito Estável",
    "description": "Alcance 52 faturas pagas em dia no Orbitron.",
    "rarity": "lendario",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 52
  },
  {
    "id": "orb_05_21",
    "name": "Guardião do Calendário",
    "description": "Alcance 56 faturas pagas em dia no Orbitron.",
    "rarity": "lendario",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 56
  },
  {
    "id": "orb_05_22",
    "name": "Lenda da Pontualidade",
    "description": "Alcance 60 faturas pagas em dia no Orbitron.",
    "rarity": "lendario",
    "icon": "CreditCard",
    "category": "invoices",
    "metric": "invoicesOnTime",
    "target": 60
  },
  {
    "id": "orcamento_1",
    "name": "Primeiro Limite Respeitado",
    "description": "Alcance 1 tetos cumpridos no Orbitron.",
    "rarity": "comum",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 1
  },
  {
    "id": "orcamento_3",
    "name": "Controle de Propulsão",
    "description": "Alcance 2 tetos cumpridos no Orbitron.",
    "rarity": "comum",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 2
  },
  {
    "id": "orcamento_5",
    "name": "Três Limites Cumpridos",
    "description": "Alcance 3 tetos cumpridos no Orbitron.",
    "rarity": "comum",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 3
  },
  {
    "id": "orcamento_10",
    "name": "Dentro da Órbita",
    "description": "Alcance 5 tetos cumpridos no Orbitron.",
    "rarity": "comum",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 5
  },
  {
    "id": "orcamento_15",
    "name": "Cinco Setores Controlados",
    "description": "Alcance 8 tetos cumpridos no Orbitron.",
    "rarity": "comum",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 8
  },
  {
    "id": "orcamento_25",
    "name": "Mestre do Orçamento",
    "description": "Alcance 12 tetos cumpridos no Orbitron.",
    "rarity": "raro",
    "icon": "Crown",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 12
  },
  {
    "id": "orb_06_07",
    "name": "Guardião de Recursos",
    "description": "Alcance 16 tetos cumpridos no Orbitron.",
    "rarity": "raro",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 16
  },
  {
    "id": "orb_06_08",
    "name": "Rota sem Excesso",
    "description": "Alcance 20 tetos cumpridos no Orbitron.",
    "rarity": "raro",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 20
  },
  {
    "id": "orb_06_09",
    "name": "Sistema de Consumo Estável",
    "description": "Alcance 25 tetos cumpridos no Orbitron.",
    "rarity": "raro",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 25
  },
  {
    "id": "orb_06_10",
    "name": "Controle de Combustível",
    "description": "Alcance 30 tetos cumpridos no Orbitron.",
    "rarity": "raro",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 30
  },
  {
    "id": "orb_06_11",
    "name": "Piloto Econômico",
    "description": "Alcance 40 tetos cumpridos no Orbitron.",
    "rarity": "epico",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 40
  },
  {
    "id": "orb_06_12",
    "name": "Comandante dos Recursos",
    "description": "Alcance 50 tetos cumpridos no Orbitron.",
    "rarity": "epico",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 50
  },
  {
    "id": "orb_06_13",
    "name": "Limites em Harmonia",
    "description": "Alcance 65 tetos cumpridos no Orbitron.",
    "rarity": "epico",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 65
  },
  {
    "id": "orb_06_14",
    "name": "Especialista em Consumo",
    "description": "Alcance 80 tetos cumpridos no Orbitron.",
    "rarity": "epico",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 80
  },
  {
    "id": "orb_06_15",
    "name": "Órbita Sustentável",
    "description": "Alcance 100 tetos cumpridos no Orbitron.",
    "rarity": "epico",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 100
  },
  {
    "id": "orb_06_16",
    "name": "Gestor de Energia",
    "description": "Alcance 125 tetos cumpridos no Orbitron.",
    "rarity": "epico",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 125
  },
  {
    "id": "orb_06_17",
    "name": "Sentinela do Orçamento",
    "description": "Alcance 150 tetos cumpridos no Orbitron.",
    "rarity": "lendario",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 150
  },
  {
    "id": "orb_06_18",
    "name": "Domínio dos Setores",
    "description": "Alcance 180 tetos cumpridos no Orbitron.",
    "rarity": "lendario",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 180
  },
  {
    "id": "orb_06_19",
    "name": "Controle de Precisão",
    "description": "Alcance 220 tetos cumpridos no Orbitron.",
    "rarity": "lendario",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 220
  },
  {
    "id": "orb_06_20",
    "name": "Equilíbrio de Recursos",
    "description": "Alcance 260 tetos cumpridos no Orbitron.",
    "rarity": "lendario",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 260
  },
  {
    "id": "orb_06_21",
    "name": "Guardião da Eficiência",
    "description": "Alcance 300 tetos cumpridos no Orbitron.",
    "rarity": "lendario",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 300
  },
  {
    "id": "orb_06_22",
    "name": "Mestre da Economia Cósmica",
    "description": "Alcance 360 tetos cumpridos no Orbitron.",
    "rarity": "lendario",
    "icon": "Target",
    "category": "budgets",
    "metric": "budgetsKept",
    "target": 360
  },
  {
    "id": "missoes_1",
    "name": "Primeira Expedição",
    "description": "Alcance 1 missões concluídas no Orbitron.",
    "rarity": "comum",
    "icon": "Swords",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 1
  },
  {
    "id": "missoes_3",
    "name": "Explorador de Desafios",
    "description": "Alcance 2 missões concluídas no Orbitron.",
    "rarity": "comum",
    "icon": "Swords",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 2
  },
  {
    "id": "missoes_5",
    "name": "Três Missões Concluídas",
    "description": "Alcance 3 missões concluídas no Orbitron.",
    "rarity": "comum",
    "icon": "Swords",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 3
  },
  {
    "id": "missoes_10",
    "name": "Foco de Curta Distância",
    "description": "Alcance 5 missões concluídas no Orbitron.",
    "rarity": "comum",
    "icon": "Swords",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 5
  },
  {
    "id": "missoes_25",
    "name": "Cinco Expedições",
    "description": "Alcance 8 missões concluídas no Orbitron.",
    "rarity": "comum",
    "icon": "Trophy",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 8
  },
  {
    "id": "missoes_50",
    "name": "Caçador de Missões",
    "description": "Alcance 12 missões concluídas no Orbitron.",
    "rarity": "raro",
    "icon": "Crown",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 12
  },
  {
    "id": "orb_07_07",
    "name": "Veterano de Órbita",
    "description": "Alcance 16 missões concluídas no Orbitron.",
    "rarity": "raro",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 16
  },
  {
    "id": "orb_07_08",
    "name": "Rota de Desafios",
    "description": "Alcance 20 missões concluídas no Orbitron.",
    "rarity": "raro",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 20
  },
  {
    "id": "orb_07_09",
    "name": "Expedição de Titã",
    "description": "Alcance 25 missões concluídas no Orbitron.",
    "rarity": "raro",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 25
  },
  {
    "id": "orb_07_10",
    "name": "Comandante de Missões",
    "description": "Alcance 35 missões concluídas no Orbitron.",
    "rarity": "raro",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 35
  },
  {
    "id": "orb_07_11",
    "name": "Dez Marcos Estelares",
    "description": "Alcance 50 missões concluídas no Orbitron.",
    "rarity": "epico",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 50
  },
  {
    "id": "orb_07_12",
    "name": "Piloto de Longo Curso",
    "description": "Alcance 70 missões concluídas no Orbitron.",
    "rarity": "epico",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 70
  },
  {
    "id": "orb_07_13",
    "name": "Trinta Expedições",
    "description": "Alcance 90 missões concluídas no Orbitron.",
    "rarity": "epico",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 90
  },
  {
    "id": "orb_07_14",
    "name": "Especialista em Missões",
    "description": "Alcance 115 missões concluídas no Orbitron.",
    "rarity": "epico",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 115
  },
  {
    "id": "orb_07_15",
    "name": "Cinquenta Jornadas",
    "description": "Alcance 140 missões concluídas no Orbitron.",
    "rarity": "epico",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 140
  },
  {
    "id": "orb_07_16",
    "name": "Lenda das Expedições",
    "description": "Alcance 175 missões concluídas no Orbitron.",
    "rarity": "epico",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 175
  },
  {
    "id": "orb_07_17",
    "name": "Explorador Incansável",
    "description": "Alcance 210 missões concluídas no Orbitron.",
    "rarity": "lendario",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 210
  },
  {
    "id": "orb_07_18",
    "name": "Caçador de Nebulosas",
    "description": "Alcance 250 missões concluídas no Orbitron.",
    "rarity": "lendario",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 250
  },
  {
    "id": "orb_07_19",
    "name": "Rota Interestelar",
    "description": "Alcance 300 missões concluídas no Orbitron.",
    "rarity": "lendario",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 300
  },
  {
    "id": "orb_07_20",
    "name": "Mestre das Jornadas",
    "description": "Alcance 360 missões concluídas no Orbitron.",
    "rarity": "lendario",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 360
  },
  {
    "id": "orb_07_21",
    "name": "Conquistador do Cosmos",
    "description": "Alcance 420 missões concluídas no Orbitron.",
    "rarity": "lendario",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 420
  },
  {
    "id": "orb_07_22",
    "name": "Expedição Infinita",
    "description": "Alcance 500 missões concluídas no Orbitron.",
    "rarity": "lendario",
    "icon": "Rocket",
    "category": "missions",
    "metric": "missionsCompleted",
    "target": 500
  },
  {
    "id": "detetive_1",
    "name": "Primeiro Eco Detectado",
    "description": "Alcance 1 despesas recorrentes identificadas no Orbitron.",
    "rarity": "comum",
    "icon": "Search",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 1
  },
  {
    "id": "detetive_3",
    "name": "Radar de Recorrências",
    "description": "Alcance 2 despesas recorrentes identificadas no Orbitron.",
    "rarity": "comum",
    "icon": "Search",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 2
  },
  {
    "id": "detetive",
    "name": "Três Sinais Repetidos",
    "description": "Alcance 3 despesas recorrentes identificadas no Orbitron.",
    "rarity": "comum",
    "icon": "Search",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 3
  },
  {
    "id": "detetive_10",
    "name": "Detetive de Órbita",
    "description": "Alcance 4 despesas recorrentes identificadas no Orbitron.",
    "rarity": "comum",
    "icon": "Search",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 4
  },
  {
    "id": "orb_08_05",
    "name": "Cinco Padrões Descobertos",
    "description": "Alcance 5 despesas recorrentes identificadas no Orbitron.",
    "rarity": "comum",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 5
  },
  {
    "id": "orb_08_06",
    "name": "Inspetor de Sistemas",
    "description": "Alcance 6 despesas recorrentes identificadas no Orbitron.",
    "rarity": "raro",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 6
  },
  {
    "id": "orb_08_07",
    "name": "Radar de Assinaturas",
    "description": "Alcance 7 despesas recorrentes identificadas no Orbitron.",
    "rarity": "raro",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 7
  },
  {
    "id": "orb_08_08",
    "name": "Analista de Ecos",
    "description": "Alcance 8 despesas recorrentes identificadas no Orbitron.",
    "rarity": "raro",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 8
  },
  {
    "id": "orb_08_09",
    "name": "Rastreador de Despesas",
    "description": "Alcance 9 despesas recorrentes identificadas no Orbitron.",
    "rarity": "raro",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 9
  },
  {
    "id": "orb_08_10",
    "name": "Observatório de Padrões",
    "description": "Alcance 10 despesas recorrentes identificadas no Orbitron.",
    "rarity": "raro",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 10
  },
  {
    "id": "orb_08_11",
    "name": "Caçador de Anomalias",
    "description": "Alcance 11 despesas recorrentes identificadas no Orbitron.",
    "rarity": "epico",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 11
  },
  {
    "id": "orb_08_12",
    "name": "Sonda Inteligente",
    "description": "Alcance 12 despesas recorrentes identificadas no Orbitron.",
    "rarity": "epico",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 12
  },
  {
    "id": "orb_08_13",
    "name": "Detecção de Alta Precisão",
    "description": "Alcance 13 despesas recorrentes identificadas no Orbitron.",
    "rarity": "epico",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 13
  },
  {
    "id": "orb_08_14",
    "name": "Leitor de Constelações",
    "description": "Alcance 14 despesas recorrentes identificadas no Orbitron.",
    "rarity": "epico",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 14
  },
  {
    "id": "orb_08_15",
    "name": "Sentinela de Recorrências",
    "description": "Alcance 15 despesas recorrentes identificadas no Orbitron.",
    "rarity": "epico",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 15
  },
  {
    "id": "orb_08_16",
    "name": "Oráculo dos Padrões",
    "description": "Alcance 16 despesas recorrentes identificadas no Orbitron.",
    "rarity": "epico",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 16
  },
  {
    "id": "orb_08_17",
    "name": "Especialista em Sinais",
    "description": "Alcance 17 despesas recorrentes identificadas no Orbitron.",
    "rarity": "lendario",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 17
  },
  {
    "id": "orb_08_18",
    "name": "Investigador Cósmico",
    "description": "Alcance 18 despesas recorrentes identificadas no Orbitron.",
    "rarity": "lendario",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 18
  },
  {
    "id": "orb_08_19",
    "name": "Radar Interestelar",
    "description": "Alcance 19 despesas recorrentes identificadas no Orbitron.",
    "rarity": "lendario",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 19
  },
  {
    "id": "orb_08_20",
    "name": "Mestre da Detecção",
    "description": "Alcance 20 despesas recorrentes identificadas no Orbitron.",
    "rarity": "lendario",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 20
  },
  {
    "id": "orb_08_21",
    "name": "Inteligência Galáctica",
    "description": "Alcance 22 despesas recorrentes identificadas no Orbitron.",
    "rarity": "lendario",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 22
  },
  {
    "id": "orb_08_22",
    "name": "Oráculo do Orbitron",
    "description": "Alcance 25 despesas recorrentes identificadas no Orbitron.",
    "rarity": "lendario",
    "icon": "Radar",
    "category": "intelligence",
    "metric": "recurringDetected",
    "target": 25
  },
  {
    "id": "habito_primeiro",
    "name": "Primeiro Hábito Ativado",
    "description": "Alcance 1 hábitos ativos no Orbitron.",
    "rarity": "comum",
    "icon": "Sparkles",
    "category": "habits",
    "metric": "activeHabits",
    "target": 1
  },
  {
    "id": "habito_checkin_1",
    "name": "Primeiro Check-in Orbital",
    "description": "Alcance 1 check-ins concluídos no Orbitron.",
    "rarity": "comum",
    "icon": "CalendarCheck",
    "category": "habits",
    "metric": "habitCheckins",
    "target": 1
  },
  {
    "id": "habito_checkin_7",
    "name": "Sete Sinais de Disciplina",
    "description": "Alcance 14 check-ins concluídos no Orbitron.",
    "rarity": "comum",
    "icon": "CalendarCheck",
    "category": "habits",
    "metric": "habitCheckins",
    "target": 14
  },
  {
    "id": "habito_checkin_21",
    "name": "Constância de 21 Ciclos",
    "description": "Alcance 21 check-ins concluídos no Orbitron.",
    "rarity": "comum",
    "icon": "Flame",
    "category": "habits",
    "metric": "habitCheckins",
    "target": 21
  },
  {
    "id": "habito_checkin_50",
    "name": "Mente em Foco",
    "description": "Alcance 30 check-ins concluídos no Orbitron.",
    "rarity": "comum",
    "icon": "Trophy",
    "category": "habits",
    "metric": "habitCheckins",
    "target": 30
  },
  {
    "id": "habito_checkin_100",
    "name": "Cem Registros de Evolução",
    "description": "Alcance 50 check-ins concluídos no Orbitron.",
    "rarity": "raro",
    "icon": "Trophy",
    "category": "habits",
    "metric": "habitCheckins",
    "target": 50
  },
  {
    "id": "habito_checkin_250",
    "name": "Mestre da Rotina",
    "description": "Alcance 75 check-ins concluídos no Orbitron.",
    "rarity": "raro",
    "icon": "Crown",
    "category": "habits",
    "metric": "habitCheckins",
    "target": 75
  },
  {
    "id": "habito_streak_7",
    "name": "Fogo de Propulsão",
    "description": "Alcance 60 dias consecutivos no Orbitron.",
    "rarity": "raro",
    "icon": "Flame",
    "category": "habits",
    "metric": "habitStreak",
    "target": 60
  },
  {
    "id": "habito_streak_21",
    "name": "Inabalável em Órbita",
    "description": "Alcance 75 dias consecutivos no Orbitron.",
    "rarity": "raro",
    "icon": "Flame",
    "category": "habits",
    "metric": "habitStreak",
    "target": 75
  },
  {
    "id": "orb_09_10",
    "name": "Três Hábitos Alinhados",
    "description": "Alcance 6 hábitos ativos no Orbitron.",
    "rarity": "raro",
    "icon": "Sparkles",
    "category": "habits",
    "metric": "activeHabits",
    "target": 6
  },
  {
    "id": "orb_09_11",
    "name": "Rotina de Explorador",
    "description": "Alcance 300 check-ins concluídos no Orbitron.",
    "rarity": "epico",
    "icon": "CalendarCheck",
    "category": "habits",
    "metric": "habitCheckins",
    "target": 300
  },
  {
    "id": "orb_09_12",
    "name": "Primeiro Dia Perfeito",
    "description": "Alcance 120 dias consecutivos no Orbitron.",
    "rarity": "epico",
    "icon": "Flame",
    "category": "habits",
    "metric": "habitStreak",
    "target": 120
  },
  {
    "id": "orb_09_13",
    "name": "Semana de Alinhamento",
    "description": "Alcance 8 hábitos ativos no Orbitron.",
    "rarity": "epico",
    "icon": "Sparkles",
    "category": "habits",
    "metric": "activeHabits",
    "target": 8
  },
  {
    "id": "orb_09_14",
    "name": "Quinzena de Elite",
    "description": "Alcance 650 check-ins concluídos no Orbitron.",
    "rarity": "epico",
    "icon": "CalendarCheck",
    "category": "habits",
    "metric": "habitCheckins",
    "target": 650
  },
  {
    "id": "orb_09_15",
    "name": "Mês de Alta Performance",
    "description": "Alcance 180 dias consecutivos no Orbitron.",
    "rarity": "epico",
    "icon": "Flame",
    "category": "habits",
    "metric": "habitStreak",
    "target": 180
  },
  {
    "id": "orb_09_16",
    "name": "Duas Semanas de Foco",
    "description": "Alcance 9 hábitos ativos no Orbitron.",
    "rarity": "epico",
    "icon": "Sparkles",
    "category": "habits",
    "metric": "activeHabits",
    "target": 9
  },
  {
    "id": "orb_09_17",
    "name": "Trinta Dias de Aço",
    "description": "Alcance 1250 check-ins concluídos no Orbitron.",
    "rarity": "lendario",
    "icon": "CalendarCheck",
    "category": "habits",
    "metric": "habitCheckins",
    "target": 1250
  },
  {
    "id": "orb_09_18",
    "name": "Disciplina Inquebrável",
    "description": "Alcance 270 dias consecutivos no Orbitron.",
    "rarity": "lendario",
    "icon": "Flame",
    "category": "habits",
    "metric": "habitStreak",
    "target": 270
  },
  {
    "id": "orb_09_19",
    "name": "Ritual de Energia",
    "description": "Alcance 11 hábitos ativos no Orbitron.",
    "rarity": "lendario",
    "icon": "Sparkles",
    "category": "habits",
    "metric": "activeHabits",
    "target": 11
  },
  {
    "id": "orb_09_20",
    "name": "Guardião da Constância",
    "description": "Alcance 2100 check-ins concluídos no Orbitron.",
    "rarity": "lendario",
    "icon": "CalendarCheck",
    "category": "habits",
    "metric": "habitCheckins",
    "target": 2100
  },
  {
    "id": "orb_09_21",
    "name": "Explorador Consistente",
    "description": "Alcance 365 dias consecutivos no Orbitron.",
    "rarity": "lendario",
    "icon": "Flame",
    "category": "habits",
    "metric": "habitStreak",
    "target": 365
  },
  {
    "id": "orb_09_22",
    "name": "Órbita de Excelência",
    "description": "Alcance 12 hábitos ativos no Orbitron.",
    "rarity": "lendario",
    "icon": "Sparkles",
    "category": "habits",
    "metric": "activeHabits",
    "target": 12
  },
  {
    "id": "habito_diversidade_3",
    "name": "Tríade de Hábitos",
    "description": "Alcance 12 hábitos ativos no Orbitron.",
    "rarity": "lendario",
    "icon": "Sparkles",
    "category": "habits",
    "metric": "activeHabits",
    "target": 12
  },
  {
    "id": "habito_diversidade_5",
    "name": "Constelação de Rotina",
    "description": "Alcance 12 hábitos ativos no Orbitron.",
    "rarity": "lendario",
    "icon": "Sparkles",
    "category": "habits",
    "metric": "activeHabits",
    "target": 12
  },
  {
    "id": "dia_perfeito_1",
    "name": "Primeiro Dia Perfeito",
    "description": "Alcance 365 dias perfeitos no Orbitron.",
    "rarity": "lendario",
    "icon": "CalendarCheck",
    "category": "habits",
    "metric": "perfectHabitDays",
    "target": 365
  },
  {
    "id": "dia_perfeito_7",
    "name": "Sete Dias de Alinhamento",
    "description": "Alcance 365 dias perfeitos no Orbitron.",
    "rarity": "lendario",
    "icon": "Flame",
    "category": "habits",
    "metric": "perfectHabitDays",
    "target": 365
  },
  {
    "id": "dia_perfeito_15",
    "name": "Quinzena Impecável",
    "description": "Alcance 365 dias perfeitos no Orbitron.",
    "rarity": "lendario",
    "icon": "Trophy",
    "category": "habits",
    "metric": "perfectHabitDays",
    "target": 365
  },
  {
    "id": "dia_perfeito_30",
    "name": "Mês de Alta Performance",
    "description": "Alcance 365 dias perfeitos no Orbitron.",
    "rarity": "lendario",
    "icon": "Crown",
    "category": "habits",
    "metric": "perfectHabitDays",
    "target": 365
  },
  {
    "id": "habito_streak_14",
    "name": "Duas Semanas em Órbita",
    "description": "Alcance 400 dias consecutivos no Orbitron.",
    "rarity": "lendario",
    "icon": "Flame",
    "category": "habits",
    "metric": "habitStreak",
    "target": 400
  },
  {
    "id": "habito_streak_30",
    "name": "Trinta Dias de Aço",
    "description": "Alcance 400 dias consecutivos no Orbitron.",
    "rarity": "lendario",
    "icon": "Flame",
    "category": "habits",
    "metric": "habitStreak",
    "target": 400
  },
  {
    "id": "habito_streak_60",
    "name": "Disciplina Inabalável",
    "description": "Alcance 400 dias consecutivos no Orbitron.",
    "rarity": "lendario",
    "icon": "Crown",
    "category": "habits",
    "metric": "habitStreak",
    "target": 400
  },
  {
    "id": "orb_11_10",
    "name": "Alinhamento Diário",
    "description": "Alcance 12 hábitos ativos no Orbitron.",
    "rarity": "lendario",
    "icon": "Sparkles",
    "category": "habits",
    "metric": "activeHabits",
    "target": 12
  },
  {
    "id": "orb_11_11",
    "name": "Órbita sem Falhas",
    "description": "Alcance 365 dias perfeitos no Orbitron.",
    "rarity": "lendario",
    "icon": "Star",
    "category": "habits",
    "metric": "perfectHabitDays",
    "target": 365
  },
  {
    "id": "orb_11_12",
    "name": "Ritual Perfeito",
    "description": "Alcance 400 dias consecutivos no Orbitron.",
    "rarity": "lendario",
    "icon": "Flame",
    "category": "habits",
    "metric": "habitStreak",
    "target": 400
  },
  {
    "id": "orb_11_13",
    "name": "Sequência de Titã",
    "description": "Alcance 12 hábitos ativos no Orbitron.",
    "rarity": "lendario",
    "icon": "Sparkles",
    "category": "habits",
    "metric": "activeHabits",
    "target": 12
  },
  {
    "id": "orb_11_14",
    "name": "Constância Lunar",
    "description": "Alcance 365 dias perfeitos no Orbitron.",
    "rarity": "lendario",
    "icon": "Star",
    "category": "habits",
    "metric": "perfectHabitDays",
    "target": 365
  },
  {
    "id": "orb_11_15",
    "name": "Ciclo de Excelência",
    "description": "Alcance 400 dias consecutivos no Orbitron.",
    "rarity": "lendario",
    "icon": "Flame",
    "category": "habits",
    "metric": "habitStreak",
    "target": 400
  },
  {
    "id": "orb_11_16",
    "name": "Sistema de Hábitos Estável",
    "description": "Alcance 12 hábitos ativos no Orbitron.",
    "rarity": "lendario",
    "icon": "Sparkles",
    "category": "habits",
    "metric": "activeHabits",
    "target": 12
  },
  {
    "id": "orb_11_17",
    "name": "Vórtice de Disciplina",
    "description": "Alcance 365 dias perfeitos no Orbitron.",
    "rarity": "lendario",
    "icon": "Star",
    "category": "habits",
    "metric": "perfectHabitDays",
    "target": 365
  },
  {
    "id": "orb_11_18",
    "name": "Mestre da Sequência",
    "description": "Alcance 400 dias consecutivos no Orbitron.",
    "rarity": "lendario",
    "icon": "Flame",
    "category": "habits",
    "metric": "habitStreak",
    "target": 400
  },
  {
    "id": "orb_11_19",
    "name": "Órbita de 60 Dias",
    "description": "Alcance 12 hábitos ativos no Orbitron.",
    "rarity": "lendario",
    "icon": "Sparkles",
    "category": "habits",
    "metric": "activeHabits",
    "target": 12
  },
  {
    "id": "orb_11_20",
    "name": "Guardião do Ritmo",
    "description": "Alcance 365 dias perfeitos no Orbitron.",
    "rarity": "lendario",
    "icon": "Star",
    "category": "habits",
    "metric": "perfectHabitDays",
    "target": 365
  },
  {
    "id": "orb_11_21",
    "name": "Lenda da Constância",
    "description": "Alcance 400 dias consecutivos no Orbitron.",
    "rarity": "lendario",
    "icon": "Flame",
    "category": "habits",
    "metric": "habitStreak",
    "target": 400
  },
  {
    "id": "orb_11_22",
    "name": "Singularidade de Hábitos",
    "description": "Alcance 12 hábitos ativos no Orbitron.",
    "rarity": "lendario",
    "icon": "Sparkles",
    "category": "habits",
    "metric": "activeHabits",
    "target": 12
  },
  {
    "id": "meta_criada",
    "name": "Primeira Coordenada Definida",
    "description": "Alcance 1 metas criadas no Orbitron.",
    "rarity": "comum",
    "icon": "Target",
    "category": "goals",
    "metric": "goalsCount",
    "target": 1
  },
  {
    "id": "meta_concluida_1",
    "name": "Destino Marcado",
    "description": "Alcance 2 metas concluídas no Orbitron.",
    "rarity": "comum",
    "icon": "Trophy",
    "category": "goals",
    "metric": "goalsCompleted",
    "target": 2
  },
  {
    "id": "meta_concluida_3",
    "name": "Primeiro Mundo Alcançado",
    "description": "Alcance 3 metas concluídas no Orbitron.",
    "rarity": "comum",
    "icon": "Trophy",
    "category": "goals",
    "metric": "goalsCompleted",
    "target": 3
  },
  {
    "id": "meta_concluida_5",
    "name": "Três Mundos Conquistados",
    "description": "Alcance 4 metas concluídas no Orbitron.",
    "rarity": "comum",
    "icon": "Crown",
    "category": "goals",
    "metric": "goalsCompleted",
    "target": 4
  },
  {
    "id": "orb_10_05",
    "name": "Arquiteto de Rotas",
    "description": "Alcance 5 metas criadas no Orbitron.",
    "rarity": "comum",
    "icon": "Target",
    "category": "goals",
    "metric": "goalsCount",
    "target": 5
  },
  {
    "id": "orb_10_06",
    "name": "Objetivo em Telemetria",
    "description": "Alcance 6 metas concluídas no Orbitron.",
    "rarity": "raro",
    "icon": "Trophy",
    "category": "goals",
    "metric": "goalsCompleted",
    "target": 6
  },
  {
    "id": "orb_10_07",
    "name": "Plano de Expansão",
    "description": "Alcance 7 metas criadas no Orbitron.",
    "rarity": "raro",
    "icon": "Target",
    "category": "goals",
    "metric": "goalsCount",
    "target": 7
  },
  {
    "id": "orb_10_08",
    "name": "Meta em Aproximação",
    "description": "Alcance 8 metas concluídas no Orbitron.",
    "rarity": "raro",
    "icon": "Trophy",
    "category": "goals",
    "metric": "goalsCompleted",
    "target": 8
  },
  {
    "id": "orb_10_09",
    "name": "Pouso de Sucesso",
    "description": "Alcance 9 metas criadas no Orbitron.",
    "rarity": "raro",
    "icon": "Target",
    "category": "goals",
    "metric": "goalsCount",
    "target": 9
  },
  {
    "id": "orb_10_10",
    "name": "Cartógrafo do Futuro",
    "description": "Alcance 10 metas concluídas no Orbitron.",
    "rarity": "raro",
    "icon": "Trophy",
    "category": "goals",
    "metric": "goalsCompleted",
    "target": 10
  },
  {
    "id": "orb_10_11",
    "name": "Três Destinos Alcançados",
    "description": "Alcance 11 metas criadas no Orbitron.",
    "rarity": "epico",
    "icon": "Target",
    "category": "goals",
    "metric": "goalsCount",
    "target": 11
  },
  {
    "id": "orb_10_12",
    "name": "Cinco Mundos Conquistados",
    "description": "Alcance 12 metas concluídas no Orbitron.",
    "rarity": "epico",
    "icon": "Trophy",
    "category": "goals",
    "metric": "goalsCompleted",
    "target": 12
  },
  {
    "id": "orb_10_13",
    "name": "Rota de Longo Alcance",
    "description": "Alcance 13 metas criadas no Orbitron.",
    "rarity": "epico",
    "icon": "Target",
    "category": "goals",
    "metric": "goalsCount",
    "target": 13
  },
  {
    "id": "orb_10_14",
    "name": "Comandante de Objetivos",
    "description": "Alcance 14 metas concluídas no Orbitron.",
    "rarity": "epico",
    "icon": "Trophy",
    "category": "goals",
    "metric": "goalsCompleted",
    "target": 14
  },
  {
    "id": "orb_10_15",
    "name": "Sistema de Metas",
    "description": "Alcance 15 metas criadas no Orbitron.",
    "rarity": "epico",
    "icon": "Target",
    "category": "goals",
    "metric": "goalsCount",
    "target": 15
  },
  {
    "id": "orb_10_16",
    "name": "Horizonte Planejado",
    "description": "Alcance 16 metas concluídas no Orbitron.",
    "rarity": "epico",
    "icon": "Trophy",
    "category": "goals",
    "metric": "goalsCompleted",
    "target": 16
  },
  {
    "id": "orb_10_17",
    "name": "Pioneiro de Conquistas",
    "description": "Alcance 17 metas criadas no Orbitron.",
    "rarity": "lendario",
    "icon": "Target",
    "category": "goals",
    "metric": "goalsCount",
    "target": 17
  },
  {
    "id": "orb_10_18",
    "name": "Construtor de Futuro",
    "description": "Alcance 18 metas concluídas no Orbitron.",
    "rarity": "lendario",
    "icon": "Trophy",
    "category": "goals",
    "metric": "goalsCompleted",
    "target": 18
  },
  {
    "id": "orb_10_19",
    "name": "Mestre das Coordenadas",
    "description": "Alcance 19 metas criadas no Orbitron.",
    "rarity": "lendario",
    "icon": "Target",
    "category": "goals",
    "metric": "goalsCount",
    "target": 19
  },
  {
    "id": "orb_10_20",
    "name": "Conquistador de Mundos",
    "description": "Alcance 20 metas concluídas no Orbitron.",
    "rarity": "lendario",
    "icon": "Trophy",
    "category": "goals",
    "metric": "goalsCompleted",
    "target": 20
  },
  {
    "id": "orb_10_21",
    "name": "Atlas de Objetivos",
    "description": "Alcance 22 metas criadas no Orbitron.",
    "rarity": "lendario",
    "icon": "Target",
    "category": "goals",
    "metric": "goalsCount",
    "target": 22
  },
  {
    "id": "orb_10_22",
    "name": "Expansão Infinita",
    "description": "Alcance 25 metas concluídas no Orbitron.",
    "rarity": "lendario",
    "icon": "Trophy",
    "category": "goals",
    "metric": "goalsCompleted",
    "target": 25
  },
  {
    "id": "nota_primeira",
    "name": "Primeira Nota Estelar",
    "description": "Alcance 1 anotações salvas no Orbitron.",
    "rarity": "comum",
    "icon": "Library",
    "category": "tools",
    "metric": "notesCount",
    "target": 1
  },
  {
    "id": "nota_fixada",
    "name": "Ideia Fixada na Órbita",
    "description": "Alcance 1 anotações fixadas no Orbitron.",
    "rarity": "comum",
    "icon": "Sparkles",
    "category": "tools",
    "metric": "pinnedNotesCount",
    "target": 1
  },
  {
    "id": "notas_5",
    "name": "Cinco Fragmentos de Conhecimento",
    "description": "Alcance 5 anotações salvas no Orbitron.",
    "rarity": "comum",
    "icon": "Library",
    "category": "tools",
    "metric": "notesCount",
    "target": 5
  },
  {
    "id": "notas_15",
    "name": "Arquivo Pessoal Ativo",
    "description": "Alcance 8 anotações salvas no Orbitron.",
    "rarity": "comum",
    "icon": "GraduationCap",
    "category": "tools",
    "metric": "notesCount",
    "target": 8
  },
  {
    "id": "notas_30",
    "name": "Enciclopédia Estelar",
    "description": "Alcance 12 anotações salvas no Orbitron.",
    "rarity": "comum",
    "icon": "Crown",
    "category": "tools",
    "metric": "notesCount",
    "target": 12
  },
  {
    "id": "orb_12_06",
    "name": "Diário de Bordo",
    "description": "Alcance 16 anotações salvas no Orbitron.",
    "rarity": "raro",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 16
  },
  {
    "id": "orb_12_07",
    "name": "Sinal de Conhecimento",
    "description": "Alcance 20 anotações salvas no Orbitron.",
    "rarity": "raro",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 20
  },
  {
    "id": "orb_12_08",
    "name": "Bibliotecário Orbital",
    "description": "Alcance 25 anotações salvas no Orbitron.",
    "rarity": "raro",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 25
  },
  {
    "id": "orb_12_09",
    "name": "Arquivo de Ideias",
    "description": "Alcance 30 anotações salvas no Orbitron.",
    "rarity": "raro",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 30
  },
  {
    "id": "orb_12_10",
    "name": "Cartógrafo do Pensamento",
    "description": "Alcance 35 anotações salvas no Orbitron.",
    "rarity": "raro",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 35
  },
  {
    "id": "orb_12_11",
    "name": "Colecionador de Insights",
    "description": "Alcance 40 anotações salvas no Orbitron.",
    "rarity": "epico",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 40
  },
  {
    "id": "orb_12_12",
    "name": "Registro de Descobertas",
    "description": "Alcance 45 anotações salvas no Orbitron.",
    "rarity": "epico",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 45
  },
  {
    "id": "orb_12_13",
    "name": "Observatório Mental",
    "description": "Alcance 50 anotações salvas no Orbitron.",
    "rarity": "epico",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 50
  },
  {
    "id": "orb_12_14",
    "name": "Atlas de Anotações",
    "description": "Alcance 55 anotações salvas no Orbitron.",
    "rarity": "epico",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 55
  },
  {
    "id": "orb_12_15",
    "name": "Mente em Expansão",
    "description": "Alcance 60 anotações salvas no Orbitron.",
    "rarity": "epico",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 60
  },
  {
    "id": "orb_12_16",
    "name": "Biblioteca Cósmica",
    "description": "Alcance 65 anotações salvas no Orbitron.",
    "rarity": "epico",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 65
  },
  {
    "id": "orb_12_17",
    "name": "Cronista do Cosmos",
    "description": "Alcance 70 anotações salvas no Orbitron.",
    "rarity": "lendario",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 70
  },
  {
    "id": "orb_12_18",
    "name": "Arquivo de Andrômeda",
    "description": "Alcance 75 anotações salvas no Orbitron.",
    "rarity": "lendario",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 75
  },
  {
    "id": "orb_12_19",
    "name": "Guardião do Conhecimento",
    "description": "Alcance 80 anotações salvas no Orbitron.",
    "rarity": "lendario",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 80
  },
  {
    "id": "orb_12_20",
    "name": "Memória Interestelar",
    "description": "Alcance 85 anotações salvas no Orbitron.",
    "rarity": "lendario",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 85
  },
  {
    "id": "orb_12_21",
    "name": "Oráculo de Ideias",
    "description": "Alcance 90 anotações salvas no Orbitron.",
    "rarity": "lendario",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 90
  },
  {
    "id": "orb_12_22",
    "name": "Biblioteca do Infinito",
    "description": "Alcance 100 anotações salvas no Orbitron.",
    "rarity": "lendario",
    "icon": "BookOpen",
    "category": "tools",
    "metric": "notesCount",
    "target": 100
  },
  {
    "id": "mapa_primeiro",
    "name": "Primeira Constelação Mental",
    "description": "Alcance 25 mapas mentais criados no Orbitron.",
    "rarity": "lendario",
    "icon": "Sparkles",
    "category": "tools",
    "metric": "mindmapsCount",
    "target": 25
  },
  {
    "id": "mapa_ramificado_6",
    "name": "Seis Nós Conectados",
    "description": "Alcance 120 nós conectados no Orbitron.",
    "rarity": "lendario",
    "icon": "Target",
    "category": "tools",
    "metric": "maxMindmapNodes",
    "target": 120
  },
  {
    "id": "mapa_ramificado_12",
    "name": "Teia Estratégica",
    "description": "Alcance 120 nós conectados no Orbitron.",
    "rarity": "lendario",
    "icon": "Trophy",
    "category": "tools",
    "metric": "maxMindmapNodes",
    "target": 120
  },
  {
    "id": "mapas_3",
    "name": "Três Mapas Estelares",
    "description": "Alcance 25 mapas mentais criados no Orbitron.",
    "rarity": "lendario",
    "icon": "Library",
    "category": "tools",
    "metric": "mindmapsCount",
    "target": 25
  },
  {
    "id": "mapas_5",
    "name": "Mente Cartográfica",
    "description": "Alcance 25 mapas mentais criados no Orbitron.",
    "rarity": "lendario",
    "icon": "Crown",
    "category": "tools",
    "metric": "mindmapsCount",
    "target": 25
  },
  {
    "id": "orb_13_06",
    "name": "Mapa de Nebulosa",
    "description": "Alcance 25 mapas mentais criados no Orbitron.",
    "rarity": "lendario",
    "icon": "Network",
    "category": "tools",
    "metric": "mindmapsCount",
    "target": 25
  },
  {
    "id": "orb_13_07",
    "name": "Arquiteto de Conexões",
    "description": "Alcance 120 nós conectados no Orbitron.",
    "rarity": "lendario",
    "icon": "GitBranch",
    "category": "tools",
    "metric": "maxMindmapNodes",
    "target": 120
  },
  {
    "id": "orb_13_08",
    "name": "Constelação de Ideias",
    "description": "Alcance 25 mapas mentais criados no Orbitron.",
    "rarity": "lendario",
    "icon": "Network",
    "category": "tools",
    "metric": "mindmapsCount",
    "target": 25
  },
  {
    "id": "orb_13_09",
    "name": "Rota do Pensamento",
    "description": "Alcance 120 nós conectados no Orbitron.",
    "rarity": "lendario",
    "icon": "GitBranch",
    "category": "tools",
    "metric": "maxMindmapNodes",
    "target": 120
  },
  {
    "id": "orb_13_10",
    "name": "Cartógrafo Mental",
    "description": "Alcance 25 mapas mentais criados no Orbitron.",
    "rarity": "lendario",
    "icon": "Network",
    "category": "tools",
    "metric": "mindmapsCount",
    "target": 25
  },
  {
    "id": "orb_13_11",
    "name": "Rede de Conhecimento",
    "description": "Alcance 120 nós conectados no Orbitron.",
    "rarity": "lendario",
    "icon": "GitBranch",
    "category": "tools",
    "metric": "maxMindmapNodes",
    "target": 120
  },
  {
    "id": "orb_13_12",
    "name": "Doze Estrelas Conectadas",
    "description": "Alcance 25 mapas mentais criados no Orbitron.",
    "rarity": "lendario",
    "icon": "Network",
    "category": "tools",
    "metric": "mindmapsCount",
    "target": 25
  },
  {
    "id": "orb_13_13",
    "name": "Mapa Interestelar",
    "description": "Alcance 120 nós conectados no Orbitron.",
    "rarity": "lendario",
    "icon": "GitBranch",
    "category": "tools",
    "metric": "maxMindmapNodes",
    "target": 120
  },
  {
    "id": "orb_13_14",
    "name": "Estrategista Visual",
    "description": "Alcance 25 mapas mentais criados no Orbitron.",
    "rarity": "lendario",
    "icon": "Network",
    "category": "tools",
    "metric": "mindmapsCount",
    "target": 25
  },
  {
    "id": "orb_13_15",
    "name": "Atlas de Ideias",
    "description": "Alcance 120 nós conectados no Orbitron.",
    "rarity": "lendario",
    "icon": "GitBranch",
    "category": "tools",
    "metric": "maxMindmapNodes",
    "target": 120
  },
  {
    "id": "orb_13_16",
    "name": "Sistema de Conexões",
    "description": "Alcance 25 mapas mentais criados no Orbitron.",
    "rarity": "lendario",
    "icon": "Network",
    "category": "tools",
    "metric": "mindmapsCount",
    "target": 25
  },
  {
    "id": "orb_13_17",
    "name": "Arquiteto de Mapas",
    "description": "Alcance 120 nós conectados no Orbitron.",
    "rarity": "lendario",
    "icon": "GitBranch",
    "category": "tools",
    "metric": "maxMindmapNodes",
    "target": 120
  },
  {
    "id": "orb_13_18",
    "name": "Mestre das Ramificações",
    "description": "Alcance 25 mapas mentais criados no Orbitron.",
    "rarity": "lendario",
    "icon": "Network",
    "category": "tools",
    "metric": "mindmapsCount",
    "target": 25
  },
  {
    "id": "orb_13_19",
    "name": "Constelação Complexa",
    "description": "Alcance 120 nós conectados no Orbitron.",
    "rarity": "lendario",
    "icon": "GitBranch",
    "category": "tools",
    "metric": "maxMindmapNodes",
    "target": 120
  },
  {
    "id": "orb_13_20",
    "name": "Navegador de Conceitos",
    "description": "Alcance 25 mapas mentais criados no Orbitron.",
    "rarity": "lendario",
    "icon": "Network",
    "category": "tools",
    "metric": "mindmapsCount",
    "target": 25
  },
  {
    "id": "orb_13_21",
    "name": "Mente Galáctica",
    "description": "Alcance 120 nós conectados no Orbitron.",
    "rarity": "lendario",
    "icon": "GitBranch",
    "category": "tools",
    "metric": "maxMindmapNodes",
    "target": 120
  },
  {
    "id": "orb_13_22",
    "name": "Mapa do Universo",
    "description": "Alcance 25 mapas mentais criados no Orbitron.",
    "rarity": "lendario",
    "icon": "Network",
    "category": "tools",
    "metric": "mindmapsCount",
    "target": 25
  },
  {
    "id": "cofre_primeira",
    "name": "Primeira Chave Criptografada",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "Shield",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "cofre_5",
    "name": "Cinco Chaves Protegidas",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "cofre_15",
    "name": "Guardião Digital",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "cofre_30",
    "name": "Fortaleza Criptografada",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "Castle",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_05",
    "name": "Sentinela de Acessos",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_06",
    "name": "Escudo de Credenciais",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_07",
    "name": "Cofre Orbital",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_08",
    "name": "Protocolo de Segurança",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_09",
    "name": "Chaveiro Estelar",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_10",
    "name": "Guardião de Sistemas",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_11",
    "name": "Barreira Cibernética",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_12",
    "name": "Cofre de Titã",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_13",
    "name": "Sentinela Interestelar",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_14",
    "name": "Defesa de Andrômeda",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_15",
    "name": "Criptógrafo Cósmico",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_16",
    "name": "Fortaleza de Dados",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_17",
    "name": "Mestre das Chaves",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_18",
    "name": "Escudo de Alta Segurança",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_19",
    "name": "Cofre Galáctico",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_20",
    "name": "Guardião da Rede",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_21",
    "name": "Protetor do Orbitron",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  },
  {
    "id": "orb_14_22",
    "name": "Bastião Digital",
    "description": "Alcance 55 credenciais protegidas no Orbitron.",
    "rarity": "lendario",
    "icon": "ShieldCheck",
    "category": "tools",
    "metric": "vaultItemsCount",
    "target": 55
  }
];

module.exports = {
  LEVEL_TITLES,
  ACHIEVEMENTS,
};
