'use client'

import React, { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Lock, Star } from 'lucide-react'
import Link from 'next/link'

// Componente Visual de Trilha Sinuosa (Cobrinha)
// Usa SVG Path para desenhar a linha e posiciona os nós matematicamente.

export default function MapTrail({
    days,
    activeDay,
    completedDays
}: {
    days: any[],
    activeDay: number,
    completedDays: Set<number>
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(300)

    useEffect(() => {
        if (containerRef.current) {
            setWidth(containerRef.current.offsetWidth)
        }
        const handleResize = () => {
            if (containerRef.current) setWidth(containerRef.current.offsetWidth)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Configuração da Grade
    const NODE_SPACING = 100 // Distância vertical entre nós
    const AMPLITUDE = width / 2.5 // Largura da curva (senoide)
    const CENTER_X = width / 2

    // Calcula posições
    const nodes = days.map((day, i) => {
        const y = i * NODE_SPACING + 50
        // Função seno para fazer o zig-zag suave
        const x = CENTER_X + Math.sin(i * 0.8) * (AMPLITUDE - 40)

        return { ...day, x, y }
    })

    const totalHeight = nodes.length * NODE_SPACING + 100

    // Cria o path SVG conectando os pontos
    const pathD = nodes.reduce((acc, node, i) => {
        if (i === 0) return `M ${node.x} ${node.y}`
        // Bézier Curve interpolation para suavizar
        const prev = nodes[i - 1]
        const cp1x = prev.x
        const cp1y = prev.y + NODE_SPACING / 2
        const cp2x = node.x
        const cp2y = node.y - NODE_SPACING / 2
        return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${node.x} ${node.y}`
    }, '')

    return (
        <div ref={containerRef} className="relative w-full max-w-md mx-auto" style={{ height: totalHeight }}>
            {/* SVG Background Line */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
                {/* Linha Fundo (Cinza) */}
                <path d={pathD} stroke="#e7e5e4" strokeWidth="8" fill="none" strokeLinecap="round" />

                {/* Linha Progresso (Amber) - Simplificado: Vai até o nó atual */}
                {/* Num cenário ideal, calcularíamos o length exato. Aqui vamos pintar colorido se o dia anterior for completo */}
            </svg>

            {/* Nodes Render */}
            {nodes.map((node) => {
                const isCompleted = completedDays.has(node.day_number)
                const isCurrent = node.day_number === activeDay
                const isLocked = !isCompleted && !isCurrent

                return (
                    <div
                        key={node.id}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10"
                        style={{ left: node.x, top: node.y }}
                    >
                        {/* Círculo do Nó */}
                        <Link
                            href={!isLocked ? `/leitura/${node.refs[0].book}/${node.refs[0].chapters[0]}?plan=${node.plan_id}&day=${node.day_number}` : '#'}
                            aria-disabled={isLocked}
                            className={`
                                w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300
                                ${isCompleted ? 'bg-amber-500 text-white scale-100' : ''}
                                ${isCurrent ? 'bg-white border-4 border-amber-500 text-amber-600 scale-125 animate-pulse z-20' : ''}
                                ${isLocked ? 'bg-stone-200 text-stone-400 scale-90' : ''}
                                hover:scale-110
                            `}
                        >
                            {isCompleted ? <CheckCircle2 size={28} /> : isCurrent ? <Star size={28} fill="currentColor" /> : <Lock size={20} />}
                        </Link>

                        {/* Etiqueta Flutuante (Tooltip) */}
                        <div className={`
                            mt-2 bg-white px-3 py-1 rounded-lg border shadow-sm text-xs font-bold whitespace-nowrap transition-opacity
                            ${isLocked ? 'opacity-0 group-hover:opacity-100 text-stone-400 border-stone-200' : 'text-stone-700 border-amber-200'}
                        `}>
                            Dia {node.day_number}
                        </div>

                        {isCurrent && (
                            <div className="absolute -bottom-8 bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce">
                                COMEÇAR
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
