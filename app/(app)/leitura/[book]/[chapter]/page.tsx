import { getChapter } from '@/services/bibleService'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Definindo o tipo corretamente para Next.js 15+
// Params agora deve ser tipado como uma Promise
type PageProps = {
    params: Promise<{
        book: string;
        chapter: string
    }>
}

export default async function ChapterPage({ params }: PageProps) {
    // --- A CORREÇÃO ESTÁ AQUI ---
    // No Next.js 15, você OBRIGATORIAMENTE precisa dar await em params
    const { book, chapter } = await params

    // Agora as variáveis book e chapter têm valor real, e não 'undefined'
    const data = await getChapter(book, parseInt(chapter))

    return (
        <div className="max-w-2xl mx-auto pb-20">
            {/* Header de Navegação */}
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-stone-50/95 backdrop-blur py-4 border-b border-stone-200 z-10">
                <h1 className="text-xl font-serif font-bold text-stone-800 capitalize">
                    {data.book.name} <span className="text-amber-600">{data.chapter}</span>
                </h1>

                <div className="flex gap-2">
                    <Link
                        href={data.prev ? `/leitura/${data.prev.bookSlug}/${data.prev.chapter}` : '#'}
                        className={`p-2 rounded-full hover:bg-stone-200 transition ${!data.prev && 'opacity-30 pointer-events-none'}`}
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <Link
                        href={data.next ? `/leitura/${data.next.bookSlug}/${data.next.chapter}` : '#'}
                        className={`p-2 rounded-full hover:bg-stone-200 transition ${!data.next && 'opacity-30 pointer-events-none'}`}
                    >
                        <ChevronRight size={20} />
                    </Link>
                </div>
            </div>

            {/* Texto Bíblico */}
            <div className="space-y-4">
                {data.verses.map((verse) => (
                    <div key={verse.id} className="group relative">
                        <p className="text-lg md:text-xl font-serif leading-relaxed text-stone-700">
                            <span className="text-xs font-sans text-stone-400 font-bold mr-2 select-none align-top mt-1 inline-block">
                                {verse.verse}
                            </span>
                            {verse.text}
                        </p>
                    </div>
                ))}
            </div>

            {/* Botão Próximo Gigante */}
            {data.next && (
                <Link
                    href={`/leitura/${data.next.bookSlug}/${data.next.chapter}`}
                    className="mt-12 block w-full bg-stone-900 text-amber-500 py-4 rounded-xl text-center font-bold hover:bg-stone-800 transition shadow-lg"
                >
                    Próximo Capítulo →
                </Link>
            )}
        </div>
    )
}