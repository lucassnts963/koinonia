import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Search, Clock, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BibleIndexPage() {
    const supabase = await createClient()

    // 1. Buscar Livros
    const { data: books } = await supabase
        .from('bible_books')
        .select('slug, name, testament')
        .order('id')

    // 2. Buscar Última Leitura (Se houver)
    const { data: { user } } = await supabase.auth.getUser()
    let lastRead = null

    if (user) {
        const { data: history } = await supabase
            .from('reading_history')
            .select('book_slug, chapter, completed_at, bible_books(name)')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false })
            .limit(1)
            .single()

        if (history) {
            lastRead = history
        }
    }

    const oldTestament = books?.filter(b => b.testament === 'VT') || []
    const newTestament = books?.filter(b => b.testament === 'NT') || []

    return (
        <div className="space-y-8 pb-20">
            <header>
                <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
                    <BookOpen className="text-amber-600" />
                    Sagradas Escrituras
                </h1>
                <p className="text-stone-500 text-sm">
                    Lâmpada para os meus pés, luz para o meu caminho.
                </p>
            </header>

            {/* Continuar Leitura */}
            {lastRead && (
                <section>
                    <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                        <Clock size={12} /> Continuar de onde parou
                    </h2>
                    <Link
                        href={`/leitura/${lastRead.book_slug}/${lastRead.chapter}`}
                        className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between hover:border-amber-400 hover:shadow-md transition-all group"
                    >
                        <div>
                            <p className="font-serif font-bold text-stone-800 text-lg group-hover:text-amber-800">
                                {/* @ts-ignore - Supabase type join issue */}
                                {lastRead.bible_books?.name} {lastRead.chapter}
                            </p>
                            <p className="text-xs text-stone-500">
                                Leitura realizada {new Date(lastRead.completed_at).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        <div className="bg-amber-100 p-2 rounded-full text-amber-700 group-hover:scale-110 transition-transform">
                            <ChevronRight size={20} />
                        </div>
                    </Link>
                </section>
            )}

            {/* Antigo Testamento */}
            <section>
                <div className="flex items-center gap-4 mb-4">
                    <h2 className="font-serif font-bold text-xl text-stone-700">Antigo Testamento</h2>
                    <div className="h-[1px] bg-stone-200 flex-1"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {oldTestament.map(book => (
                        <Link
                            key={book.slug}
                            href={`/leitura/${book.slug}`}
                            className="bg-white p-3 rounded-lg border border-stone-100 hover:bg-white hover:border-amber-300 hover:shadow-sm transition text-center"
                        >
                            <span className="font-serif text-stone-700 font-medium">{book.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Novo Testamento */}
            <section>
                <div className="flex items-center gap-4 mb-4">
                    <h2 className="font-serif font-bold text-xl text-stone-700">Novo Testamento</h2>
                    <div className="h-[1px] bg-stone-200 flex-1"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {newTestament.map(book => (
                        <Link
                            key={book.slug}
                            href={`/leitura/${book.slug}`}
                            className="bg-white p-3 rounded-lg border border-stone-100 hover:border-blue-300 hover:shadow-sm transition text-center"
                        >
                            <span className="font-serif text-slate-700 font-medium">{book.name}</span>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    )
}