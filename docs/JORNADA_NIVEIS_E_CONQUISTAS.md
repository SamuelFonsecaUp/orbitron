# 🎮 Pigo RPG Financeiro: Títulos, Níveis e Conquistas

> **Documento de Referência e Configuração da Gamificação**  
> *Sinta-se 100% livre para editar os nomes, títulos, descrições, ícones, metas ou pontuações de XP neste arquivo. Quando terminar de mexer, basta me pedir: `"atualize o código com base nas alterações que fiz em docs/JORNADA_NIVEIS_E_CONQUISTAS.md"` e eu aplicarei todas as suas modificações no motor `electron/gamificationEngine.cjs` e na interface!*

---

## 🧭 Como Funciona a Progressão de Nível

A curva de experiência atual do Pigo é calculada com a seguinte fórmula:
$$\text{XP para o próximo nível}(N) = 100 + 50 \times (N - 1)$$

- **Nível 1 $\to$ 2**: requer **100 XP** (Acumulado: 0 XP)
- **Nível 2 $\to$ 3**: requer **150 XP** (Acumulado: 100 XP)
- **Nível 3 $\to$ 4**: requer **200 XP** (Acumulado: 250 XP)
- Cada nível subsequente adiciona $+50\text{ XP}$ ao custo do nível anterior.

---

## 🏆 Tabela de Níveis e Títulos (1 a 50)

Edite a coluna **"Título do Nível (Personalizável)"** para alterar ou dar nomes únicos a cada nível ou faixa de níveis:

