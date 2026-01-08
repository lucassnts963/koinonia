# Koinonia - Plataforma de Discipulado Gamificado

**Koinonia** é uma Progressive Web App (PWA) open-source focada no engajamento bíblico de jovens e crianças através de gamificação com terminologia do Reino, não secular.

## 🛠 Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Offline:** Dexie.js (IndexedDB)
- **AI:** OpenAI API
- **Visualização:** react-force-graph
- **PWA:** next-pwa

## 🏛 Terminologia do Reino (Gamificação)

Neste projeto, NÃO utilizamos termos de RPG/Games seculares. Seguimos estritamente este "De/Para":

| Termo Secular (RPG) | Termo do Reino (Koinonia) |
|---------------------|---------------------------|
| **XP**              | **Talentos**              |
| **Level**           | **Estatura**              |
| **Guilda/Clan**     | **Tribo**                 |
| **Quest/Missão**    | **Chamado**               |
| **Streak**          | **Constância**            |
| **Badge**           | **Galardão**              |

**Níveis de Estatura:**
1. Neófito (Iniciante)
2. Discípulo
3. Obreiro
4. Mestre

## 📂 Estrutura de Pastas

```bash
/
├── app/
│   ├── transparencia/   # Página pública de finanças
│   ├── (auth)/          # Rotas de Login/Registro
│   └── (dashboard)/     # Rotas protegidas (Leitura, Teia, Discipulado)
├── components/          # Componentes Reutilizáveis UI
├── lib/
│   ├── db.ts            # Configuração do Dexie.js (Offline)
│   └── supabaseClient.ts
├── services/
│   └── bibleService.ts  # Lógica Híbrida (Supabase <-> Dexie)
├── supabase/
│   └── schema.sql       # Definições do Banco de Dados
└── public/
```

## 🚀 Configuração do Ambiente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Variáveis de Ambiente (.env.local):**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key_supabase
   OPENAI_API_KEY=sua_key_openai
   ```

3. **Banco de Dados:**
   Execute o script `supabase/schema.sql` no SQL Editor do seu projeto Supabase para criar as tabelas e políticas de segurança (RLS).

## 🧠 Configuração da IA (Dicionário Teológico)

Para garantir que a IA (OpenAI) responda com segurança teológica e precisão, utilize o seguinte **System Prompt** na sua implementação (Edge Function ou API Route):

### System Prompt
```text
Role: You represent a wise, orthodox Christian theologian and linguistics scholar, similar to C.S. Lewis or Timothy Keller.
Task: Define theological terms accurately based on the historical-grammatical method.
Constraints:
1. Use Biblical foundations (New and Old Testament references).
2. Prioritize definitions from Strong's Concordance and Vine's Expository Dictionary.
3. Be concise (max 3 sentences per definition unless asked for depth).
4. Tone: Pastoral, educational, and respectful.
5. If a term implies heresy or is controversial, present the orthodox consensus (Nicene Creed perspective).
6. NEVER invent meanings. If unknown, state that it is not in the text.
```

## 📱 PWA & Offline

O sistema utiliza `BibleService` para detectar conectividade.
- **Online:** Fetches via Supabase.
- **Offline:** Fallback para Dexie.js.
- O usuário pode baixar versões da bíblia (JSON) nas configurações.

## 🤝 Transparência (Monetização)

A rota `/transparencia` exibe em tempo real o balanço financeiro do projeto, comparando custos de servidor vs. doações, promovendo honestidade radical.