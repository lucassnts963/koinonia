import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckCircle2, BookOpen } from 'lucide-react'
import { getBooks } from '@/services/bibleService' // Você vai precisar atualizar isso pra retornar cap!

// Como getBooks só retorna nomes, vamos precisar de uma função rápida pra saber quantos capítulos cada livro tem
// MOCK para MVP (Ideal: ter isso no banco 'bible_books.chapters_count')
const getChapterCount = (slug: string) => {
    // Mapa simplificado. Em produção, use o DB.
    const counts: Record<string, number> = { 'gn': 50, 'ex': 40, 'mt': 28, 'ap': 22, 'jo': 21, 'rm': 16 }
    return counts[slug.toLowerCase()] || 20 // Default fallback
}

export const dynamic = 'force-dynamic'

export default async function BookChaptersPage({ params }: { params: Promise<{ book: string }> }) {
    const { book } = await params
    const supabase = await createClient()

    // 1. Pegar info do Livro
    const { data: bookData } = await supabase
        .from('bible_books')
        .select('*')
        .ilike('slug', book)
        .single()

    if (!bookData) return <div>Livro não encontrado</div>

    // 2. Pegar Histórico de Leitura (Quais caps eu já li?)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: history } = await supabase
        .from('reading_history')
        .select('chapter')
        .eq('user_id', user?.id)
        .eq('book_slug', book)

    const readChapters = new Set(history?.map(h => h.chapter))
    const totalChapters = getChapterCount(bookData.slug)

    return (
        <div className="space-y-8 pb-20">
            <header className="text-center space-y-2">
                <span className="text-xs font-bold tracking-widest text-stone-400 uppercase">Antigo Testamento</span>
                <h1 className="text-4xl font-serif font-bold text-stone-800">{bookData.name}</h1>
                <p className="text-stone-500 text-sm max-w-md mx-auto">
                    Selecione um capítulo para iniciar sua leitura e selar seu aprendizado.
                </p>
            </header>

            {/* Grid de Capítulos */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-w-3xl mx-auto">
                {Array.from({ length: totalChapters }, (_, i) => i + 1).map((chap) => {
                    const isRead = readChapters.has(chap)

                    return (
                        <Link
                            key={chap}
                            href={`/leitura/${book}/${chap}`}
                            className={`
                                relative aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all
                                ${isRead
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : 'bg-white border-stone-100 hover:border-amber-400 hover:shadow-md text-stone-600'
                                }
                            `}
                        >
                            <span className="text-lg font-bold font-serif">{chap}</span>
                            {isRead && (
                                <div className="absolute top-1 right-1">
                                    <CheckCircle2 size={12} className="text-green-500" />
                                </div>
                            )}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
