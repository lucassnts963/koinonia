import { createClient } from '@/lib/supabase/server'
import { getSafeUser } from '@/lib/supabase/auth'
import DailyMana from '@/components/dashboard/DailyMana'
import { getReadingStats } from '@/actions/stats'
import { Trophy, Flame, BookOpen, BookHeart, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const user = await getSafeUser(supabase)

    if (!user) return <div>Carregando...</div>

    // Busca o perfil
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Se der erro ou não achar perfil (caso raro), usamos um objeto vazio para não quebrar a tela
    const safeProfile = profile || {
        full_name: 'Peregrino',
        constancy_streak: 0,
        talents_balance: 0
    }

    const stats = await getReadingStats()

    return (
        <div className="space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-serif font-bold text-stone-800">
                    Paz, {safeProfile.full_name?.split(' ')[0] || 'Peregrino'}
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
                        {/* CORREÇÃO AQUI: mudado de current_streak para constancy_streak */}
                        {safeProfile.constancy_streak || 0} <span className="text-sm font-normal text-stone-500">dias</span>
                    </p>
                </div>
                <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-2 mb-1 text-stone-600">
                        <Trophy size={18} />
                        <span className="text-xs font-bold uppercase">Talentos</span>
                    </div>
                    <p className="text-2xl font-bold text-stone-800">
                        {/* Verifica se o valor existe, senão 0 */}
                        {safeProfile.talents_balance || 0}
                    </p>
                </div>
            </section>

            {/* === Card de Acesso ao Devocional === */}
            <section>
                <Link href="/app/devocional" className="group block">
                    <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl p-6 text-white shadow-md shadow-amber-900/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">

                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <BookHeart size={28} className="text-amber-50" />
                            </div>
                            <span className="bg-white/20 text-xs font-bold px-3 py-1 rounded-full text-white backdrop-blur-sm flex items-center gap-1 group-hover:bg-white/30 transition-colors">
                                Acessar <ArrowRight size={12} />
                            </span>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-xl font-bold font-serif mb-1 text-white">
                                Devocional Diário
                            </h3>
                            <p className="text-amber-100 text-sm leading-relaxed max-w-[90%]">
                                Registre sua caminhada, acesse o calendário espiritual e ouça a voz de Deus hoje.
                            </p>
                        </div>
                    </div>
                </Link>
            </section>

            {/* Maná do Dia */}
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