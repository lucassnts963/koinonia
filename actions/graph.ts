'use server'

import { createClient } from '@/lib/supabase/server'

export type GraphNode = {
    id: string
    name: string
    group: 'VT' | 'NT' | 'Concept'
    val: number // Tamanho do nó
}

export type GraphLink = {
    source: string
    target: string
    type: string
}

export type GraphData = {
    nodes: GraphNode[]
    links: GraphLink[]
}

export async function getKnowledgeGraph(): Promise<GraphData> {
    const supabase = await createClient()

    // 1. Tentar buscar dados reais do banco
    const { data: realLinks } = await supabase
        .from('knowledge_links')
        .select('*')
        .limit(100)

    // SE TIVER DADOS REAIS, PROCESSAR AQUI...
    // (Por enquanto, vamos pular para o Mock para garantir que você veja algo na tela)

    // 2. DADOS SIMULADOS (MOCK) - As grandes conexões da Bíblia
    // Isso garante que sua Teia não fique vazia enquanto não populamos o banco
    const mockNodes: GraphNode[] = [
        { id: 'gn-1-1', name: 'Gênesis 1:1', group: 'VT', val: 5 },
        { id: 'jn-1-1', name: 'João 1:1', group: 'NT', val: 5 },
        { id: 'is-53', name: 'Isaías 53', group: 'VT', val: 4 },
        { id: 'mt-27', name: 'Mateus 27', group: 'NT', val: 4 },
        { id: 'ex-12', name: 'Páscoa (Êxodo)', group: 'VT', val: 3 },
        { id: '1co-5-7', name: 'Cristo, Nossa Páscoa', group: 'NT', val: 3 },
        { id: 'creation', name: 'Criação', group: 'Concept', val: 8 },
        { id: 'redemption', name: 'Redenção', group: 'Concept', val: 8 },
        { id: 'ap-21', name: 'Novos Céus', group: 'NT', val: 5 },
    ]

    const mockLinks: GraphLink[] = [
        { source: 'gn-1-1', target: 'creation', type: 'theme' },
        { source: 'jn-1-1', target: 'creation', type: 'theme' },
        { source: 'gn-1-1', target: 'jn-1-1', type: 'parallel' }, // No princípio...
        { source: 'is-53', target: 'redemption', type: 'prophecy' },
        { source: 'mt-27', target: 'redemption', type: 'fulfillment' },
        { source: 'is-53', target: 'mt-27', type: 'fulfillment' }, // Profecia cumprida
        { source: 'ex-12', target: '1co-5-7', type: 'typology' }, // Cordeiro Pascal
        { source: 'gn-1-1', target: 'ap-21', type: 'completion' }, // Alfa e Omega
    ]

    return { nodes: mockNodes, links: mockLinks }
}