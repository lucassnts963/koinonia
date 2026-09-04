import Link from 'next/link'
import { MessageSquare, Sparkles } from 'lucide-react'
import { listDiscussions, listMyTribes, type AnchorType } from '@/actions/discussion'
import NovaDiscussao from './NovaDiscussao'

/**
 * Bloco de discussão preso a um objeto do app (capítulo, versículo, estudo).
 *
 * Server Component: a lista vem do servidor com RLS já aplicada, então o
 * que aparece aqui é só o que a tribo do leitor pode ver. Não existe
 * filtro de visibilidade no cliente para alguém burlar.
 */
export default async function DiscussaoAncorada({
    anchorType,
    anchorRef,
    titulo = 'Discussão',
}: {
    anchorType: AnchorType
    anchorRef: string
    titulo?: string
}) {
    const [discussoes, tribos] = await Promise.all([
        listDiscussions(anchorType, anchorRef),
        listMyTribes(),
    ])

    return (
        <section className="mt-12 space-y-4 border-t border-stone-200 pt-8">
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-stone-800">
                <MessageSquare size={18} className="text-amber-600" />
                {titulo}
                {discussoes.length > 0 && (
                    <span className="text-sm font-normal text-stone-400">({discussoes.length})</span>
                )}
            </h2>

            {discussoes.length === 0 ? (
                <p className="text-sm text-stone-500">
                    Ninguém conversou sobre esta passagem ainda.
                </p>
            ) : (
                <ul className="space-y-2">
                    {discussoes.map((d) => {
                        const autor = d.author as unknown as { username: string | null } | null
                        return (
                            <li key={d.id}>
                                <Link
                                    href={`/discussao/${d.id}`}
                                    className="block rounded-xl border border-stone-200 bg-white p-4 transition hover:border-amber-400 hover:shadow-sm"
                                >
                                    <h3 className="font-bold text-stone-800">{d.title}</h3>
                                    <p className="mt-1 line-clamp-2 font-serif text-sm text-stone-500">{d.body}</p>
                                    <div className="mt-3 flex items-center gap-4 text-xs text-stone-400">
                                        <span>{autor?.username ?? 'Anônimo'}</span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare size={12} /> {d.reply_count ?? 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Sparkles size={12} /> {d.edifying_count ?? 0}
                                        </span>
                                        {d.status === 'answered' && (
                                            <span className="font-bold text-emerald-600">Respondida</span>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            )}

            <NovaDiscussao anchorType={anchorType} anchorRef={anchorRef} tribos={tribos} />
        </section>
    )
}
