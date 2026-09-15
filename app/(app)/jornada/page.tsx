import Link from 'next/link'
import { getUserActivePlans, getAvailablePlans, getPlanDays, getJornadaEmFoco } from '@/actions/plans'
import { souLideranca } from '@/actions/moderation'
import { getBooks } from '@/services/bibleService'
import MapTrail from '@/components/jornada/MapTrail'
import SeletorDeJornadas from '@/components/jornada/SeletorDeJornadas'
import EscolherJornada from '@/components/jornada/EscolherJornada'
import { Map, Flag, Compass } from 'lucide-react'

export const dynamic = 'force-dynamic'

type PageProps = {
    searchParams: Promise<{ jornada?: string }>
}

export default async function JornadaPage({ searchParams }: PageProps) {
    const { jornada: jornadaParam } = await searchParams
    const [activePlans, focoId, livros, pastoreia] = await Promise.all([
        getUserActivePlans(),
        getJornadaEmFoco(),
        getBooks(),
        souLideranca(),
    ])

    // --- CASO A: sem nenhuma jornada ativa ---
    if (activePlans.length === 0) {
        const disponiveis = await getAvailablePlans()

        return (
            <div className="space-y-6 pb-20">
                <header className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
                            <Map className="text-amber-600" />
                            Escolha sua Jornada
                        </h1>
                        <p className="text-stone-500 text-sm">Selecione um plano de leitura para começar, ou crie o seu.</p>
                    </div>
                    {pastoreia && <LinkGerenciar />}
                </header>

                <EscolherJornada disponiveis={disponiveis} livros={livros} />
            </div>
        )
    }

    // --- CASO B: uma ou mais jornadas ativas ---
    // Prioridade de qual mostrar: a pedida na URL > a marcada como foco > a mais recente.
    const selecionada =
        activePlans.find((p) => p.plan_id === jornadaParam) ??
        activePlans.find((p) => p.plan_id === focoId) ??
        activePlans[0]

    const [days, disponiveis] = await Promise.all([
        getPlanDays(selecionada.plan_id),
        getAvailablePlans(),
    ])
    const completedSet = new Set(selecionada.completed_days || [])

    return (
        <div className="space-y-6 pb-20 relative min-h-screen">
            <header className="space-y-3 sticky top-0 bg-stone-50/95 backdrop-blur z-30 py-4 border-b border-stone-200">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
                            <Flag className="text-amber-600" />
                            {selecionada.plan.title}
                        </h1>
                        <p className="text-stone-500 text-sm line-clamp-1">{selecionada.plan.description}</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="text-right">
                            <span className="text-[10px] font-bold uppercase text-stone-400">Dia Atual</span>
                            <p className="text-3xl font-bold text-amber-600 leading-none">{selecionada.current_day}</p>
                        </div>
                        {pastoreia && <LinkGerenciar />}
                    </div>
                </div>

                <SeletorDeJornadas jornadas={activePlans} selecionadaId={selecionada.plan_id} focoId={focoId} />
            </header>

            <div className="py-8">
                <MapTrail
                    days={days}
                    activeDay={selecionada.current_day}
                    completedDays={completedSet}
                />
            </div>

            {disponiveis.length > 0 && (
                <details className="rounded-xl border border-stone-200 bg-white">
                    <summary className="cursor-pointer px-4 py-3 font-bold text-sm text-stone-600">
                        + Começar outra jornada
                    </summary>
                    <div className="p-4 pt-0">
                        <EscolherJornada disponiveis={disponiveis} livros={livros} />
                    </div>
                </details>
            )}

            <div className="text-center text-xs text-stone-400 pb-10">
                Continue caminhando...
            </div>
        </div>
    )
}

function LinkGerenciar() {
    return (
        <Link
            href="/jornada/gerenciar"
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-600 hover:border-amber-400 whitespace-nowrap"
        >
            <Compass size={14} className="text-amber-600" />
            Gerenciar Tribo
        </Link>
    )
}
