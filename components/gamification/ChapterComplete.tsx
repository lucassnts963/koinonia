'use client'

import { useState } from 'react'
import { completeChapter } from '@/actions/progress' // Usando a nova lógica
import confetti from 'canvas-confetti'
import { CheckCircle2, Trophy, Flame } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ChapterComplete({
    bookSlug,
    chapter,
    nextUrl
}: {
    bookSlug: string
    chapter: number
    nextUrl: string | null
}) {
    const [loading, setLoading] = useState(false)
    const [completed, setCompleted] = useState(false)
    const [message, setMessage] = useState('')
    const [stats, setStats] = useState<{ xp: number, streak: number } | null>(null)
    const router = useRouter()

    const handleComplete = async () => {
        if (loading || completed) return
        setLoading(true)

        try {
            // Chamada atualizada para o novo arquivo de actions
            const result = await completeChapter(bookSlug, chapter)

            if (result.success) {
                setCompleted(true)
                setMessage(result.message)

                // Só mostra animação de XP se realmente ganhou algo (primeira vez)
                if (result.isFirstRead) {
                    setStats({ xp: result.talentsGained, streak: result.newStreak })
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.8 },
                        colors: ['#f59e0b', '#78350f', '#fbbf24']
                    })
                    if (result.isLevelUp) {
                        setTimeout(() => {
                            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } })
                            alert(`🎉 GLÓRIA! Você alcançou uma nova estatura: Nível ${result.newLevel}`)
                        }, 500)
                    }
                } else {
                    // Se já leu, feedback visual simples
                    setStats(null)
                }
            }
        } catch (err) {
            console.error(err)
            alert("Erro ao salvar progresso.")
        } finally {
            setLoading(false)
        }
    }

    if (completed) {
        return (
            <div className="mt-12 bg-amber-50 border border-amber-200 rounded-xl p-6 text-center animate-in zoom-in duration-300">
                <h3 className="text-amber-800 font-bold text-lg mb-2">{message}</h3>

                {stats ? (
                    <div className="flex justify-center gap-6 mb-6">
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-amber-600 flex items-center gap-1">
                                +{stats.xp} <Trophy size={20} />
                            </span>
                            <span className="text-xs text-amber-800 uppercase">Talentos</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-orange-600 flex items-center gap-1">
                                {stats.streak} <Flame size={20} />
                            </span>
                            <span className="text-xs text-orange-800 uppercase">Dias</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-stone-500 text-sm mb-4">Você já havia completado este capítulo antes.</p>
                )}

                {nextUrl ? (
                    <button
                        onClick={() => router.push(nextUrl)}
                        className="w-full py-3 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 transition"
                    >
                        Continuar Jornada →
                    </button>
                ) : (
                    <p className="text-stone-500 text-sm">Fim do Livro!</p>
                )}
            </div>
        )
    }

    return (
        <div className="mt-12 mb-8">
            <button
                onClick={handleComplete}
                disabled={loading}
                className="group w-full py-4 bg-white border-2 border-stone-200 hover:border-amber-500 hover:bg-amber-50 text-stone-600 hover:text-amber-700 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
            >
                {loading ? "Selando..." : <> <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" /> Selar Leitura </>}
            </button>
        </div>
    )
}