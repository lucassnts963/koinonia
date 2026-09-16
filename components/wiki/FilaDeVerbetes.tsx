'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { aprovarVerbete, apagarRascunho, type Verbete } from '@/actions/dictionary'
import { Check, Trash2 } from 'lucide-react'

export default function FilaDeVerbetes({ pendentes }: { pendentes: Verbete[] }) {
    const [pendenteId, setPendenteId] = useState<number | null>(null)
    const [, iniciar] = useTransition()
    const router = useRouter()

    const aprovar = (id: number) => {
        setPendenteId(id)
        iniciar(async () => {
            await aprovarVerbete(id)
            router.refresh()
            setPendenteId(null)
        })
    }

    const apagar = (id: number) => {
        setPendenteId(id)
        iniciar(async () => {
            await apagarRascunho(id)
            router.refresh()
            setPendenteId(null)
        })
    }

    if (pendentes.length === 0) {
        return <p className="text-sm text-stone-500">Nenhum verbete pendente.</p>
    }

    return (
        <div className="space-y-3">
            {pendentes.map((v) => (
                <div key={v.id} className="rounded-xl border border-stone-200 bg-white p-4 space-y-2">
                    <h3 className="font-bold text-stone-800">{v.term}</h3>
                    {/* A liderança precisa ver como vai ficar publicado antes de
                        aprovar, não o texto cru com ** e # sobrando na tela. */}
                    <div className="prose prose-sm prose-amber prose-p:my-1 prose-headings:my-1 max-w-none text-stone-600">
                        <ReactMarkdown>{v.definition}</ReactMarkdown>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => apagar(v.id)}
                            disabled={pendenteId === v.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
                        >
                            <Trash2 size={14} /> Rejeitar
                        </button>
                        <button
                            type="button"
                            onClick={() => aprovar(v.id)}
                            disabled={pendenteId === v.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40"
                        >
                            <Check size={14} /> Aprovar
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
