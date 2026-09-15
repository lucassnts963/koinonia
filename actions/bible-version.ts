'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Grava a versão da Bíblia preferida do usuário.
 *
 * `preferred_bible_version` está no grant de coluna de
 * 20260904140000 — é uma das poucas colunas de `profiles` que o cliente pode
 * escrever. Progressão (talents_balance, stature_level, constancy_streak)
 * continua fora do alcance, e é assim de propósito.
 */
export async function definirVersaoPreferida(slug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false }

    // Só aceita versão que existe e está habilitada; a RLS de
    // `bible_versions` já esconde as desabilitadas, então maybeSingle
    // devolvendo nada significa "não pode ler essa".
    const { data: versao } = await supabase
        .from('bible_versions')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle()

    if (!versao) return { success: false }

    const { error } = await supabase
        .from('profiles')
        .update({ preferred_bible_version: versao.slug })
        .eq('id', user.id)

    if (error) {
        console.error('[definirVersaoPreferida]', error)
        return { success: false }
    }

    // Sem revalidatePath: quem chama já navegou para ?v=<slug>, então a tela
    // correta está na frente do usuário. Revalidar aqui só geraria trabalho.
    return { success: true }
}

/** Versão preferida do usuário, se houver. */
export async function getVersaoPreferida(): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('profiles')
        .select('preferred_bible_version')
        .eq('id', user.id)
        .maybeSingle()

    return data?.preferred_bible_version ?? null
}
