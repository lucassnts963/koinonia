'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function searchBible(query: string) {
    const supabase = await createClient()

    // Usando textSearch para busca correta com tsvector
    const { data, error } = await supabase
        .from('bible_verses')
        .select('id, verse, text, chapter, bible_books(slug, name)')
        .textSearch('fts', query, { config: 'portuguese', type: 'websearch' })
        .limit(10)

    if (error) {
        console.error(error)
        return []
    }
    return data
}

// --- READ ---
export async function getStudy(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('studies')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id) // Security: only own studies
        .single()

    return data
}

export async function saveStudy(id: string | null, title: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    let studyId = id

    if (id) {
        // Update
        await supabase
            .from('studies')
            .update({ title, content, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)
    } else {
        // Insert
        const { data: newStudy, error } = await supabase
            .from('studies')
            .insert({ user_id: user.id, title, content })
            .select()
            .single()

        // O erro era descartado: o estudo não era criado e mesmo assim a
        // função respondia sucesso, então o usuário perdia o que escreveu
        // sem saber.
        if (error || !newStudy) {
            console.error('[saveStudy]', error)
            return { success: false, message: 'Não foi possível salvar o estudo.' }
        }

        studyId = newStudy.id
    }

    // --- AUTO-LINKING: Extrair referências do texto e criar conexões na Teia ---
    if (studyId) {
        // Regex para encontrar **Gn 1:1** inserido pela sidebar
        const regex = /\*\*([1-3]?[A-Za-zÀ-ÿ]+ \d+:\d+)\*\*/g
        const source = `study-${studyId}`

        // O mesmo versículo pode ser citado várias vezes no estudo; o Set
        // evita colidir com o índice único de knowledge_links.
        const targets = new Set(
            [...(content ?? '').matchAll(regex)].map(m => m[1].replace(/ /g, '-').toLowerCase())
        )

        // Apagar e regravar, sempre — inclusive quando não sobrou nenhuma
        // referência. Os links deste estudo são derivados do texto, então a
        // fonte da verdade é o conteúdo atual: reinserir sem limpar
        // duplicava o grafo a cada save, e limpar só quando há referências
        // deixaria links órfãos de trechos que o autor apagou.
        await supabase
            .from('knowledge_links')
            .delete()
            .eq('user_id', user.id)
            .eq('source', source)

        if (targets.size > 0) {
            await supabase.from('knowledge_links').insert(
                [...targets].map(target => ({
                    user_id: user.id,
                    source,
                    target,
                    type: 'reference',
                }))
            )
        }
    }

    revalidatePath('/estudos')
    return { success: true }
}

export async function deleteStudy(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase
        .from('studies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { success: false }

    revalidatePath('/estudos')
    return { success: true }
}

export async function createConnection(sourceRef: string, targetRef: string, type: 'user_note' | 'parallel' = 'user_note') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Inserir na tabela knowledge_links
    // O sistema espera source e target como slugs ou IDs.
    // Vamos assumir que o frontend passa algo como "gn-1-1"
    const { error } = await supabase
        .from('knowledge_links')
        .insert({
            source: sourceRef,
            target: targetRef,
            type: type,
            user_id: user.id
        })

    return { success: !error }
}