| Nível | Título Atual | XP para Próximo | XP Acumulado Total | Título Personalizável (Altere aqui se quiser) |
| :---: | :--- | :---: | :---: | :--- |
| **1** | Porquinho Curioso | 100 XP | 0 XP | Porquinho Curioso |
| **2** | Porquinho Curioso | 150 XP | 100 XP | Porquinho Curioso |
| **3** | Poupador Aprendiz | 200 XP | 250 XP | Poupador Aprendiz |
| **4** | Poupador Aprendiz | 250 XP | 450 XP | Poupador Aprendiz |
| **5** | Poupador Aprendiz | 300 XP | 700 XP | Poupador Aprendiz |
| **6** | Guardião do Cofre | 350 XP | 1.000 XP | Guardião do Cofre |
| **7** | Guardião do Cofre | 400 XP | 1.350 XP | Guardião do Cofre |
| **8** | Guardião do Cofre | 450 XP | 1.750 XP | Guardião do Cofre |
| **9** | Guardião do Cofre | 500 XP | 2.200 XP | Guardião do Cofre |
| **10** | Estrategista Financeiro | 550 XP | 2.700 XP | Estrategista Financeiro |
| **11** | Estrategista Financeiro | 600 XP | 3.250 XP | Estrategista Financeiro |
| **12** | Estrategista Financeiro | 650 XP | 3.850 XP | Estrategista Financeiro |
| **13** | Estrategista Financeiro | 700 XP | 4.500 XP | Estrategista Financeiro |
| **14** | Estrategista Financeiro | 750 XP | 5.200 XP | Estrategista Financeiro |
| **15** | Investidor Disciplinado | 800 XP | 5.950 XP | Investidor Disciplinado |
| **16** | Investidor Disciplinado | 850 XP | 6.750 XP | Investidor Disciplinado |
| **17** | Investidor Disciplinado | 900 XP | 7.600 XP | Investidor Disciplinado |
| **18** | Investidor Disciplinado | 950 XP | 8.500 XP | Investidor Disciplinado |
| **19** | Investidor Disciplinado | 1.000 XP | 9.450 XP | Investidor Disciplinado |
| **20** | Mestre das Finanças | 1.050 XP | 10.450 XP | Mestre das Finanças |
| **21** | Mestre das Finanças | 1.100 XP | 11.500 XP | Mestre das Finanças |
| **22** | Mestre das Finanças | 1.150 XP | 12.600 XP | Mestre das Finanças |
| **23** | Mestre das Finanças | 1.200 XP | 13.750 XP | Mestre das Finanças |
| **24** | Mestre das Finanças | 1.250 XP | 14.950 XP | Mestre das Finanças |
| **25** | Mestre das Finanças | 1.300 XP | 16.200 XP | Mestre das Finanças |
| **26** | Mestre das Finanças | 1.350 XP | 17.500 XP | Mestre das Finanças |
| **27** | Mestre das Finanças | 1.400 XP | 18.850 XP | Mestre das Finanças |
| **28** | Mestre das Finanças | 1.450 XP | 20.250 XP | Mestre das Finanças |
| **29** | Mestre das Finanças | 1.500 XP | 21.700 XP | Mestre das Finanças |
| **30** | Lenda do Pigo | 1.550 XP | 23.200 XP | Lenda do Pigo |
| **31** | Lenda do Pigo | 1.600 XP | 24.750 XP | Lenda do Pigo |
| **32** | Lenda do Pigo | 1.650 XP | 26.350 XP | Lenda do Pigo |
| **33** | Lenda do Pigo | 1.700 XP | 28.000 XP | Lenda do Pigo |
| **34** | Lenda do Pigo | 1.750 XP | 29.700 XP | Lenda do Pigo |
| **35** | Lenda do Pigo | 1.800 XP | 31.450 XP | Lenda do Pigo |
| **36** | Lenda do Pigo | 1.850 XP | 33.250 XP | Lenda do Pigo |
| **37** | Lenda do Pigo | 1.900 XP | 35.100 XP | Lenda do Pigo |
| **38** | Lenda do Pigo | 1.950 XP | 37.000 XP | Lenda do Pigo |
| **39** | Lenda do Pigo | 2.000 XP | 38.950 XP | Lenda do Pigo |
| **40** | Lenda do Pigo | 2.050 XP | 40.950 XP | Lenda do Pigo |
| **41** | Lenda do Pigo | 2.100 XP | 43.000 XP | Lenda do Pigo |
| **42** | Lenda do Pigo | 2.150 XP | 45.100 XP | Lenda do Pigo |
| **43** | Lenda do Pigo | 2.200 XP | 47.250 XP | Lenda do Pigo |
| **44** | Lenda do Pigo | 2.250 XP | 49.450 XP | Lenda do Pigo |
| **45** | Lenda do Pigo | 2.300 XP | 51.700 XP | Lenda do Pigo |
| **46** | Lenda do Pigo | 2.350 XP | 54.000 XP | Lenda do Pigo |
| **47** | Lenda do Pigo | 2.400 XP | 56.350 XP | Lenda do Pigo |
| **48** | Lenda do Pigo | 2.450 XP | 58.750 XP | Lenda do Pigo |
| **49** | Lenda do Pigo | 2.500 XP | 61.200 XP | Lenda do Pigo |
| **50** | Lenda do Pigo | 2.550 XP | 63.700 XP | Lenda do Pigo |

---

## ⚡ Recompensas de XP por Ação e Raridade

### XP por Ações do Usuário no App
| Ação | XP Concedido | Observação |
| :--- | :---: | :--- |
| **Importar Extrato (OFX/CSV)** | `50 XP` | Por arquivo importado |
| **Categorizar Lançamento** | `2 XP` | Por transação classificada |
| **Mês no Azul (Resultado Positivo)** | `200 XP` | Ao fechar o mês com saldo positivo |
| **Aporte na Reserva de Emergência** | `50 XP a 250 XP` | Base de 50 XP + bônus proporcional ao valor do aporte |
| **Teto de Orçamento Cumprido** | `50 XP` | Por categoria que não estourou o teto no mês |
| **Fatura de Cartão Paga em Dia** | `80 XP` | Por fatura quitada até a data de vencimento |
| **Check-in de Hábito Diário** | `5 XP` | Por hábito marcado no dia |
| **Dia Perfeito de Hábitos** | `25 XP` | Bônus ao cumprir 100% dos hábitos ativos no dia |

### XP por Desbloqueio de Conquista (Por Raridade)
| Raridade | Cor | XP Concedido ao Desbloquear |
| :--- | :---: | :---: |
| **Comum** | Cinza / Azul | `15 XP` |
| **Raro** | Roxo | `35 XP` |
| **Épico** | Âmbar / Laranja | `75 XP` |
| **Lendário** | Dourado / Amarelo | `150 XP` |

