'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Verbete = {
    id: number
    term: string
    definition: string
    language_code: string
    source: 'manual' | 'ai_generated'
    status: 'draft' | 'published'
    created_by: string | null
    approved_by: string | null
    aliases: string[]
    sources: unknown[]
    created_at: string
}

type ResultadoDefinicao =
    | { success: true; data: Verbete; source: 'database' }
    | { success: false; error: string }

/**
 * Busca um verbete publicado — sem chamada a IA. O cache de IA de antes
 * desta mudança continua valendo (source = 'ai_generated', status =
 * 'published'); o que muda é que nada novo é gerado assim. Sem verbete,
 * quem chamou usa a Concordância (searchVersesByTerm) como alternativa —
 * essa distinção é decidida na UI, não aqui.
 *
 * Tipo de retorno explícito de propósito: sem ele, o TypeScript infere
 * `success` como `boolean` largo em vez do literal `true`/`false` de cada
 * `return`, e a união deixa de discriminar — `resultado.success ? resultado.data
 * : null` passava a achar `data` "possivelmente undefined" mesmo depois do
 * `if`.
 */
export async function getDefinition(term: string, language: string = 'pt-BR'): Promise<ResultadoDefinicao> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('dictionary_entries')
        .select('*')
        .ilike('term', term)
        .eq('language_code', language)
        .eq('status', 'published')
        .maybeSingle()

    if (error) {
        console.error('[getDefinition]', error)
        return { success: false, error: 'Não foi possível buscar o verbete.' }
    }
    if (!data) {
        return { success: false, error: 'Nenhuma definição encontrada.' }
    }
    return { success: true, data: data as Verbete, source: 'database' as const }
}

/** Rascunhos do próprio usuário e — se ele pastoreia alguma tribo — os de todo mundo, para revisar. */
export async function listarVerbetesPendentes(): Promise<Verbete[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('dictionary_entries')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[listarVerbetesPendentes]', error)
        return []
    }
    return (data ?? []) as Verbete[]
}

export async function proporVerbete(input: {
    term: string
    definition: string
    language?: string
    aliases?: string[]
    sources?: { titulo: string; url?: string }[]
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Faça login novamente.' }

    const term = input.term.trim()
    const definition = input.definition.trim()
    if (term.length < 2) return { success: false, message: 'Digite o termo.' }
    if (definition.length < 10) return { success: false, message: 'Escreva uma definição com ao menos 10 caracteres.' }

    const { data, error } = await supabase
        .from('dictionary_entries')
        .insert({
            term,
            definition,
            language_code: input.language ?? 'pt-BR',
            aliases: input.aliases ?? [],
            sources: input.sources ?? [],
            created_by: user.id,
        })
        .select('id')
        .single()

    if (error) {
        console.error('[proporVerbete]', error)
        // term é unique — colisão é o caso mais comum de erro aqui.
        const duplicado = error.code === '23505'
        return {
            success: false,
            message: duplicado ? 'Já existe um verbete com esse termo.' : 'Não foi possível propor o verbete.',
        }
    }

    revalidatePath('/wiki')
    return { success: true, message: 'Verbete proposto — aguardando aprovação da liderança.', id: data.id as number }
}

export async function aprovarVerbete(id: number) {
    const supabase = await createClient()
    const { error } = await supabase.rpc('aprovar_verbete', { entry_id: id })

    if (error) {
        console.error('[aprovarVerbete]', error)
        return { success: false, message: error.message ?? 'Não foi possível aprovar.' }
    }

    revalidatePath('/wiki')
    return { success: true, message: 'Verbete publicado.' }
}

export async function apagarRascunho(id: number) {
    const supabase = await createClient()
    const { error } = await supabase.from('dictionary_entries').delete().eq('id', id).eq('status', 'draft')

    if (error) {
        console.error('[apagarRascunho]', error)
        return { success: false, message: 'Não foi possível apagar.' }
    }

    revalidatePath('/wiki')
    return { success: true, message: 'Rascunho removido.' }
}

export async function listarVerbetesPublicados(): Promise<Verbete[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('dictionary_entries')
        .select('*')
        .eq('status', 'published')
        .order('term')

    if (error) {
        console.error('[listarVerbetesPublicados]', error)
        return []
    }
    return (data ?? []) as Verbete[]
}
