# Synoire — contexto para agentes

## Produto

Plataforma web social de produtividade para **concurseiros**: salas de estudo em tempo real, hubs por concurso, dashboard de constância, metas, streaks e gamificação funcional — **sem** feed infinito nem rede social genérica.

## Stack

| Camada    | Tecnologia                          |
| --------- | ----------------------------------- |
| Frontend  | React (Vite + TypeScript), Tailwind |
| Backend   | Supabase (Auth, Postgres, Storage)  |
| Realtime  | Supabase Realtime                   |
| Animações | Motion (`motion/react`)             |
| Deploy    | Netlify (`netlify.toml`)            |
| Pagamentos| Stripe (futuro; não ligado na base) |

## Estrutura útil

- `src/lib/supabase.ts` — cliente singleton; exige `VITE_SUPABASE_*` no `.env`.
- `src/pages/*` — rotas do MVP em construção.
- `src/data/sampleHubs.ts` — hubs estáticos até existir tabela no Supabase.

## MVP (primeira versão)

Autenticação, perfil, hubs, salas, pomodoro sincronizado, dashboard básico, streaks, metas.

## Histórico de decisões

- **[14/05/2026]** Base do repositório: Vite React TS, Tailwind v4 (`@tailwindcss/vite`), Motion, React Router, cliente Supabase, layout minimalista e rotas esqueleto alinhadas ao MVP.
