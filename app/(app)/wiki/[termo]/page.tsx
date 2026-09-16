import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { getDefinition } from '@/actions/dictionary'
import { searchVersesByTerm } from '@/actions/bible'
import { ArrowLeft, ChevronRight, Sparkles } from 'lucide-react'
import PropostaVerbeteForm from '@/components/wiki/PropostaVerbeteForm'

export const dynamic = 'force-dynamic'

export default async function VerbetePage({
    params,
}: {
    params: Promise<{ termo: string }>
}) {
    const { termo } = await params
    const termoDecodificado = decodeURIComponent(termo)

    const [resultado, concordancia] = await Promise.all([
        getDefinition(termoDecodificado),
        searchVersesByTerm(termoDecodificado),
    ])

    const verbete = resultado.success ? resultado.data : null

    return (
        <div className="space-y-6 pb-20">
            <Link href="/wiki" className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-amber-700">
                <ArrowLeft size={14} /> Voltar à Wiki
            </Link>

            {verbete ? (
                <div className="rounded-xl border border-stone-200 bg-white p-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <h1 className="font-serif text-2xl font-bold text-stone-800">{verbete.term}</h1>
                        {verbete.source === 'ai_generated' && (
                            <span className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                                <Sparkles size={10} /> GERADO POR IA (ARQUIVO)
                            </span>
                        )}
                    </div>
                    {verbete.aliases.length > 0 && (
                        <p className="text-xs text-stone-400">Também conhecido como: {verbete.aliases.join(', ')}</p>
                    )}
                    <div className="prose prose-amber prose-p:my-2 prose-headings:my-2 max-w-none text-stone-700">
                        <ReactMarkdown>{verbete.definition}</ReactMarkdown>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 text-center space-y-3">
                    <p className="text-stone-500 text-sm">
                        Ainda não há verbete publicado para <strong>{termoDecodificado}</strong>.
                    </p>
                    <PropostaVerbeteForm termoInicial={termoDecodificado} />
                </div>
            )}

            <div>
                <h2 className="text-sm font-bold text-stone-600 mb-2">Concordância — na Bíblia</h2>
                <div className="space-y-2">
                    {concordancia.length > 0 ? concordancia.map((res, idx) => (
                        <Link
                            href={`/leitura/${res.book_slug}/${res.chapter}`}
                            key={idx}
                            className="block bg-white p-3 rounded-lg border border-stone-100 hover:border-amber-300 transition-colors group"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-amber-800">{res.book_name} {res.chapter}:{res.verse}</span>
                                <ChevronRight size={14} className="text-stone-300 group-hover:text-amber-500" />
                            </div>
                            <p className="text-sm text-stone-600 font-serif">{res.text}</p>
                        </Link>
                    )) : (
                        <p className="text-xs text-stone-500">Nenhum versículo encontrado com esse termo.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