---

## 🏅 Lista Completa de Conquistas (75 Conquistas)

Organizadas por categoria. Você pode alterar o **Nome**, **Descrição**, **Raridade**, **Ícone** ou o **Alvo (Meta)**.

---

### 1. Extratos e Importações (`imports`)
*Reconhece a disciplina de trazer os dados bancários para o app.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `primeiro_extrato` | Primeiro Extrato | Importe seu primeiro extrato OFX/CSV. | Comum | `FileUp` | `statements` | 1 |
| `extratos_3` | Iniciando a Jornada | Importe 3 extratos bancários. | Comum | `FileUp` | `statements` | 3 |
| `extratos_5` | Colecionador de Extratos | Importe 5 extratos bancários. | Comum | `FolderArchive` | `statements` | 5 |
| `extratos_10` | Arquivista | Importe 10 extratos. | Raro | `FolderArchive` | `statements` | 10 |
| `extratos_25` | Historiador Financeiro | Importe 25 extratos. | Raro | `Library` | `statements` | 25 |
| `extratos_50` | Guardião do Histórico | Importe 50 extratos. | Épico | `Library` | `statements` | 50 |
| `extratos_100` | Biblioteca Central | Importe 100 extratos. | Lendário | `Library` | `statements` | 100 |
| `semanas_2` | Ritmo Semanal | 2 semanas seguidas importando extratos. | Comum | `CalendarCheck` | `importStreak` | 2 |
| `semanas_4` | Disciplina de Ferro | 4 semanas seguidas importando extratos. | Raro | `CalendarCheck` | `importStreak` | 4 |
| `semanas_8` | Hábito Inquebrável | 8 semanas seguidas importando extratos. | Raro | `CalendarCheck` | `importStreak` | 8 |
| `semanas_12` | Relógio Suíço | 12 semanas seguidas importando extratos. | Épico | `CalendarCheck` | `importStreak` | 12 |
| `semanas_24` | Pontualidade Suprema | 24 semanas seguidas com importações ativas. | Lendário | `Crown` | `importStreak` | 24 |

---

### 2. Categorização e Caixa Zero (`categorization`)
*Recompensa manter as finanças organizadas e sem pendências.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `categorizador_10` | Primeiros Lançamentos | Tenha 10 lançamentos categorizados. | Comum | `Tags` | `categorized` | 10 |
| `categorizador_50` | Aprendiz da Classificação | Tenha 50 lançamentos categorizados. | Comum | `Tags` | `categorized` | 50 |
| `categorizador_100` | Organizador | Tenha 100 lançamentos categorizados. | Comum | `Tags` | `categorized` | 100 |
| `categorizador_250` | Mestre da Ordem | Tenha 250 lançamentos categorizados. | Raro | `Tags` | `categorized` | 250 |
| `categorizador_500` | Taxonomista | Tenha 500 lançamentos categorizados. | Raro | `Tags` | `categorized` | 500 |
| `categorizador_1000` | Big Data Pessoal | 1.000 lançamentos categorizados. | Épico | `GraduationCap` | `categorized` | 1000 |
| `categorizador_2000` | Professor do Pigo | 2.000 lançamentos categorizados treinando o app. | Épico | `GraduationCap` | `categorized` | 2000 |
| `categorizador_5000` | Oráculo das Contas | 5.000 lançamentos categorizados com maestria. | Lendário | `Crown` | `categorized` | 5000 |
| `caixa_zero_20` | Mesa Organizada | Nenhum lançamento sem categoria (mínimo 20 transações). | Comum | `Inbox` | `inboxZero20` | 1 |
| `caixa_zero` | Caixa de Entrada Zero | Nenhum lançamento sem categoria (mínimo 50 lançamentos). | Raro | `Inbox` | `inboxZero` | 1 |
| `caixa_zero_100` | Perfeccionismo Total | Nenhum lançamento sem categoria (mínimo 100 transações). | Épico | `Inbox` | `inboxZero100` | 1 |
| `caixa_zero_250` | Mestre da Limpeza | Nenhum lançamento sem categoria (mínimo 250 transações). | Lendário | `Crown` | `inboxZero250` | 1 |

