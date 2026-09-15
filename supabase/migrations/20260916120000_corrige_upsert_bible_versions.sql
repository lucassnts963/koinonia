-- Bug na própria migration 20260904140000: o `on conflict (slug) do update
-- set` do catálogo de bible_versions esqueceu `is_enabled` na lista. Num
-- banco vazio isso nunca aparecia (a linha sempre nascia pelo INSERT, com
-- o valor certo da VALUES). Em produção, 'acf' já existia (seed antigo,
-- antes desta migration) — então o UPDATE rodou, sem tocar is_enabled, e a
-- linha ficou "licensed" mas com o `default true` do momento em que a
-- coluna foi criada na mesma migration.
--
-- Não vazou versículo: bible_verses.pode_ler_versao() já checa a licença
-- independente de is_enabled. O problema era só de catálogo: ACF continuava
-- aparecendo como opção selecionável, prometendo um texto que a RLS
-- bloqueia — a pessoa escolhia e via o capítulo vazio.
update public.bible_versions
   set is_enabled = case slug
     when 'blivre' then true
     when 'kjv' then true
     else false
   end
 where slug in ('blivre', 'kjv', 'acf', 'grc-nestle1904', 'hbo-wlc');
