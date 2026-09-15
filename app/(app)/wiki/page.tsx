import Link from 'next/link'
import { listarVerbetesPublicados, listarVerbetesPendentes } from '@/actions/dictionary'
import { souLideranca } from '@/actions/moderation'
import { BookOpen, ChevronRight, ShieldCheck } from 'lucide-react'
import PropostaVerbeteForm from '@/components/wiki/PropostaVerbeteForm'

export const dynamic = 'force-dynamic'

export default async function WikiPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q } = await searchParams
    const [verbetes, pastoreia] = await Promise.all([
        listarVerbetesPublicados(),
        souLideranca(),
    ])

    const pendentes = pastoreia ? await listarVerbetesPendentes() : []

    const termo = (q ?? '').trim().toLowerCase()
    const filtrados = termo
        ? verbetes.filter((v) =>
            v.term.toLowerCase().includes(termo) ||
            v.aliases.some((a) => a.toLowerCase().includes(termo))
          )
        : verbetes

    return (
        <div className="space-y-6 pb-20">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-stone-800">
                        <BookOpen className="text-amber-600" />
                        Wiki
                    </h1>
                    <p className="text-sm text-stone-500">
                        Verbetes escritos e revisados por gente, sem IA. Qualquer um propõe; a
                        liderança aprova antes de virar público.
                    </p>
                </div>

                {pastoreia && (
                    <Link
                        href="/wiki/pendentes"
                        className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:border-amber-400"
                    >
                        <ShieldCheck size={14} />
                        {pendentes.length} pendente{pendentes.length === 1 ? '' : 's'}
                    </Link>
                )}
            </header>

            <form className="flex gap-2">
                <input
                    type="text"
                    name="q"
                    defaultValue={q}
                    placeholder="Buscar termo..."
                    className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
                <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white hover:bg-stone-800">
                    Buscar
                </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtrados.map((v) => (
                    <Link
                        key={v.id}
                        href={`/wiki/${encodeURIComponent(v.term)}`}
                        className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 hover:border-amber-400 transition-colors group"
                    >
                        <div>
                            <h3 className="font-bold text-stone-800">{v.term}</h3>
                            <p className="text-xs text-stone-500 line-clamp-1">{v.definition}</p>
                        </div>
                        <ChevronRight size={16} className="text-stone-300 group-hover:text-amber-500 shrink-0" />
                    </Link>
                ))}

                {filtrados.length === 0 && (
                    <p className="text-sm text-stone-500 sm:col-span-2">
                        {termo ? 'Nenhum verbete encontrado.' : 'Nenhum verbete publicado ainda.'}
                    </p>
                )}
            </div>

            <PropostaVerbeteForm termoInicial={termo && filtrados.length === 0 ? q : undefined} />
        </div>
    )
}