---

### 3. Meses no Azul & Saúde Financeira (`positive_months`)
*Premia a consistência em manter receitas maiores do que despesas.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `mes_azul` | No Azul | Feche um mês com resultado positivo. | Comum | `TrendingUp` | `positiveMonths` | 1 |
| `azul_2` | Caminho Seguro | 2 meses seguidos no azul. | Comum | `TrendingUp` | `positiveStreak` | 2 |
| `azul_3` | Trimestre Azul | 3 meses seguidos no azul. | Raro | `Flame` | `positiveStreak` | 3 |
| `azul_6` | Semestre Impecável | 6 meses seguidos no azul. | Épico | `Flame` | `positiveStreak` | 6 |
| `azul_9` | Nove Meses Invictos | 9 meses seguidos no azul. | Épico | `Flame` | `positiveStreak` | 9 |
| `azul_12` | Ano de Ouro | 12 meses seguidos no azul. | Lendário | `Crown` | `positiveStreak` | 12 |
| `azul_18` | Lenda da Consistência | 18 meses seguidos no azul. | Lendário | `Crown` | `positiveStreak` | 18 |
| `total_meses_azul_3` | Três Vitórias | Acumule 3 meses no azul no histórico. | Comum | `TrendingUp` | `positiveMonths` | 3 |
| `total_meses_azul_6` | Meio Ano Vitorioso | Acumule 6 meses no azul no histórico. | Raro | `TrendingUp` | `positiveMonths` | 6 |
| `total_meses_azul_12` | Doze Meses Positivos | Acumule 12 meses no azul no histórico. | Épico | `Trophy` | `positiveMonths` | 12 |
| `total_meses_azul_24` | Dois Anos de Sucesso | Acumule 24 meses no azul no histórico. | Lendário | `Trophy` | `positiveMonths` | 24 |

---

### 4. Reserva de Emergência (`reserve`)
*Incentiva a criação e o fortalecimento do colchão financeiro.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `primeira_reserva` | Primeiro Tijolo | Faça seu primeiro aporte na reserva. | Comum | `PiggyBank` | `reserveAportes` | 1 |
| `aportes_3` | Hábito de Guardar | Faça 3 aportes na reserva de emergência. | Comum | `PiggyBank` | `reserveAportes` | 3 |
| `aportes_6` | Poupança Ativa | Faça 6 aportes na reserva de emergência. | Raro | `PiggyBank` | `reserveAportes` | 6 |
| `aportes_12` | Aportador Constante | Faça 12 aportes na reserva de emergência. | Raro | `PiggyBank` | `reserveAportes` | 12 |
| `aportes_24` | Muralha de Aportes | Faça 24 aportes na reserva de emergência. | Épico | `PiggyBank` | `reserveAportes` | 24 |
| `reserva_meio_mes` | Primeiro Fôlego | Reserva cobrindo metade (0.5) de um mês de custo de vida. | Comum | `Shield` | `reserveCoverage` | 0.5 |
| `reserva_1` | Um Mês de Paz | Reserva cobrindo 1 mês de custo de vida. | Raro | `Shield` | `reserveCoverage` | 1 |
| `reserva_2` | Duplo Escudo | Reserva cobrindo 2 meses de custo de vida. | Raro | `ShieldCheck` | `reserveCoverage` | 2 |
| `reserva_3` | Colchão Seguro | Reserva cobrindo 3 meses de custo de vida. | Épico | `ShieldCheck` | `reserveCoverage` | 3 |
| `reserva_6` | Escudo Blindado | Reserva cobrindo 6 meses de custo de vida. | Épico | `Castle` | `reserveCoverage` | 6 |
| `reserva_completa` | Fortaleza | Atinja a meta completa estabelecida para sua reserva. | Lendário | `Castle` | `reserveComplete` | 1 |

---

