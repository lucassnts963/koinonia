'use client'

import { useState, useEffect } from 'react'
import { getDailyVerse } from '@/actions/daily'
import InteractiveVerse from '@/components/bible/InteractiveVerse'
import { Loader2, Calendar } from 'lucide-react'

// Tipo do Verso
type DailyVerseType = {
    id: string
    text: string
    verse: number
    chapter: number
    bible_books: { slug: string, name: string } | any
}

export default function DailyMana() {
    const [verse, setVerse] = useState<DailyVerseType | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadMana()
    }, [])

    async function loadMana() {
        const today = new Date().toDateString()
        const stored = localStorage.getItem('daily_mana')
        const storedDate = localStorage.getItem('daily_mana_date')

        if (stored && storedDate === today) {
            setVerse(JSON.parse(stored))
            setLoading(false)
            return
        }

        // Se não tem ou mudou o dia, busca novo
        try {
            const newVerse = await getDailyVerse()
            // @ts-ignore
            setVerse(newVerse)
            localStorage.setItem('daily_mana', JSON.stringify(newVerse))
            localStorage.setItem('daily_mana_date', today)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="h-32 flex items-center justify-center text-amber-600"><Loader2 className="animate-spin" /></div>

    if (!verse) return null

    return (
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
            {/* Faixa decorativa */}
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>

            <h3 className="text-amber-800 font-serif font-bold mb-4 flex items-center gap-2">
                <Calendar size={18} /> Maná do Dia
            </h3>

            <div className="mb-2">
                <InteractiveVerse
                    text={verse.text}
                    verseNumber={verse.verse}
                    bookSlug={verse.bible_books?.slug}
                    chapter={verse.chapter}
                />
            </div>

            <div className="text-right mt-2">
                <p className="text-sm font-bold text-stone-600">
                    {verse.bible_books?.name} {verse.chapter}:{verse.verse}
                </p>
            </div>
        </div>
    )
}
