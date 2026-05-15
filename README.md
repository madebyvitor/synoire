# Synoire

Plataforma social de produtividade para concurseiros — React, Tailwind, Supabase, Motion. Deploy previsto na Netlify.

## Requisitos

- Node.js 20+
- Projeto Supabase (URL + anon key)

## Setup

```bash
cd synoire
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — produção
- `npm run preview` — pré-visualizar build

## Documentação interna

Ver `AGENTS.md` para visão de produto, stack e decisões.
