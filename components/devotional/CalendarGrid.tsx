'use client'

import { useState } from 'react'
import { openDevotionalDay } from '@/actions/devotional'
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalIcon } from 'lucide-react'

type DevotionalSummary = {
    id: string
    scheduled_date: string
    title: string
}

export default function CalendarGrid({
    initialData,
    currentYear,
    currentMonth
}: {
    initialData: DevotionalSummary[],
    currentYear: number,
    currentMonth: number
}) {
    const [date, setDate] = useState(new Date(currentYear, currentMonth - 1))
    const [loadingDay, setLoadingDay] = useState<string | null>(null)

    // Helpers de Data
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const firstDayOfWeek = new Date(date.getFullYear(), date.getMonth(), 1).getDay() // 0 = Domingo

    const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    // Navegação
    const prevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1))
    const nextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1))

    // Ação de Clique no Dia
    const handleDayClick = async (day: number) => {
        const monthStr = String(date.getMonth() + 1).padStart(2, '0')
        const dayStr = String(day).padStart(2, '0')
        const fullDate = `${date.getFullYear()}-${monthStr}-${dayStr}`

        setLoadingDay(fullDate)
        await openDevotionalDay(fullDate) // Server Action que redireciona
    }

    // Verifica se tem estudo no dia (comparando strings YYYY-MM-DD)
    const getStudyForDay = (day: number) => {
        const monthStr = String(date.getMonth() + 1).padStart(2, '0')
        const dayStr = String(day).padStart(2, '0')
        const fullDate = `${date.getFullYear()}-${monthStr}-${dayStr}`

        return initialData.find(d => d.scheduled_date === fullDate)
    }

    // Dias da semana
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            {/* Header do Calendário */}
            <div className="p-4 flex items-center justify-between border-b border-stone-100 bg-stone-50">
                <h2 className="font-serif font-bold text-stone-800 capitalize flex items-center gap-2">
                    <CalIcon className="text-amber-600" size={20} />
                    {monthName}
                </h2>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-2 hover:bg-stone-200 rounded-lg text-stone-500">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-stone-200 rounded-lg text-stone-500">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="p-4">
                {/* Cabeçalho dias da semana */}
                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map(d => (
                        <div key={d} className="text-center text-xs font-bold text-stone-400 uppercase tracking-wider py-2">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Dias */}
                <div className="grid grid-cols-7 gap-2">
                    {/* Espaços vazios antes do dia 1 */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {/* Dias do Mês */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const study = getStudyForDay(day)
                        const isToday =
                            day === new Date().getDate() &&
                            date.getMonth() === new Date().getMonth() &&
                            date.getFullYear() === new Date().getFullYear()

                        // Formata data string para comparar loading
                        const monthStr = String(date.getMonth() + 1).padStart(2, '0')
                        const dayStr = String(day).padStart(2, '0')
                        const fullDate = `${date.getFullYear()}-${monthStr}-${dayStr}`
                        const isLoading = loadingDay === fullDate

                        return (
                            <button
                                key={day}
                                onClick={() => handleDayClick(day)}
                                disabled={!!loadingDay}
                                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all border
                  ${isToday ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-100 text-stone-700 hover:border-amber-400 hover:bg-amber-50'}
                  ${isLoading ? 'opacity-70 animate-pulse' : ''}
                `}
                            >
                                <span className={`text-sm font-bold ${isToday ? 'text-white' : ''}`}>
                                    {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : day}
                                </span>

                                {/* Indicador de Estudo Existente */}
                                {study && !isLoading && (

                                    <span className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-amber-400' : 'bg-amber-500'}`}></span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="p-4 bg-stone-50 text-center text-xs text-stone-400 border-t border-stone-100">
                Toque em um dia para criar ou editar seu devocional.
            </div>
        </div>
    )
}