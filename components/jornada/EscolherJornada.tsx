'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { startPlan } from '@/actions/plans'
import CriarJornadaForm from './CriarJornadaForm'
import type { Plan } from '@/actions/plans'
import type { BibleBook } from '@/services/bibleService'
import { Plus } from 'lucide-react'

type Props = {
    disponiveis: Plan[]
    livros: BibleBook[]
}

export default function EscolherJornada({ disponiveis, livros }: Props) {
    const [criando, setCriando] = useState(false)
    const [pendenteId, setPendenteId] = useState<string | null>(null)
    const [, iniciar] = useTransition()
    const router = useRouter()

    const comecar = (planId: string) => {
        setPendenteId(planId)
        iniciar(async () => {
            await startPlan(planId)
            router.refresh()
            setPendenteId(null)
        })
    }

    if (criando) {
        return (
            <CriarJornadaForm
                livros={livros}
                iniciarAoCriar
                aoCriar={() => setCriando(false)}
                aoCancelar={() => setCriando(false)}
            />
        )
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {disponiveis.map((plan) => (
                    <div key={plan.id} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:border-amber-400 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-stone-800">{plan.title}</h3>
                            {!plan.is_system && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                                    {plan.tribe_id ? 'DA TRIBO' : 'PESSOAL'}
                                </span>
                            )}
                        </div>
                        <p className="text-stone-600 text-sm mb-4 h-10 line-clamp-2">{plan.description}</p>
                        <div className="flex justify-between items-center">
                            <span className="text-xs bg-stone-100 px-2 py-1 rounded text-stone-500">
                                {plan.days_count} Dias
                            </span>
                            <button
                                type="button"
                                onClick={() => comecar(plan.id)}
                                disabled={pendenteId === plan.id}
                                className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-700 disabled:opacity-50"
                            >
                                {pendenteId === plan.id ? 'Começando...' : 'Começar'}
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={() => setCriando(true)}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 p-6 text-stone-400 hover:border-amber-400 hover:text-amber-600 transition-colors min-h-[140px]"
                >
                    <Plus size={24} />
                    <span className="text-sm font-bold">Criar minha própria jornada</span>
                </button>
            </div>
        </div>
    )
}
