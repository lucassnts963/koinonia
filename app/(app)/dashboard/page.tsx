import { createClient } from '@/lib/supabase/server'
import { getSafeUser } from '@/lib/supabase/auth'
import DailyMana from '@/components/dashboard/DailyMana'
import { getReadingStats } from '@/actions/stats'
import { Trophy, Flame, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const user = await getSafeUser(supabase)

    if (!user) return <div>Carregando...</div> // Fallback, middleware deve barrar

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const stats = await getReadingStats()

    return (
        <div className="space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-serif font-bold text-stone-800">
                    Paz, {profile?.full_name?.split(' ')[0] || 'Peregrino'}
                </h1>
                <p className="text-stone-500 text-sm mt-1">
                    Continue sua jornada rumo à estatura de Cristo.
                </p>
            </header>

            {/* Stats Cards */}
            <section className="grid grid-cols-2 gap-3">
                <div className="bg-amber-100 p-4 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2 mb-1 text-amber-800">
                        <Flame size={18} />
                        <span className="text-xs font-bold uppercase">Constância</span>
                    </div>
                    <p className="text-2xl font-bold text-stone-800">
                        {profile?.current_streak || 0} <span className="text-sm font-normal text-stone-500">dias</span>
                    </p>
                </div>
                <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-2 mb-1 text-stone-600">
                        <Trophy size={18} />
                        <span className="text-xs font-bold uppercase">Talentos</span>
                    </div>
                    <p className="text-2xl font-bold text-stone-800">
                        {profile?.talents_balance || 0}
                    </p>
                </div>
            </section>

            {/* Maná do Dia (Client Component) */}
            <section>
                <DailyMana />
            </section>

            {/* Progresso de Leitura */}
            <section>
                <div className="flex items-center gap-4 mb-4">
                    <h2 className="font-serif font-bold text-xl text-stone-700">Progresso da Jornada</h2>
                    <div className="h-[1px] bg-stone-200 flex-1"></div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-6">
                    {/* Total */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold text-stone-700">Bíblia Completa</span>
                            <span className="text-stone-500">{stats.total}% ({stats.totalRead}/1189 caps)</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-2.5">
                            <div className="bg-amber-600 h-2.5 rounded-full transition-all" style={{ width: `${stats.total}%` }}></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Antigo */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-stone-600">Antigo T.</span>
                                <span className="text-stone-400">{stats.ot}%</span>
                            </div>
                            <div className="w-full bg-stone-100 rounded-full h-1.5">
                                <div className="bg-stone-500 h-1.5 rounded-full transition-all" style={{ width: `${stats.ot}%` }}></div>
                            </div>
                        </div>
                        {/* Novo */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-stone-600">Novo T.</span>
                                <span className="text-stone-400">{stats.nt}%</span>
                            </div>
                            <div className="w-full bg-stone-100 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${stats.nt}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}