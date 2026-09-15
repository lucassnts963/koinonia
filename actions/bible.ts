'use server'

import { createClient } from '@/lib/supabase/server'

export type SearchResult = {
    book_slug: string
    book_name: string
    chapter: number
    verse: number
    text: string
}

export async function searchVersesByTerm(term: string, versionSlug?: string): Promise<SearchResult[]> {
    const supabase = await createClient()

    // Sem filtro de versão, o resultado misturava traduções (ex: clicar numa
    // palavra da KJV podia trazer versículos da BLIVRE na lista). O clique
    // parte sempre de um capítulo que já está numa versão específica, então
    // a busca deve ficar na mesma — e cai no mesmo padrão de getChapter
    // quando nenhuma é informada (primeira habilitada por sort_order).
    const consultaVersao = supabase.from('bible_versions').select('id')

    const { data: versao, error: vError } = versionSlug
        ? await consultaVersao.eq('slug', versionSlug).maybeSingle()
        : await consultaVersao.order('sort_order').limit(1).maybeSingle()

    if (vError || !versao) {
        console.error('[searchVersesByTerm] versão', vError)
        return []
    }

    // ilike (não FTS) de propósito: aqui o uso é achar onde mais uma palavra
    // exata aparece a partir de um clique, não interpretar uma frase de
    // busca — websearch_to_tsquery radicalizaria e perderia a palavra clicada.
    const { data, error } = await supabase
        .from('bible_verses')
        .select(`
            chapter,
            verse,
            text,
            bible_books!inner (
                slug,
                name
            )
        `)
        .eq('version_id', versao.id)
        .ilike('text', `%${term}%`)
        .limit(20)

    if (error) {
        console.error(error)
        return []
    }

    type LinhaDeVersiculo = {
        chapter: number
        verse: number
        text: string
        bible_books: { slug: string; name: string }
    }

    return (data as unknown as LinhaDeVersiculo[]).map((item) => ({
        book_slug: item.bible_books.slug,
        book_name: item.bible_books.name,
        chapter: item.chapter,
        verse: item.verse,
        text: item.text
    }))
}
