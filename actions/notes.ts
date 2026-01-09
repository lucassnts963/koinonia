'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Note = {
    id: string
    verse: number
    content: string
    created_at: string
}

export async function saveNote(bookSlug: string, chapter: number, verse: number, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Upsert (Insere ou Atualiza)
    // Precisaria de um ID para update perfeito, mas aqui vamos tentar inserir novo sempre 
    // ou buscar se já existe. Para simplificar MVP: insert e se quiser editar, deleta e cria outro, 
    // OU tratamos a lógica de edição no front enviando ID.
    // Vamos fazer o Insert simples.

    const { error } = await supabase
        .from('annotations')
        .insert({
            user_id: user.id,
            book_slug: bookSlug,
            chapter,
            verse,
            content
        })

    if (error) {
        console.error("Erro ao salvar nota:", error)
        return { success: false }
    }

    revalidatePath(`/leitura/${bookSlug}/${chapter}`)
    return { success: true }
}

export async function getNotes(bookSlug: string, chapter: number): Promise<Note[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('annotations')
        .select('id, verse, content, created_at')
        .eq('user_id', user.id)
        .eq('book_slug', bookSlug)
        .eq('chapter', chapter)
        .order('verse')

    return data as Note[] || []
}
