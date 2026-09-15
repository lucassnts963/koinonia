'use server'

import { createClient } from '@/lib/supabase/server'
import { getDefinition } from '@/actions/dictionary'

/**
 * Ferramentas do agente — todas de LEITURA, nada mais.
 *
 * Isto não é um detalhe de implementação: é a regra. O agente não tem, e
 * nunca deve ganhar, uma ferramenta de escrita — nem para salvar uma nota,
 * nem para publicar um verbete, nem para criar um estudo. Se um dia alguém
 * for adicionar uma "ferramenta nova" aqui, a primeira pergunta é "isto
 * escreve alguma coisa?" — se a resposta for sim, não entra.
 *
 * Cada função usa createClient() (o client de cookies do usuário logado),
 * nunca supabaseAdmin/service_role — a RLS de cada tabela decide o que o
 * agente enxerga, exatamente como decidiria para a própria pessoa clicando
 * na tela. Isso é o que impede o agente de vazar estudo ou nota de outro
 * usuário, ou conteúdo de uma tribo alheia: a mesma trava que já protege a
 * UI protege a ferramenta.
 */

export type ResultadoFerramenta = {
    fonte: string
    dados: unknown
}

export async function buscarVersiculo(bookSlug: string, chapter: number, verse?: number, versionSlug?: string): Promise<ResultadoFerramenta> {
    const supabase = await createClient()

    const consultaVersao = supabase.from('bible_versions').select('id')
    const { data: versao } = versionSlug
        ? await consultaVersao.eq('slug', versionSlug).maybeSingle()
        : await consultaVersao.order('sort_order').limit(1).maybeSingle()

    if (!versao) return { fonte: 'versiculo', dados: null }

    const { data: livro } = await supabase.from('bible_books').select('id, name').ilike('slug', bookSlug).maybeSingle()
    if (!livro) return { fonte: 'versiculo', dados: null }

    let consulta = supabase
        .from('bible_verses')
        .select('verse, text')
        .eq('version_id', versao.id)
        .eq('book_id', livro.id)
        .eq('chapter', chapter)
        .order('verse')

    if (verse) consulta = consulta.eq('verse', verse)

    const { data } = await consulta.limit(30)
    return { fonte: 'versiculo', dados: { livro: livro.name, capitulo: chapter, versos: data ?? [] } }
}

export async function buscarVerbete(termo: string): Promise<ResultadoFerramenta> {
    const resultado = await getDefinition(termo)
    return {
        fonte: 'verbete',
        dados: resultado.success ? { termo: resultado.data.term, definicao: resultado.data.definition } : null,
    }
}

export async function buscarMeusEstudos(query?: string): Promise<ResultadoFerramenta> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { fonte: 'meus_estudos', dados: [] }

    let consulta = supabase
        .from('studies')
        .select('id, title, content, created_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10)

    if (query?.trim()) consulta = consulta.ilike('title', `%${query.trim()}%`)

    const { data } = await consulta
    return { fonte: 'meus_estudos', dados: data ?? [] }
}

export async function buscarMinhasNotas(query?: string): Promise<ResultadoFerramenta> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { fonte: 'minhas_notas', dados: [] }

    let consulta = supabase
        .from('annotations')
        .select('book_slug, chapter, verse, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

    if (query?.trim()) consulta = consulta.ilike('content', `%${query.trim()}%`)

    const { data } = await consulta
    return { fonte: 'minhas_notas', dados: data ?? [] }
}

export async function buscarAcervo(query?: string): Promise<ResultadoFerramenta> {
    const supabase = await createClient()

    let consulta = supabase
        .from('discussions')
        .select('id, title, body, created_at')
        .is('tribe_id', null)
        .eq('anchor_type', 'study')
        .is('deleted_at', null)
        .order('last_activity_at', { ascending: false })
        .limit(10)

    if (query?.trim()) consulta = consulta.ilike('title', `%${query.trim()}%`)

    const { data } = await consulta
    return { fonte: 'acervo', dados: data ?? [] }
}
