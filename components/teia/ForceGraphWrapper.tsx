'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, useRef } from 'react'
import { GraphData } from '@/actions/graph'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

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
                width={dimensions.w > 800 ? 800 : dimensions.w - 40} // Limita largura no desktop
                height={500}
                graphData={data}
                backgroundColor="#0c0a09" // stone-950

                // Estilização dos Nós
                nodeLabel="name"
                nodeColor={(node: any) => {
                    if (node.group === 'OT') return '#d97706' // Amber-600 (VT)
                    if (node.group === 'NT') return '#3b82f6' // Blue-500 (NT)
                    return '#a8a29e' // Stone-400 (Conceitos)
                }}

                // Desenho customizado (Texto aparece se der zoom ou for importante)
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.name
                    const fontSize = 12 / globalScale
                    const radius = 4 // Tamanho da bolinha

                    // Desenha a bolinha
                    ctx.beginPath()
                    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false)
                    ctx.fillStyle = node.group === 'OT' ? '#d97706' : node.group === 'NT' ? '#3b82f6' : '#78716c'
                    ctx.fill()

                    // Desenha o texto (Sombra + Cor)
                    ctx.font = `${fontSize}px Sans-Serif`
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
                    // Só desenha texto se tiver zoom suficiente ou for nó principal
                    if (globalScale > 1.5 || node.val > 6) {
                        ctx.fillText(label, node.x, node.y + 8)
                    }
                }}

                // Física das conexões
                linkColor={() => 'rgba(255, 255, 255, 0.1)'}
                linkDirectionalParticles={2} // Partículas viajam na linha
                linkDirectionalParticleSpeed={0.005}

                // Ao clicar no nó
                onNodeClick={(node: any) => {
                    // Se for versículo (ex: gn-1-1), navega
                    if (node.id.includes('-')) {
                        const [book, chap, verse] = node.id.split('-')
                        if (book && chap) {
                            router.push(`/app/leitura/${book}/${chap}`)
                        }
                    }
                }}
            />
        </div>
    )
}