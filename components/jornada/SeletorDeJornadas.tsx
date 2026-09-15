'use client'

import { useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { definirJornadaEmFoco } from '@/actions/plans'
import { Target } from 'lucide-react'
import type { ActivePlan } from '@/actions/plans'

type Props = {
    jornadas: ActivePlan[]
    selecionadaId: string
    focoId: string | null
}

export default function SeletorDeJornadas({ jornadas, selecionadaId, focoId }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const [, iniciar] = useTransition()

    if (jornadas.length <= 1) return null

    const trocar = (planId: string) => {
        router.push(`${pathname}?jornada=${planId}`)
    }

    const marcarComoFoco = () => {
        iniciar(async () => {
            await definirJornadaEmFoco(selecionadaId)
        })
    }

    const emFoco = focoId === selecionadaId

    return (
        <div className="space-y-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
                {jornadas.map((j) => (
                    <button
                        key={j.plan_id}
                        type="button"
                        onClick={() => trocar(j.plan_id)}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                            j.plan_id === selecionadaId
                                ? 'bg-amber-600 text-white'
                                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                    >
                        {j.plan.title}
                        {focoId === j.plan_id && ' ★'}
                    </button>
                ))}
            </div>

            {!emFoco && (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    <span className="flex items-center gap-1.5">
                        <Target size={14} />
                        Manter o foco em uma jornada principal ajuda a criar Constância de verdade.
                    </span>
                    <button
                        type="button"
                        onClick={marcarComoFoco}
                        className="shrink-0 font-bold underline underline-offset-2 hover:no-underline"
                    >
                        Focar nesta
                    </button>
                </div>
            )}
        </div>
    )
}
