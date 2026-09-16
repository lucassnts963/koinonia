# Leitura em áudio (TTS) — o que existe e o que fica para depois

## O que existe agora

Duas opções, escolhidas pelo próprio usuário em Tenda → Leitura em Áudio,
guardadas em `localStorage` (preferência de aparelho, mesma razão de
`preferencias-leitura.ts`):

1. **Motor A — voz do navegador** (`lib/audio/motor-navegador.ts`), padrão.
   `window.speechSynthesis`, já embutida em todo navegador moderno. Zero
   download, zero processamento além do que o sistema operacional já faz
   nativamente para qualquer app.
2. **Motor B — voz neural** (`lib/audio/motor-neural.ts`), opt-in explícito.
   `@diffusionstudio/vits-web` (modelos Piper/VITS via ONNX Runtime Web),
   rodando 100% no navegador de quem está ouvindo. A tela de configuração
   mostra o tamanho real do modelo (buscado da própria biblioteca) antes de
   baixar, e deixa claro que o processamento acontece no aparelho da pessoa.

Import sempre dinâmico: quem nunca escolhe a voz neural não baixa uma linha
sequer de `@diffusionstudio/vits-web` no bundle.

### Por que não Kokoro

A pesquisa inicial apontava `kokoro-js` como candidato óbvio (82M de
parâmetros, leve, com vozes listadas para "Brazilian Portuguese" na
documentação do modelo original). Na prática, `kokoro-js@1.2.1` **valida a
voz contra uma lista embutida no pacote que só contém inglês americano e
britânico** — `pf_dora`/`pm_alex`/`pm_santa` existem como arquivos `.bin`
soltos no pacote npm, mas `generate()` rejeita essas chaves com "Voice not
found". Confirmado lendo o bundle publicado, não a documentação do modelo.
`@diffusionstudio/vits-web` tem `pt_BR-edresson-low`/`pt_BR-faber-medium`
como `VoiceId` de verdade no tipo do pacote — por isso a escolha.

## Opção C — servidor de TTS próprio (não implementada)

Rodar Piper/Kokoro num contêiner **fora da Vercel** (o `docker-compose.yml`
e o Caddy já existentes no repo servem de base) — daria voz consistente
para todo mundo, sem depender do navegador de cada um, e sem download no
aparelho de quem lê. O motivo de não fazer agora: é infraestrutura nova
para manter (uma VPS, ainda que pequena), e as opções A/B já resolvem o
caso real sem esse custo operacional. Só faz sentido revisitar se:

- A qualidade das vozes neurais client-side (Piper "low"/"medium") não for
  suficiente e o produto justificar uma voz melhor (XTTS, Kokoro completo)
  que só roda com mais RAM/CPU do que um celular tem;
- Já existir uma VPS no ar por outro motivo, tornando o custo marginal.

Se for feito: gerar o áudio uma vez por (capítulo, versão, voz) e cachear o
arquivo no Storage do Supabase, servindo o mesmo `.mp3`/`.ogg` para todo
mundo depois — sem isso, cada leitura reprocessaria o mesmo texto.
