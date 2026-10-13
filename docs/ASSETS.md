# Assets do jogo (pixel art)

O Pigo desenha tudo em código por padrão, mas **qualquer mobi, piso, parede e o próprio Pigo podem ser trocados por PNGs seus**, sem recompilar o app.

## Onde colocar

| Onde | Para quê |
|---|---|
| `%APPDATA%\financeiro\game-assets\` | **Sua pasta de assets** (lida pelo app em tempo de execução). É criada na primeira vez que você abre o **Quarto**. No app: *Quarto → aba "Quarto" → Abrir pasta*. Depois de copiar os PNGs, clique em **Recarregar**. |
| `src/game/sprites.ts` | Sprites embutidos no código (Pigo, goblins, dragão, moedas…) desenhados como matriz de caracteres. |
| `src/game/mobis.tsx` | Catálogo de mobis: nome, tamanho, **regra de desbloqueio** (conquista/nível) e desenho padrão. Papéis de parede e pisos do catálogo também ficam aqui. |
| `src/game/iso.tsx` | Motor isométrico (projeção 2:1, rasterização em pixels). |

```
game-assets/
├── LEIA-ME.txt          guia rápido (gerado pelo app)
├── manifest.json        nomes, tamanhos e ajustes finos
├── pigo.png             substitui o Pigo
├── mobis/
│   ├── cofre.png        substitui o mobi "cofre"
│   ├── cofre_r1.png     versão girada (opcional; sem ela o app espelha)
│   └── meu_sofa.png     id novo => mobi NOVO, já liberado
├── pisos/
│   └── madeira_hd.png   novo piso (textura plana)
└── paredes/
    └── tijolo.png       novo papel de parede (textura plana)
```

## Resolução

- Cada tile do piso do Quarto é um losango de **64 × 32 px**.
- **1 pixel da sua imagem = 1 pixel do quarto.** A tela amplia sem borrar (`image-rendering: pixelated`).

## Mobis (`mobis/<id>.png`)

Desenhe em **vista isométrica**, com o losango do chão que o mobi ocupa **encostado na borda de baixo** da imagem e centralizado na horizontal:

```
        ┌──────────────┐  ← altura livre
        │    ▓▓▓▓▓▓    │
        │  ▓▓▓▓▓▓▓▓▓▓  │
        │ ◇◇◇◇◇◇◇◇◇◇◇◇ │  ← losango do chão (w + d) × 32 px de largura
        └──────◇───────┘  ← ponta de baixo do losango = borda inferior
```

| Pegada (w × d) | Largura ideal da imagem |
|---|---|
| 1 × 1 | 64 px |
| 2 × 1 | 96 px |
| 2 × 2 | 128 px |

- **Ids existentes** (substituem o desenho, mantendo a conquista que libera): `cadeira`, `mesa`, `tapete`, `planta`, `luminaria`, `gaveteiro`, `estante_pastas`, `caixas`, `escrivaninha`, `vaso_azul`, `sofa_azul`, `estatua_pigo`, `cofre`, `cofre_forte`, `estatua_ouro`, `telescopio`, `relogio`, `registradora`, `balanca`, `quadro_missoes`, `aquario`, `lareira`, `trono`, `fonte_moedas`.
- **Id novo** vira um mobi novo no inventário (liberado, quantidade ilimitada). Defina nome e pegada no `manifest.json`.
- **Rotação**: `<id>_r1.png` é a versão girada. Sem ela, o app espelha a imagem horizontalmente.

## Pisos (`pisos/<nome>.png`)

Textura **quadrada e plana** (vista de cima), por exemplo 32 × 32 ou 64 × 64. O app projeta a textura em cada losango do piso.

## Paredes (`paredes/<nome>.png`)

Textura **plana** (vista de frente): **32 px de largura por tile**, altura = altura da parede:

| Parede | Altura da textura |
|---|---|
| baixa | 80 px |
| normal | 128 px |
| alta | 192 px |

O app inclina a textura para as duas paredes e escurece a lateral.

## Pigo (`pigo.png`)

A base da imagem é o pé do personagem (fica no centro do tile). Tamanho livre. Ele é espelhado quando anda para o outro lado.

## manifest.json

```json
{
  "mobis": {
    "meu_sofa": { "name": "Meu Sofá", "w": 2, "d": 1, "walkable": false, "offsetX": 0, "offsetY": 0 },
    "cofre": { "offsetY": -4 }
  },
  "pigo": { "offsetX": 0, "offsetY": 0 }
}
```

- `w` / `d`: pegada em tiles (padrão 1 × 1).
- `walkable`: `true` para tapetes (dá para pisar e pôr móveis em cima).
- `offsetX` / `offsetY`: ajuste fino em pixels.

> Para mudar **qual conquista libera** um mobi, ou criar mobis que dependam de conquistas, edite `src/game/mobis.tsx` (campo `unlock`).
