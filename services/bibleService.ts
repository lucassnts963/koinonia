import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cache } from 'react'

// Definindo tipos para retorno
export type BibleBook = {
    id: number
    slug: string
    name: string
    testament: 'OT' | 'NT' | 'VT'
    order_index: number
}

export type BibleVerse = {
    id: number
    chapter: number
    verse: number
    text: string
}

// CRIA UM CLIENTE SIMPLES PARA LEITURA DE DADOS PÚBLICOS (Sem Cookies)
// Isso evita erros de contexto entre Servidor/Cliente
function getPublicClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export const getBooks = cache(async () => {
    const supabase = getPublicClient()

    const { data, error } = await supabase
        .from('bible_books')
        .select('*')
        .order('order_index')

    if (error) throw new Error(`Erro ao buscar livros: ${error.message}`)
    return data as BibleBook[]
})

export const getChapter = cache(async (bookSlug: string, chapter: number, versionSlug = 'acf') => {
    const supabase = getPublicClient()

    // 1. Pegar ID da versão
    const { data: version, error: vError } = await supabase
        .from('bible_versions')
        .select('id')
        .eq('slug', versionSlug)
        .single()

    if (vError || !version) {
        console.error("❌ Versão não encontrada:", vError)
        throw new Error('Versão da Bíblia não encontrada')
    }

    // 2. Pegar dados do Livro
    // Usamos .ilike em vez de .eq para ignorar maiúsculas/minúsculas (Gn vs gn)
    const { data: book, error: bError } = await supabase
        .from('bible_books')
        .select('*')
        .ilike('slug', bookSlug)
        .single()

    if (bError || !book) {
        console.error(`❌ Livro não encontrado (${bookSlug}):`, bError)
        throw new Error('Livro não encontrado')
    }

    // 3. Pegar Versículos
    const { data: verses, error: verseError } = await supabase
        .from('bible_verses')
        .select('id, chapter, verse, text')
        .eq('version_id', version.id)
        .eq('book_id', book.id)
        .eq('chapter', chapter)
        .order('verse')

    if (verseError) throw verseError

    const nextChapter = await getNextNav(supabase, book, chapter)
    const prevChapter = await getPrevNav(supabase, book, chapter)

    return {
        book,
        chapter,
        verses: verses as BibleVerse[],
        next: nextChapter,
        prev: prevChapter
    }
})

// Helpers de Navegação (Precisam receber o client agora)
async function getNextNav(supabase: any, book: BibleBook, currentChapter: number) {
    const { count } = await supabase
        .from('bible_verses')
        .select('id', { count: 'exact', head: true })
        .eq('book_id', book.id)
        .eq('chapter', currentChapter + 1)

    if (count && count > 0) {
        return { bookSlug: book.slug, chapter: currentChapter + 1 }
    }

    const { data: nextBook } = await supabase
        .from('bible_books')
        .select('slug')
        .eq('order_index', book.order_index + 1)
        .single()

    if (nextBook) {
        return { bookSlug: nextBook.slug, chapter: 1 }
    }

    return null
}

async function getPrevNav(supabase: any, book: BibleBook, currentChapter: number) {
    if (currentChapter > 1) {
        return { bookSlug: book.slug, chapter: currentChapter - 1 }
    }

    const { data: prevBook } = await supabase
        .from('bible_books')
        .select('id, slug')
        .eq('order_index', book.order_index - 1)
        .single()

    if (prevBook) {
        const { data: lastChap } = await supabase
            .from('bible_verses')
            .select('chapter')
            .eq('book_id', prevBook.id)
            .order('chapter', { ascending: false })
            .limit(1)
            .single()

        return { bookSlug: prevBook.slug, chapter: lastChap?.chapter || 1 }
    }

    return null
}