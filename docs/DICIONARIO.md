# Dicionário — sem IA, com plano futuro documentado

## O que existe agora

Duas fontes, nenhuma delas dependente de chamar um modelo de linguagem em
tempo real:

1. **Concordância** — `actions/bible.ts:searchVersesByTerm()`. Já existia,
   custo zero: acha o termo em `bible_verses` (FTS por versão) e devolve os
   versículos. Aba "Ver na Bíblia" do popover de palavra e da página
   `/wiki/[termo]`.
2. **Verbete curado** — `dictionary_entries`, escrito por gente. Qualquer
   usuário propõe (`proporVerbete`, nasce `status = 'draft'`); a liderança
   aprova (`aprovar_verbete`, `security definer`, mesmo padrão de
   `resolver_denuncia`) antes de virar público. Telas em `/wiki` e
   `/wiki/[termo]`, fila de revisão em `/wiki/pendentes`.

O cache gerado por IA que existia antes desta mudança (`source =
'ai_generated'`, ~29 verbetes em produção) **não foi apagado** — apagar
destruiria conteúdo real que alguém já leu, só por purismo. Ficou marcado
como tal na UI (selo "Gerado por IA (arquivo)") e como `published`, e nada
novo é gerado assim: `actions/dictionary.ts` não chama mais nenhuma API de
IA.

## Por que não uma API de dicionário agora

Pesquisado, não integrado — fica como opção documentada, não como
prioridade:

- **[IQ Bible API](https://iqbible.com/api-docs/)** — tem endpoint dedicado
  de léxico Strong's (hebraico/grego), é a opção mais alinhada ao que o
  popover de palavra faria com uma "Definição" técnica de termo original.
- **[BibleHub API](https://parse.bot/marketplace/e020e1c0-99c8-45a4-9bcc-0fcc7d3ba321/biblehub-com-api)**
  — léxico de Strong's (Hebraico/Grego), dados de Brown-Driver-Briggs e
  Thayer's, interlinear e morfologia. Cobre a mesma necessidade que o IQ
  Bible, formato de dados diferente.
- **[API.Bible](https://scripture.api.bible)** (American Bible Society) —
  forte em texto bíblico multi-versão/multi-idioma (~2500 versões), mas o
  suporte a números de Strong's não é claramente documentado no free tier;
  serviria mais para versões adicionais do que para o dicionário em si.
- Para termos **não bíblicos** (uma palavra comum que alguém clica sem ser
  termo técnico), uma API de dicionário geral de português (ex.:
  [Dicionário Aberto](https://dicionario-aberto.net/) ou a API do
  Wiktionary) resolveria sem custo por chamada de IA.

Motivo de não integrar agora: cada uma dessas fontes tem seu próprio
formato, limites de taxa e (no caso de API.Bible) modelo de chave por
aplicação — integrar direito é decisão de produto (qual cobrir primeiro,
como cachear, o que fazer quando a fonte externa não responde), não uma
troca de uma linha. A Concordância + Verbete curado já resolvem o caso
real sem essa complexidade e sem depender de um serviço de terceiro no
caminho crítico da leitura.

## Se for integrar depois

1. Escolher **uma** fonte por caso de uso (léxico Strong's vs. dicionário
   geral) em vez de tentar cobrir as duas com o mesmo código.
2. Cachear a resposta em `dictionary_entries` com `source` descrevendo a
   API de origem (hoje só distingue `manual`/`ai_generated`) — mesma ideia
   de memoização que existia com IA, sem repetir a chamada externa a cada
   clique.
3. Verbete de API entra como `draft` até a liderança revisar, igual a
   proposta humana — uma API externa pode errar contexto teológico do
   mesmo jeito que a IA errava.
4. Nunca no caminho síncrono do popover de palavra: se a API externa cair
   ou demorar, a Concordância (que não depende de nada de fora) continua
   funcionando sozinha.
