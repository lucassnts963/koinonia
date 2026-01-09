'use server'

import { createClient } from '@/lib/supabase/server'

export type GraphData = {
    nodes: Array<{ id: string, label: string, group: string, value?: number }>
    links: Array<{ source: string, target: string, type?: string }>
}

export async function getTeiaData(): Promise<GraphData> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { nodes: [], links: [] }

    // 1. Buscar Links do Sistema e Usuário
    const { data: linksData } = await supabase
        .from('knowledge_links')
        .select('source, target, type')

    // 2. Buscar Anotações do Usuário
    const { data: notesData } = await supabase
        .from('annotations')
        .select('id, book_slug, chapter, verse, content') // content pode ser usado pra tooltip?
        .eq('user_id', user.id)

    // Data Structures
    const nodesMap = new Map<string, { id: string, label: string, group: string, value?: number }>()
    const links: Array<{ source: string, target: string, type: string }> = []

    // ------ Processar Links (Source -> Target) ------
    linksData?.forEach(link => {
        // Validação defensiva essencial para evitar erros de renderização
        if (!link.source || !link.target) return;

        const source = String(link.source)
        const target = String(link.target)

        if (!nodesMap.has(source)) {
            nodesMap.set(source, { id: source, label: formatRef(source), group: 'bible', value: 1 })
        }
        if (!nodesMap.has(target)) {
            nodesMap.set(target, { id: target, label: formatRef(target), group: 'bible', value: 1 })
        }

        const node = nodesMap.get(source)
        if (node) node.value = (node.value || 1) + 0.5

        links.push({ source, target, type: link.type || 'rel' })
    })

    // ------ Processar Anotações (Versículo -> Nota) ------
    notesData?.forEach(note => {
        const verseRef = `${note.book_slug}-${note.chapter}-${note.verse}`
        const noteId = `note-${note.id}`

        if (!nodesMap.has(verseRef)) {
            nodesMap.set(verseRef, { id: verseRef, label: formatRef(verseRef), group: 'bible', value: 1 })
        } else {
            const v = nodesMap.get(verseRef)
            if (v) v.value = (v.value || 1) + 2
        }

        nodesMap.set(noteId, {
            id: noteId,
            label: "Nota",
            group: 'user_note',
            value: 3
        })

        links.push({ source: noteId, target: verseRef, type: 'annotation' })
    })

    return {
        nodes: Array.from(nodesMap.values()),
        links
    }
}

function formatRef(ref: string) {
    if (!ref) return "?"
    if (ref.startsWith('note-')) return "Nota"
    if (ref.startsWith('study-')) return "Estudo"

    const parts = ref.split('-')
    if (parts.length === 3) {
        return `${parts[0].toUpperCase()} ${parts[1]}:${parts[2]}`
    }
    // Formato slug-cap-ver (ex: gn-1-1)
    if (parts.length === 2) { // as vezes pode ser livro-cap
        return `${parts[0].toUpperCase()} ${parts[1]}`
    }

    return ref
}
