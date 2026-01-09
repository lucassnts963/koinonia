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

        if (newStudy) studyId = newStudy.id
    }

    // --- AUTO-LINKING: Extrair referências do texto e criar conexões na Teia ---
    if (studyId && content) {
        // Regex para encontrar **Gn 1:1** inserido pela sidebar
        const regex = /\*\*([1-3]?[A-Za-zÀ-ÿ]+ \d+:\d+)\*\*/g
        const matches = [...content.matchAll(regex)]

        if (matches.length > 0) {
            const links = matches.map(match => ({
                user_id: user.id,
                source: `study-${studyId}`, // Nó de origem: O Estudo
                target: match[1].replace(/ /g, '-').toLowerCase(), // Nó de destino: O Versículo (gn-1:1) -> normalizado
                type: 'reference'
            }))

            // Upsert links (ignora duplicatas se tiver constraint, ou insert normal)
            // Como não temos constraint unique em (source, target), vamos inserir.
            // O ideal seria limpar links antigos desse estudo antes, mas para MVP ok.
            await supabase.from('knowledge_links').insert(links)
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
