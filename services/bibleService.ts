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

export type BibleVersion = {
    id: number
    slug: string
    name: string
    abbreviation: string | null
    language: string
    direction: 'ltr' | 'rtl'
    license: 'public_domain' | 'cc_by' | 'licensed'
    license_url: string | null
    /** Crédito exigido pela licença. CC BY só é cumprida se isto for exibido. */
    attribution: string | null
}

const CAMPOS_VERSAO =
    'id, slug, name, abbreviation, language, direction, license, license_url, attribution'

/**
 * Versões que este leitor pode abrir. A RLS de `bible_versions` já esconde
 * as desabilitadas, e a de `bible_verses` esconde o texto das licenciadas
 * sem concessão — então o que voltar daqui é o que pode ser lido.
 */
export const listVersions = cache(async () => {
    const supabase = getPublicClient()
    const { data } = await supabase
        .from('bible_versions')
        .select(CAMPOS_VERSAO)
        .order('sort_order')
    return (data ?? []) as unknown as BibleVersion[]
})

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

export const getChapter = cache(async (bookSlug: string, chapter: number, versionSlug?: string) => {
    const supabase = getPublicClient()

    // 1. Resolver a versão.
    //
    // Não existe mais padrão fixo no código. Antes era 'acf', que hoje está
    // catalogada como licensed e desabilitada — o leitor inteiro quebraria.
    // O padrão passa a ser a primeira versão habilitada por sort_order, que
    // é decisão do catálogo, não do código.
    const consulta = supabase.from('bible_versions').select(CAMPOS_VERSAO)

    const { data: version, error: vError } = versionSlug
        ? await consulta.eq('slug', versionSlug).maybeSingle()
        : await consulta.order('sort_order').limit(1).maybeSingle()

    if (vError || !version) {
        console.error("❌ Versão não encontrada:", vError)
        throw new Error(
            versionSlug
                ? `Versão "${versionSlug}" indisponível.`
                : 'Nenhuma versão da Bíblia habilitada. Rode `npm run seed:bible`.'
        )
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
        version: version as unknown as BibleVersion,
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