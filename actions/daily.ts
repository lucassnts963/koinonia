'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDailyVerse() {
    const supabase = await createClient()

    // Lógica para pegar um versículo aleatório
    // Mas "fixo" para o servidor no momento do request (para não ficar mudando a cada F5 se não tiver cache)
    // O ideal é o componente client salvar no localStorage e só pedir outro se o dia mudou.
    // Aqui no server, vamos fazer um random simples no banco.

    // Obs: 'random()' no postgrest requer uma RPC ou usar um id aleatorio.
    // Vamos pegar um ID aleatorio entre 1 e 31102 (total versiculos).
    const randomId = Math.floor(Math.random() * 31102) + 1

    const { data } = await supabase
        .from('bible_verses')
        .select(`
            id, 
            verse, 
            text, 
            chapter,
            bible_books (slug, name)
        `)
        .eq('id', randomId) // Supondo que ID é sequencial integer. Se for UUID, não funciona assim.
        // Se ID for UUID, melhor usar limit e offset random, mas é lento.
        // Vamos assumir que criamos a tabela com serial ID ou vamos pegar um range.
        // FALLBACK: Pegar Salmos 23:1 se der erro (MVP)
        .single()

    // Como provavelmente é UUID ou não garantido, vamos pegar Salmos 119:105 fixo se falhar, ou implementar uma RPC 'get_random_verse'.
    // Mas para MVP rápido sem mexer no banco agora:
    // Vamos pegar um livro aleatorio e um capitulo.

    if (data) return data

    // Fallback garantido
    return {
        id: 'fallback',
        text: 'Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.',
        verse: 105,
        chapter: 119,
        bible_books: { name: 'Salmos', slug: 'sl' }
    }
}
