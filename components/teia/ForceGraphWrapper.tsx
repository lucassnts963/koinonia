'use client'

import dynamic from 'next/dynamic'
import React, { useCallback, useRef, useState, useEffect } from 'react'
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

export default function ForceGraphWrapper({ data }: { data: GraphData }) {
    const router = useRouter()
    const graphRef = useRef<any>(null)
    const [dimensions, setDimensions] = useState({ w: 800, h: 600 })

    // Ajusta tamanho da tela
    useEffect(() => {
        setDimensions({
            w: window.innerWidth,
            h: window.innerHeight - 100 // Desconta header/nav
        })

        const handleResize = () => {
            setDimensions({
                w: window.innerWidth,
                h: window.innerHeight - 100
            })
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <div className="border border-stone-800 rounded-xl overflow-hidden shadow-2xl bg-stone-950">
            <ForceGraph2D
                ref={graphRef}
                width={dimensions.w > 800 ? 800 : dimensions.w - 40}
                height={500}
                graphData={data || { nodes: [], links: [] }} // Fallback seguro
                backgroundColor="#0c0a09"

                // --- Configuração Visual ---
                nodeLabel="label" // Importante: agora usamos 'label' e não 'name'
                nodeColor={(node: any) => {
                    if (node.group === 'bible') return '#d97706' // Bible = Amber
                    if (node.group === 'user_note') return '#22c55e' // Note = Green
                    if (node.group === 'reference') return '#3b82f6' // Study/Ref = Blue
                    return '#a8a29e' // Fallback
                }}

                // --- Renderização Customizada do Nó ---
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.label || node.id
                    const fontSize = 12 / globalScale
                    const isImportant = (node.value || 0) > 2

                    // Desenha o círculo
                    ctx.beginPath()
                    const radius = isImportant ? 6 : 4
                    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false)

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
                        ctx.fillText(label, node.x, node.y + radius + 4)
                    }
                }}

                // --- Links ---
                linkColor={() => 'rgba(255, 255, 255, 0.15)'}
                linkDirectionalParticles={node => (node as any).type === 'theology' ? 4 : 1}
                linkDirectionalParticleSpeed={0.005}
                linkWidth={1}

                // --- Interação ---
                onNodeClick={(node: any) => {
                    if (!node.id) return;

                    // 1. É Versículo? (gn-1-1)
                    if (node.group === 'bible') {
                        // Tenta parsear slug-cap-verse ou slug-cap
                        const parts = node.id.split('-')
                        if (parts.length >= 2) {
                            router.push(`/leitura/${parts[0]}/${parts[1]}`)
                        }
                    }

                    // 2. É Estudo? (study-UUID)
                    if (node.id.startsWith('study-')) {
                        const studyId = node.id.replace('study-', '')
                        router.push(`/estudos/novo?id=${studyId}`)
                    }

                    // 3. Zoom no clique (Opcional)
                    graphRef.current?.centerAt(node.x, node.y, 1000)
                    graphRef.current?.zoom(3, 2000)
                }}
            />
        </div>
    )
}