### 5. Faturas de Cartão de Crédito (`invoices`)
*Estimula o pagamento pontual e responsável das faturas.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `fatura_1` | Primeira Fatura Paga | Pague sua primeira fatura de cartão em dia. | Comum | `CreditCard` | `invoicesOnTime` | 1 |
| `fatura_3` | Pagador Pontual | Pague 3 faturas de cartão até o vencimento. | Comum | `CreditCard` | `invoicesOnTime` | 3 |
| `fatura_6` | Cartão Sob Controle | Pague 6 faturas de cartão até o vencimento. | Raro | `CreditCard` | `invoicesOnTime` | 6 |
| `fatura_12` | Crédito de Ouro | Pague 12 faturas até o vencimento. | Épico | `CreditCard` | `invoicesOnTime` | 12 |
| `fatura_18` | Mestre dos Vencimentos | Pague 18 faturas até o vencimento. | Épico | `CreditCard` | `invoicesOnTime` | 18 |
| `fatura_24` | Score Perfeito | Pague 24 faturas até o vencimento. | Lendário | `Crown` | `invoicesOnTime` | 24 |

---

### 6. Tetos de Orçamento (`budgets`)
*Fomenta o respeito aos limites definidos por categoria de gastos.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `orcamento_1` | Primeiro Teto Cumprido | Cumpra seu primeiro teto de orçamento mensal. | Comum | `Target` | `budgetsKept` | 1 |
| `orcamento_3` | Disciplina Orçamentária | Cumpra 3 tetos de orçamento mensais. | Comum | `Target` | `budgetsKept` | 3 |
| `orcamento_5` | Dentro do Teto | Cumpra 5 tetos de orçamento mensais. | Raro | `Target` | `budgetsKept` | 5 |
| `orcamento_10` | Mestre do Orçamento | Cumpra 10 tetos de orçamento mensais. | Épico | `Target` | `budgetsKept` | 10 |
| `orcamento_15` | Guardião dos Gastos | Cumpra 15 tetos de orçamento mensais. | Épico | `Target` | `budgetsKept` | 15 |
| `orcamento_25` | Controle Absoluto | Cumpra 25 tetos de orçamento mensais. | Lendário | `Crown` | `budgetsKept` | 25 |

---

### 7. Missões Semanais (`missions`)
*Incentiva o cumprimento dos objetivos semanais gerados pelo Pigo.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `missoes_1` | Primeira Missão | Conclua sua primeira missão semanal. | Comum | `Swords` | `missionsCompleted` | 1 |
| `missoes_3` | Desbravador de Desafios | Conclua 3 missões semanais. | Comum | `Swords` | `missionsCompleted` | 3 |
| `missoes_5` | Foco Semanal | Conclua 5 missões semanais. | Comum | `Swords` | `missionsCompleted` | 5 |
| `missoes_10` | Caçador de Missões | Conclua 10 missões semanais. | Raro | `Swords` | `missionsCompleted` | 10 |
| `missoes_25` | Veterano de Missões | Conclua 25 missões semanais. | Épico | `Trophy` | `missionsCompleted` | 25 |
| `missoes_50` | Campeão do Pigo | Conclua 50 missões semanais. | Lendário | `Crown` | `missionsCompleted` | 50 |

---

### 8. Detecção Inteligente e Assinaturas (`intelligence`)
*Recompensa o mapeamento de gastos fixos e recorrentes.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `detetive_1` | Olho Clínico | O Pigo identificou 1 despesa recorrente nos seus lançamentos. | Comum | `Search` | `recurringDetected` | 1 |
| `detetive_3` | Radar de Assinaturas | 3 despesas recorrentes identificadas. | Comum | `Search` | `recurringDetected` | 3 |
| `detetive` | Detetive de Assinaturas | O Pigo identificou 5 despesas recorrentes nos seus extratos. | Raro | `Search` | `recurringDetected` | 5 |
| `detetive_10` | Inspetor Implacável | 10 despesas recorrentes mapeadas no sistema. | Épico | `Search` | `recurringDetected` | 10 |

---

