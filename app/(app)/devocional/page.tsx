import { getMonthDevotionals } from '@/actions/devotional'
import CalendarGrid from '@/components/devotional/CalendarGrid'
import { BookHeart, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Isso garante que a data seja sempre atual no servidor
export const dynamic = 'force-dynamic'

export default async function DevocionalPage() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // JS 0-11 -> SQL 1-12

    // Busca estudos deste mês inicial
    const devotionals = await getMonthDevotionals(year, month)

    return (
        <div className="space-y-6 pb-20">
            <header className="flex items-center gap-3">
                <Link href="/app" className="p-2 -ml-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
                        <BookHeart className="text-amber-600" />
                        Devocional Diário
                    </h1>
                    <p className="text-stone-500 text-sm">
                        Registre sua caminhada e ouça a voz de Deus dia após dia.
                    </p>
                </div>
            </header>

            {/* Área Principal */}
            <section>
                <CalendarGrid
                    initialData={devotionals}
                    currentYear={year}
                    currentMonth={month}
                />
            </section>

            {/* Lista rápida dos últimos (Opcional, para contexto) */}
            <section className="mt-8">
                <h3 className="font-bold text-stone-700 mb-4 px-1">Recentes</h3>
                <div className="space-y-3">
                    {devotionals.length > 0 ? (
                        devotionals.reverse().slice(0, 3).map(study => (
                            <Link key={study.id} href={`/estudos/novo?id=${study.id}`}>
                                <div className="bg-white p-4 rounded-xl border border-stone-100 hover:border-amber-300 hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
                                            {study.title}
                                        </h4>
                                        <span className="text-xs text-stone-400 bg-stone-50 px-2 py-1 rounded">
                                            {new Date(study.scheduled_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                    <p className="text-stone-400 text-xs mt-1">Clique para continuar escrevendo...</p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-8 text-stone-400 bg-stone-50 rounded-lg border border-dashed border-stone-200">
                            <p>Nenhum devocional neste mês ainda.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}