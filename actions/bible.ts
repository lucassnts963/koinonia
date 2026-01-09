'use server'

import { createClient } from '@/lib/supabase/server'

export type SearchResult = {
    book_slug: string
    book_name: string
    chapter: number
    verse: number
    text: string
}

export async function searchVersesByTerm(term: string): Promise<SearchResult[]> {
    const supabase = await createClient()

    // Usando Full Text Search do Postgres (se configurado) ou ilike simples
    // Como criamos a coluna 'fts', vamos tentar usar.
    // Mas para garantir compatibilidade com termos parciais, vamos de ilike por enquanto no MVP

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
        .ilike('text', `%${term}%`)
        .limit(20) // Limita a 20 resultados para não poluir

    if (error) {
        console.error(error)
        return []
    }

    // Flatten data
    return data.map((item: any) => ({
        book_slug: item.bible_books.slug,
        book_name: item.bible_books.name,
        chapter: item.chapter,
        verse: item.verse,
        text: item.text
    }))
}
