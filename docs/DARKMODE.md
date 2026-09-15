# Tema escuro — removido de Tenda, não implementado

`app/(app)/config/page.tsx` tinha um toggle claro/escuro que nunca fez nada — os
dois botões (`Sun`/`Moon`) não tinham `onClick`. Foi removido em vez de ligado,
porque **o app não tem uma única classe `dark:` em componente nenhum.**

O que existe é só o scaffold do `create-next-app`/shadcn em `app/globals.css`:

```css
@custom-variant dark (&:is(.dark *));
```

Isso declara a variante `dark:` para o Tailwind, mas nenhuma tela usa `dark:algumacoisa`
— todas as cores são literais (`bg-stone-50`, `text-amber-600`, etc.), a maior parte
delas herdadas do design "Stone/Amber" que é a identidade visual do produto.

## Por que não entrou nesta leva

Ligar o toggle sem mais nada pintaria a tela pela metade: um `<div className="dark">`
na raiz não muda nada, porque não há `dark:` para reagir. Fazer o toggle funcionar de
verdade é retrofit em **todas** as telas — Dashboard, Leitura, Jornada, Tribo,
Discussão, Moderação, Estudos, Teia, Tenda — decidindo para cada uma delas qual cor
escura corresponde a cada cor clara. Isso é trabalho do tamanho de uma fase própria,
não um botão a mais numa leva de "consertar o que está decorativo".

## Se for fazer depois

1. Definir a paleta escura primeiro (provavelmente `stone-900`/`stone-950` de fundo,
   texto em `stone-200`/`stone-100`, os acentos `amber-*` já funcionam bem em fundo
   escuro sem mudar).
2. Ir tela por tela adicionando `dark:` nas classes existentes — não um redesign, uma
   segunda passada de cor sobre o que já existe.
3. Decidir onde persistir a preferência: como o tamanho de fonte
   (`lib/preferencias-leitura.ts`), localStorage é suficiente — tema é preferência de
   aparelho, não de conta.
4. Cuidado com `components/teia/ForceGraphWrapper.tsx`: as cores dos nós do grafo
   (`#d97706`, `#22c55e`, `#3b82f6`) são hardcoded em JS, não em classe Tailwind — teriam
   que ler o tema também.
