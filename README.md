# 🎮 CHECKPOINT DIGITAL

Portal de revenda de jogos com sistema de links afiliados e cupons de desconto automáticos.

## Como Funciona

1. **Cliente navega** pelo catálogo de jogos na **CHECKPOINT DIGITAL**
2. **Escolhe o jogo** e clica em "Comprar Agora" ou "Ir à Loja"
3. **Sistema registra** o clique no banco de dados (para analytics)
4. **Cliente é redirecionado** à loja oficial parceira com:
   - O produto já no carrinho
   - O cupom de desconto já aplicado (via parâmetro na URL, ex: `CP-DIGITAL`)

> **O segredo está na URL afiliada.** Ao cadastrar um link, você já inclui o `?ref=` e `?coupon=CP-DIGITAL` no próprio link, então o redirecionamento é instantâneo e automático.

---

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Express 5 + TypeScript + JWT
- **Banco:** PostgreSQL (Neon DB recomendado)
- **Deploy:** Qualquer VPS / Vercel / Railway

---

## Instalação

### 1. Clone e instale dependências

```bash
# Copie a pasta gamestore para o seu projeto
cd gamestore
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com seus dados do banco PostgreSQL e JWT secret
```

### 3. Crie as tabelas no banco

Execute os arquivos SQL na ordem:

```bash
# No psql ou pelo painel do Neon:
\i database/schema.sql
\i database/seed.sql    # opcional: dados de exemplo
```

### 4. Crie o usuário admin

```bash
npx tsx scripts/criar-admin.ts "Admin Checkpoint" "admin@checkpoint.com" "suaSenhaAqui"
```

### 5. Inicie o projeto

```bash
# Iniciar backend + frontend juntos:
npm run dev:all

# Ou separado:
npm run server   # Express na porta 3001
npm run dev      # Vite na porta 8081
```

Acesse: `http://localhost:8081`
Admin: `http://localhost:8081/admin`

---

## Estrutura do Projeto

```
gamestore/
├── database/
│   ├── schema.sql          # Tabelas do banco
│   └── seed.sql            # Dados de exemplo
├── scripts/
│   └── criar-admin.ts      # Script para criar usuário admin
├── server/
│   └── index.ts            # Backend Express completo
├── src/
│   ├── components/
│   │   ├── Navbar.tsx       # Navegação com busca
│   │   ├── Footer.tsx       # Rodapé
│   │   └── GameCard.tsx     # Card de jogo (3 variantes)
│   ├── pages/
│   │   ├── HomePage.tsx         # Página inicial com seções
│   │   ├── JogosPage.tsx        # Catálogo com filtros
│   │   ├── JogoPage.tsx         # Detalhe + links de compra
│   │   ├── AdminPage.tsx        # Dashboard admin
│   │   ├── AdminJogoModal.tsx   # Modal criar/editar jogo
│   │   └── AdminLinksModal.tsx  # Modal gerenciar links
│   ├── services/
│   │   └── api.ts           # Todas as chamadas à API
│   ├── types/
│   │   └── index.ts         # Tipos TypeScript
│   ├── App.tsx              # Rotas
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globais + variáveis
├── .env.example
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## Banco de Dados — Tabelas Principais

### `loja.jogos`
Cadastro de jogos com preços, flags (destaque, lançamento, promoção) e metadados.

### `loja.links_afiliado`
**A tabela mais importante.** Cada registro representa um link para uma loja parceira:

| Campo | Descrição |
|-------|-----------|
| `jogo_id` | Jogo relacionado |
| `plataforma_id` | PS5, Xbox, PC, etc. |
| `nome_loja` | "Nuuvem", "PlayStation Store", etc. |
| `url_afiliado` | **URL completa com cupom no link** |
| `codigo_cupom` | Código exibido para o usuário copiar |
| `preco_loja` | Preço normal na loja |
| `preco_loja_com_cupom` | Preço após aplicar o cupom |
| `destaque` | Se é a "Melhor Oferta" |

### `loja.log_cliques`
Registra cada clique em link afiliado para analytics.

---

## Rotas da API

### Públicas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/jogos` | Listar jogos (aceita filtros via query) |
| GET | `/api/jogos/:slug` | Detalhe do jogo + links afiliados |
| POST | `/api/jogos/:jogoId/clique/:linkId` | Registrar clique + retornar URL |
| GET | `/api/plataformas` | Listar plataformas |
| GET | `/api/categorias` | Listar categorias |
| POST | `/api/auth/login` | Login admin |

### Admin (requer JWT)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/jogos` | Listar todos os jogos |
| POST | `/api/admin/jogos` | Criar jogo |
| PUT | `/api/admin/jogos/:id` | Atualizar jogo |
| DELETE | `/api/admin/jogos/:id` | Excluir jogo |
| GET | `/api/admin/jogos/:id/links` | Links de um jogo |
| POST | `/api/admin/jogos/:id/links` | Adicionar link afiliado |
| PUT | `/api/admin/links/:id` | Atualizar link |
| DELETE | `/api/admin/links/:id` | Excluir link |
| GET | `/api/admin/stats` | Estatísticas |

---

## Filtros Disponíveis — GET `/api/jogos`

```
?plataforma=ps5
?categoria=rpg
?busca=elden
?destaque=true
?lancamento=true
?maisVendido=true
?emPromocao=true
```

Podem ser combinados: `?plataforma=ps5&emPromocao=true`

---

## Como Cadastrar um Link Afiliado

### Exemplo com Nuuvem (PC)
```
Nome da Loja: Nuuvem
URL Afiliado: https://www.nuuvem.com/item/elden-ring?ref=gamestore&coupon=GAMESTORE15
Código do Cupom: GAMESTORE15
Preço Normal: R$ 299,90
Preço com Cupom: R$ 254,90
Destaque: ✅ (marcar se for a melhor oferta)
```

### Exemplo com PlayStation Store
```
Nome da Loja: PlayStation Store
URL Afiliado: https://store.playstation.com/pt-br/product/EP0177-CUSA34823_00-ELDENRING0000001
Código do Cupom: (vazio - PSN não usa cupom externo)
Preço Normal: R$ 299,90
Preço com Cupom: R$ 299,90
Destaque: ❌
```

> **Dica:** Verifique com cada loja parceira o formato correto da URL afiliada e os parâmetros aceitos. Cada programa de afiliados tem seu próprio sistema.

---

## Identidade Visual

O projeto usa a mesma paleta de cores escura do Checkpoint Digital, adaptada para o contexto de loja gamer:

- **Cor principal:** Laranja neon (`hsl(25 95% 53%)`) — energia, ação, games
- **Cor secundária:** Azul neon (`hsl(199 89% 48%)`) — tecnologia
- **Background:** Quase preto (`hsl(220 20% 5%)`)
- **Fontes:** Barlow Condensed (títulos impactantes) + Barlow (corpo) + Rajdhani (UI)
- **Efeitos:** Glassmorphism, glow neon, gradientes escuros, grid pattern

---

## Deploy

### Backend (Railway / Render / VPS)
```bash
npm run build   # não necessário para o server, usa tsx direto
npm run server
```

### Frontend (Vercel / Netlify)
```bash
npm run build
# Deploy da pasta dist/
```

Configure a variável `VITE_API_URL` apontando para o backend em produção.
