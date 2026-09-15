'use client'

import dynamic from 'next/dynamic'
import React, { useRef, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Tipo compatível com o que vem da Action nova (/actions/teia)
type GraphData = {
    nodes: Array<{ id: string, label: string, group: string, value?: number }>
    links: Array<{ source: string, target: string, type?: string }>
}

// Importação Dinâmica (Desabilita SSR para esta lib)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-stone-400"><Loader2 className="animate-spin mr-2" /> Carregando Constelação...</div>
})

/**
 * O que este componente lê de cada nó/ligação.
 *
 * O índice aberto e `id?: string | number` não são preguiça: é a forma que
 * a própria react-force-graph-2d declara, e um tipo mais estreito não
 * encaixa nos callbacks dela.
 */
type NoDoGrafo = {
    [outros: string]: unknown
    id?: string | number
    label?: string
    group?: string
    value?: number
    x?: number
    y?: number
}
type LigacaoDoGrafo = { type?: string }

// A instância expõe centerAt/zoom; só isso é usado aqui.
type MetodosDoGrafo = {
    centerAt: (x?: number, y?: number, ms?: number) => void
    zoom: (nivel?: number, ms?: number) => void
}

function assinarResize(aoMudar: () => void) {
    window.addEventListener('resize', aoMudar)
    return () => window.removeEventListener('resize', aoMudar)
}

export default function ForceGraphWrapper({ data }: { data: GraphData }) {
    const router = useRouter()
    const graphRef = useRef<MetodosDoGrafo | null>(null)
    // Medir o viewport com useEffect + setState causa uma renderização em
    // cascata a cada resize. useSyncExternalStore é a ferramenta certa: lê o
    // tamanho na hora da renderização e reassina o evento sozinho.
    //
    // O snapshot devolve string porque precisa ser estável por identidade —
    // devolver um objeto novo a cada chamada faria o React entrar em laço.
    const medida = useSyncExternalStore(
        assinarResize,
        () => `${window.innerWidth}x${window.innerHeight - 100}`,
        // No servidor não existe window; estes valores são só o primeiro
        // quadro, substituídos assim que hidrata.
        () => '800x600'
    )
    const [largura, altura] = medida.split('x').map(Number)
    const dimensions = { w: largura, h: altura }

    return (
        <div className="border border-stone-800 rounded-xl overflow-hidden shadow-2xl bg-stone-950">
            <ForceGraph2D
                ref={graphRef as never}
                width={dimensions.w > 800 ? 800 : dimensions.w - 40}
                height={500}
                graphData={data || { nodes: [], links: [] }} // Fallback seguro
                backgroundColor="#0c0a09"

                // --- Configuração Visual ---
                nodeLabel="label" // Importante: agora usamos 'label' e não 'name'
                nodeColor={(node: NoDoGrafo) => {
                    if (node.group === 'bible') return '#d97706' // Bible = Amber
                    if (node.group === 'user_note') return '#22c55e' // Note = Green
                    if (node.group === 'reference') return '#3b82f6' // Study/Ref = Blue
                    return '#a8a29e' // Fallback
                }}

                // --- Renderização Customizada do Nó ---
                nodeCanvasObject={(node: NoDoGrafo, ctx, globalScale) => {
                    const label = String(node.label ?? node.id ?? '')
                    const fontSize = 12 / globalScale
                    const isImportant = (node.value || 0) > 2

                    // A simulação só atribui x/y depois dos primeiros ticks;
                    // antes disso o canvas recebia NaN e não desenhava nada.
                    const x = node.x ?? 0
                    const y = node.y ?? 0

                    // Desenha o círculo
                    ctx.beginPath()
                    const radius = isImportant ? 6 : 4
                    ctx.arc(x, y, radius, 0, 2 * Math.PI, false)

                    // Cor baseada no grupo
                    ctx.fillStyle = node.group === 'bible' ? '#d97706'
                        : node.group === 'user_note' ? '#22c55e'
                            : '#78716c'
                    ctx.fill()

                    // Desenha Label (se zoom alto ou nó importante no centro)
                    if (globalScale > 1.2 || isImportant) {
                        ctx.font = `${fontSize}px Sans-Serif`
                        ctx.textAlign = 'center'
                        ctx.textBaseline = 'middle'
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                        ctx.fillText(label, x, y + radius + 4)
                    }
                }}

                // --- Links ---
                linkColor={() => 'rgba(255, 255, 255, 0.15)'}
                linkDirectionalParticles={(link) => (link as LigacaoDoGrafo).type === 'theology' ? 4 : 1}
                linkDirectionalParticleSpeed={0.005}
                linkWidth={1}

                // --- Interação ---
                onNodeClick={(node: NoDoGrafo) => {
                    if (!node.id) return;

                    // O id do grafo é sempre um slug nosso, mas o tipo da
                    // biblioteca admite número — normalizar aqui evita um
                    // `.split is not a function` se algum dia vier assim.
                    const id = String(node.id)

                    // 1. É Versículo? (gn-1-1)
                    if (node.group === 'bible') {
                        // Tenta parsear slug-cap-verse ou slug-cap
                        const parts = id.split('-')
                        if (parts.length >= 2) {
                            router.push(`/leitura/${parts[0]}/${parts[1]}`)
                        }
                    }

                    // 2. É Estudo? (study-UUID)
                    if (id.startsWith('study-')) {
                        const studyId = id.replace('study-', '')
                        router.push(`/estudos/novo?id=${studyId}`)
                    }

                    // 3. Zoom no clique (Opcional)
                    graphRef.current?.centerAt(node.x ?? 0, node.y ?? 0, 1000)
                    graphRef.current?.zoom(3, 2000)
                }}
            />
        </div>
    )
}