### 9. Hábitos e Rotina Diária (`habits`)
*Gamifica o rastreamento diário de hábitos saudáveis e produtivos.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `habito_primeiro` | O Começo de Tudo | Crie seu primeiro hábito diário no Pigo Hábitos. | Comum | `Sparkles` | `activeHabits` | 1 |
| `habito_checkin_1` | Primeiro Check-in | Conclua seu primeiro hábito no dia. | Comum | `CalendarCheck` | `habitCheckins` | 1 |
| `habito_checkin_7` | Semana de Hábitos | 7 check-ins de hábitos concluídos. | Comum | `CalendarCheck` | `habitCheckins` | 7 |
| `habito_checkin_21` | Regra dos 21 Dias | 21 check-ins de hábitos acumulados. | Raro | `Flame` | `habitCheckins` | 21 |
| `habito_checkin_50` | Mente Focada | 50 check-ins de hábitos completados. | Raro | `Trophy` | `habitCheckins` | 50 |
| `habito_checkin_100` | Centenário da Disciplina | 100 check-ins de hábitos completados. | Épico | `Trophy` | `habitCheckins` | 100 |
| `habito_checkin_250` | Mestre da Rotina | 250 check-ins de hábitos completados. | Lendário | `Crown` | `habitCheckins` | 250 |
| `habito_streak_7` | Fogo Sagrado | Mantenha 7 dias consecutivos cumprindo hábitos. | Raro | `Flame` | `habitStreak` | 7 |
| `habito_streak_21` | Inabalável | Mantenha 21 dias consecutivos cumprindo hábitos. | Épico | `Flame` | `habitStreak` | 21 |

---

### 10. Metas Financeiras (`goals`)
*Comemora a definição e a conclusão de sonhos e objetivos futuros.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `meta_criada` | Sonhador Estratégico | Crie sua primeira meta financeira no Pigo. | Comum | `Target` | `goalsCount` | 1 |
| `meta_concluida_1` | Sonho Realizado | Atinja 100% de uma meta financeira. | Raro | `Trophy` | `goalsCompleted` | 1 |
| `meta_concluida_3` | Conquistador de Sonhos | Atinja 100% em 3 metas financeiras. | Épico | `Trophy` | `goalsCompleted` | 3 |
| `meta_concluida_5` | Arquiteto do Futuro | Atinja 100% em 5 metas financeiras. | Lendário | `Crown` | `goalsCompleted` | 5 |

---

### 11. Hábitos Avançados & Dias Perfeitos (`habits`)
*Premia dias impecáveis (onde 100% dos hábitos foram completados) e longas sequências.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `habito_diversidade_3` | Tríade Diária | Tenha 3 ou mais hábitos ativos na sua rotina. | Comum | `Sparkles` | `activeHabits` | 3 |
| `habito_diversidade_5` | Rotina Completa | Tenha 5 ou mais hábitos ativos na sua grade diária. | Raro | `Sparkles` | `activeHabits` | 5 |
| `dia_perfeito_1` | Primeiro Dia Perfeito | Conclua 100% dos seus hábitos ativos em um mesmo dia. | Comum | `CalendarCheck` | `perfectHabitDays` | 1 |
| `dia_perfeito_7` | Semana 100% Impecável | Alcance 7 Dias Perfeitos (100% dos hábitos concluídos). | Raro | `Flame` | `perfectHabitDays` | 7 |
| `dia_perfeito_15` | Quinzena de Elite | Alcance 15 Dias Perfeitos cumprindo toda a grade. | Épico | `Trophy` | `perfectHabitDays` | 15 |
| `dia_perfeito_30` | Mês de Alta Performance | Alcance 30 Dias Perfeitos cumprindo todos os hábitos. | Lendário | `Crown` | `perfectHabitDays` | 30 |
| `habito_streak_14` | Duas Semanas de Fogo | Mantenha 14 dias consecutivos cumprindo hábitos. | Raro | `Flame` | `habitStreak` | 14 |
| `habito_streak_30` | Trinta Dias de Aço | Mantenha 30 dias consecutivos cumprindo hábitos. | Épico | `Flame` | `habitStreak` | 30 |
| `habito_streak_60` | Disciplina Inabalável | Mantenha 60 dias consecutivos cumprindo hábitos. | Lendário | `Crown` | `habitStreak` | 60 |

