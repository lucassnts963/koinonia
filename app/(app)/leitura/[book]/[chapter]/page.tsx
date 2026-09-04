import { getChapter } from '@/services/bibleService'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import InteractiveVerse from '@/components/bible/InteractiveVerse'
import ChapterComplete from '@/components/gamification/ChapterComplete'
import DiscussaoAncorada from '@/components/discussion/DiscussaoAncorada'

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

            {/* Texto Bíblico.
                dir vem da versão: hebraico é RTL, e forçar LTR embaralharia
                a leitura. */}
            <div className="space-y-1" dir={data.version?.direction ?? 'ltr'}>
                {data.verses.map((verse) => {
                    // Verifica se existe alguma nota para este versículo
                    // Otimização: Em produção faríamos um Map/Set fora do loop, 
                    // mas para 176 versículos (Salmo 119) ainda é ok.
                    // Para o MVP não carregamos notas ainda nesse componente de server page,
                    // vamos deixar hasNote={false} ou implementar o fetch de notas na page.
                    // Como não pedi para buscar notas na page ainda, vamos deixar false ou buscar rapido.

                    return (
                        <InteractiveVerse
                            key={verse.id}
                            text={verse.text}
                            verseNumber={verse.verse}
                            bookSlug={book}
                            chapter={parseInt(chapter)}
                        // hasNote={notes.some(n => n.verse === verse.verse)} // TODO: Carregar notas
                        />
                    )
                })}
            </div>

            {/* ÁREA DE GAMIFICAÇÃO */}
            <ChapterComplete
                bookSlug={book}
                chapter={parseInt(chapter)}
                nextUrl={data.next ? `/leitura/${data.next.bookSlug}/${data.next.chapter}` : null}
            />

            {/* Crédito da tradução.
                Não é enfeite: A Bíblia Livre é CC BY 3.0 BR, e atribuição é
                condição da licença. Sem isto na tela, o texto está no ar
                fora dos termos. O conteúdo vem de bible_versions.attribution,
                então cada versão declara o próprio crédito. */}
            {data.version?.attribution && (
                <p className="mt-8 border-t border-stone-200 pt-4 text-xs text-stone-400">
                    {data.version.name}
                    {data.version.abbreviation ? ` (${data.version.abbreviation})` : ''} — {data.version.attribution}
                    {data.version.license_url && (
                        <>
                            {' '}
                            <a
                                href={data.version.license_url}
                                target="_blank"
                                rel="noopener noreferrer license"
                                className="underline hover:text-stone-600"
                            >
                                Licença
                            </a>
                        </>
                    )}
                </p>
            )}

            {/* Discussão ancorada neste capítulo.
                A âncora é `<livro>-<capítulo>`, o mesmo formato que
                linkDaAncora() em /discussao/[id] sabe desmontar para
                trazer o leitor de volta para cá. */}
            <DiscussaoAncorada
                anchorType="passage"
                anchorRef={`${book}-${chapter}`}
                titulo={`Conversa sobre ${data.book.name} ${chapter}`}
            />

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