import { getUserActivePlan, getAvailablePlans, getPlanDays, startPlan } from '@/actions/plans'
import MapTrail from '@/components/jornada/MapTrail'
import { Map, Flag } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export default async function JornadaPage() {
    // 1. Verificar se usuário tem plano ativo
    const activePlan = await getUserActivePlan()

    // --- CASE A: Usuário SEM Plano Ativo (Seleção) ---
    if (!activePlan) {
        const availableParams = await getAvailablePlans()

        async function handleStart(formData: FormData) {
            'use server'
            const planId = formData.get('planId') as string
            if (planId) await startPlan(planId)
        }

        return (
            <div className="space-y-6 pb-20">
                <header>
                    <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
                        <Map className="text-amber-600" />
                        Escolha sua Jornada
                    </h1>
                    <p className="text-stone-500 text-sm">Selecione um plano de leitura para começar.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableParams.map(plan => (
                        <div key={plan.id} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:border-amber-400 transition-all">
                            <h3 className="text-xl font-bold text-stone-800 mb-2">{plan.title}</h3>
                            <p className="text-stone-600 text-sm mb-4 h-10">{plan.description}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-xs bg-stone-100 px-2 py-1 rounded text-stone-500">
                                    {plan.days_count} Dias
                                </span>
                                <form action={handleStart}>
                                    <input type="hidden" name="planId" value={plan.id} />
                                    <button className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-700">
                                        Começar
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))}

                    {availableParams.length === 0 && (
                        <p className="text-stone-500">Nenhum plano disponível no momento.</p>
                    )}
                </div>
            </div>
        )
    }

    // --- CASE B: Usuário COM Plano Ativo (Mapa) ---
    const days = await getPlanDays(activePlan.plan.id)
    const completedSet = new Set(activePlan.completed_days || [])

    return (
        <div className="space-y-6 pb-20 relative min-h-screen">
            <header className="flex justify-between items-end sticky top-0 bg-stone-50/95 backdrop-blur z-30 py-4 border-b border-stone-200">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
                        <Flag className="text-amber-600" />
                        {activePlan.plan.title}
                    </h1>
                    <p className="text-stone-500 text-sm line-clamp-1">{activePlan.plan.description}</p>
                </div>
                <div className="text-right pl-4">
                    <span className="text-[10px] font-bold uppercase text-stone-400">Dia Atual</span>
                    <p className="text-3xl font-bold text-amber-600 leading-none">{activePlan.current_day}</p>
                </div>
            </header>

            {/* Trilha Sinuosa SVG */}
            <div className="py-8">
                <MapTrail
                    days={days}
                    activeDay={activePlan.current_day}
                    completedDays={completedSet}
                />
            </div>

            <div className="text-center text-xs text-stone-400 pb-10">
                Continue caminhando...
            </div>
        </div>
    )
}