---

### 12. Segundo Cérebro: Anotações & Ideias (`tools`)
*Gamifica o uso das ferramentas de documentação e anotações estilo Notion.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `nota_primeira` | Primeira Ideia no Papel | Crie sua primeira anotação nas Ferramentas do Pigo. | Comum | `Library` | `notesCount` | 1 |
| `nota_fixada` | Foco Prioritário | Fixe uma anotação importante no topo do seu quadro. | Comum | `Sparkles` | `pinnedNotesCount` | 1 |
| `notas_5` | Bloco de Ideias Ativo | Mantenha 5 anotações organizadas no Pigo. | Comum | `Library` | `notesCount` | 5 |
| `notas_15` | Segundo Cérebro | Construa uma base sólida com 15 anotações salvas. | Raro | `GraduationCap` | `notesCount` | 15 |
| `notas_30` | Enciclopédia Pessoal | Alcance 30 anotações salvas no seu Segundo Cérebro. | Épico | `Crown` | `notesCount` | 30 |

---

### 13. Mapas Mentais & Estratégia Visual (`tools`)
*Reconhece o planejamento visual e ramificação de ideias e projetos.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `mapa_primeiro` | Arquiteto de Ideias | Crie seu primeiro Mapa Mental interativo. | Comum | `Sparkles` | `mindmapsCount` | 1 |
| `mapa_ramificado_6` | Pensamento Ramificado | Construa um Mapa Mental com pelo menos 6 nós conectados. | Raro | `Target` | `maxMindmapNodes` | 6 |
| `mapa_ramificado_12` | Teia Estratégica | Construa um Mapa Mental complexo com 12 ou mais nós. | Épico | `Trophy` | `maxMindmapNodes` | 12 |
| `mapas_3` | Estrategista Visual | Tenha 3 quadros de Mapas Mentais criados. | Raro | `Library` | `mindmapsCount` | 3 |
| `mapas_5` | Mente Cartográfica | Mantenha 5 quadros de Mapas Mentais estruturados. | Épico | `Crown` | `mindmapsCount` | 5 |

---

### 14. Cofre de Senhas & Segurança Digital (`tools`)
*Incentiva a proteção e criptografia de credenciais locais.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `cofre_primeira` | Cofre Blindado | Guarde sua primeira credencial criptografada no Cofre de Senhas. | Comum | `Shield` | `vaultItemsCount` | 1 |
| `cofre_5` | Chaveiro Seguro | Proteja 5 senhas no Cofre Criptografado do Pigo. | Comum | `ShieldCheck` | `vaultItemsCount` | 5 |
| `cofre_15` | Guardião Digital | Proteja 15 credenciais no Cofre de Senhas. | Raro | `ShieldCheck` | `vaultItemsCount` | 15 |
| `cofre_30` | Fortaleza Criptografada | Mantenha 30 senhas protegidas com criptografia AES-256. | Épico | `Castle` | `vaultItemsCount` | 30 |

---

### 15. Domínio Completo da Plataforma (`reserve` / `tools`)
*Conquistas supremas para usuários que exploram todo o poder do ecossistema Pigo.*

| ID | Nome da Conquista | Descrição | Raridade | Ícone | Métrica | Meta |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `contas_multiplas` | Visão Multi-Bancos | Cadastre 3 ou mais contas bancárias ou carteiras. | Comum | `PiggyBank` | `accountsCount` | 3 |
| `mestre_4_pilares` | Mestre dos 4 Pilares | Use ativamente Finanças, Hábitos, Notas/Mapas e Cofre de Senhas no Pigo! | Lendário | `Crown` | `pillarsActiveCount` | 4 |

---

## 📝 Como solicitar as mudanças depois de editar

Quando você alterar títulos, nomes ou conquistas nesta tabela:
1. Salve este arquivo `docs/JORNADA_NIVEIS_E_CONQUISTAS.md`.
2. Diga no chat: **"Atualize o código com as alterações que fiz no documento de níveis e conquistas"**.
3. O motor sincronizará automaticamente todas as alterações nos arquivos do sistema (`electron/gamificationEngine.cjs`).
