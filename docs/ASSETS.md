# Assets do jogo (pixel art)

Há dois lugares para assets, com papéis diferentes:

| Onde | Para quem | Como funciona |
|---|---|---|
| **`src/game/pack/`** — pacote oficial | **Todos os jogadores** | Você coloca os PNGs aqui e cadastra em `pack.json` (nome, tamanho e **qual conquista ou nível libera**). Eles vão dentro do instalador e chegam a todo mundo pela atualização automática. |
| `%APPDATA%\financeiro\game-assets\` — modo criador | Só você, para testar | Solte um PNG e clique em *Quarto → Criador → Recarregar*. Aparece na hora, sem recompilar. Quando estiver bom, mova para o pacote oficial. |

Arquivos de código relacionados:

| Arquivo | O que é |
|---|---|
| `src/game/pack/pack.json` | Catálogo do pacote oficial |
| `src/game/pack.ts` | Carregador do pacote (empacota automaticamente todo PNG da pasta) |
| `src/game/mobis.tsx` | Mobis desenhados em código (24) e suas conquistas |
| `src/game/avatar.tsx` | Opções do provador (cabelos, roupas, acessórios) e o que libera cada uma |
| `src/game/avatarSheet.ts` | Veste o corpo base (`pack/avatar/base.png`) por regiões e gera direções, caminhada e pose sentada |
| `src/game/room.ts` | Plantas de quarto (mapas de altura) e o nível de cada uma |
| `src/game/sprites.ts` | Sprites pequenos (Pigo pet, goblins, dragão…) |

## Pacote oficial: estrutura

```
src/game/pack/
├── pack.json
├── mobis/       bau_tesouro.png, meu_sofa.png, meu_sofa_r1.png…
├── pisos/       parquet.png…
└── paredes/     tijolinho.png…
```

### pack.json

```json
{
  "mobis": [
    {
      "id": "meu_sofa",
      "name": "Sofá de Couro",
      "description": "Liberado com 3 meses no azul.",
      "file": "mobis/meu_sofa.png",
      "fileRotated": "mobis/meu_sofa_r1.png",
      "w": 2, "d": 1,
      "category": "assentos",
      "rooms": ["finance", "life"],
      "qty": 1,
      "seat": true, "seatZ": 8,
      "offsetX": 0, "offsetY": 0,
      "unlock": { "type": "achievement", "id": "azul_3", "label": "Trimestre Azul" }
    }
  ],
  "floors": [
    { "id": "parquet", "name": "Parquet", "file": "pisos/parquet.png", "unlock": { "type": "level", "level": 4 } }
  ],
  "walls": [
    { "id": "tijolinho", "name": "Tijolinho", "file": "paredes/tijolinho.png", "unlock": { "type": "default" } }
  ],
  "overrides": {
    "cofre": { "file": "mobis/cofre_hd.png", "offsetY": -2 }
  }
}
```

- **`unlock`**: `{ "type": "default" }` (sempre liberado), `{ "type": "level", "level": 10 }` ou `{ "type": "achievement", "id": "<id>", "label": "<nome>" }`.
  Ids de conquistas: `primeiro_extrato`, `extratos_10`, `extratos_50`, `categorizador_100`, `categorizador_500`, `categorizador_2000`, `caixa_zero`, `mes_azul`, `azul_3`, `azul_6`, `azul_12`, `primeira_reserva`, `aportes_12`, `reserva_1`, `reserva_3`, `reserva_completa`, `semanas_4`, `semanas_12`, `fatura_3`, `fatura_12`, `orcamento_5`, `missoes_10`, `detetive`.
- **`overrides`**: troca o desenho de um mobi embutido (mantém a conquista dele). Ids: `cadeira`, `mesa`, `tapete`, `planta`, `luminaria`, `gaveteiro`, `estante_pastas`, `caixas`, `escrivaninha`, `vaso_azul`, `sofa_azul`, `estatua_pigo`, `cofre`, `cofre_forte`, `estatua_ouro`, `telescopio`, `relogio`, `registradora`, `balanca`, `quadro_missoes`, `aquario`, `lareira`, `trono`, `fonte_moedas`.
- **`seat`**: o avatar senta (duplo clique). `seatZ` = altura do assento.
- **`walkable`**: tapetes (dá para pisar e pôr móveis em cima).

Depois de adicionar: `npm test` confere se todo arquivo citado existe, e `npm run release` publica para todos.

## Avatar (corpo base)

O avatar é gerado a partir de **`src/game/pack/avatar/base.png`**: uma folha com as vistas do boneco **lado a lado**, na ordem
**costas · perfil (olhando para a direita) · frente · 3/4 de frente (olhando para a esquerda) · 3/4 de costas**.
O app separa as vistas sozinho (colunas vazias entre elas) e espelha para obter as 8 direções.

Regras para a arte funcionar:
- Pele em **uma cor lisa** (cadastrada em `pack.json → avatar.skin`, hoje `#fdc996`) e **contorno escuro** de 1 px.
- Fundo **transparente** ou branco (`avatar.background`).
- Todas as vistas com os **pés na mesma linha** e as mesmas proporções da referência (~79 px de altura): a cabeça termina ~54 px acima dos pés, o tronco vai até ~22 px e os sapatos ocupam os 3 px de baixo.

A partir disso o app **veste** o boneco por regiões (camisa/mangas, calça, sapatos), desenha **cabelos e acessórios** com contorno, gera os **passos da caminhada** e a pose **sentada**. As opções do provador (e o que libera cada uma) ficam em `src/game/avatar.tsx`.

## Resolução e como desenhar

- O piso é feito de losangos de **64 × 32 px**; o avatar ocupa um quadro de **32 × 64 px**.
- **1 pixel da imagem = 1 pixel do quarto** (a tela amplia sem borrar).

### Mobis

Vista **isométrica**, com o losango do chão que o mobi ocupa **encostado na borda de baixo** e centralizado:

```
        ┌──────────────┐  ← altura livre
        │    ▓▓▓▓▓▓    │
        │  ▓▓▓▓▓▓▓▓▓▓  │
        │ ◇◇◇◇◇◇◇◇◇◇◇◇ │  ← losango do chão: (w + d) × 32 px de largura
        └──────◇───────┘  ← ponta de baixo do losango = borda inferior
```

| Pegada (w × d) | Largura ideal |
|---|---|
| 1 × 1 | 64 px |
| 2 × 1 | 96 px |
| 2 × 2 | 128 px |

`fileRotated` é a versão girada; sem ela o app espelha a imagem. Veja `mobis/bau_tesouro.png` como exemplo.

### Pisos

Textura **quadrada e plana** (vista de cima): 32 × 32 ou 64 × 64. O app projeta em cada tile.

### Paredes

Textura **plana** (vista de frente), **32 px de largura por tile** e altura igual à da parede (baixa 96, normal 144, alta 208 px). O app inclina para as duas paredes.

## Modo criador

Mesma organização, na pasta `%APPDATA%\financeiro\game-assets\` (`mobis/`, `pisos/`, `paredes/`, `pigo.png`, `manifest.json`). Serve para testar rapidamente; itens do modo criador não têm desbloqueio e não vão para os outros jogadores.
