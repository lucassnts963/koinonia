import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessageSquare, ChevronRight, Users } from 'lucide-react'
import { getTribeData } from '@/actions/tribe'
import { listarDiscussoesDaTribo } from '@/actions/discussion'
import { linkDaAncora } from '@/lib/discussao'

export const dynamic = 'force-dynamic'

/**
 * Antes disto, a única forma de ver uma discussão da tribo era já saber em
 * qual capítulo ou estudo ela nasceu — não existia um lugar para simplesmente
 * ver "o que minha tribo está conversando". RLS de discussions já escopa por
 * tribo (is_tribe_member); esta tela só junta num feed.
 */
export default async function DiscussaoDaTriboPage() {
    const { tribo } = await getTribeData()
    if (!tribo) redirect('/discipulado')

    const discussoes = await listarDiscussoesDaTribo(tribo.id)

    return (
        <div className="space-y-6 pb-20">
            <header>
                <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-stone-800">
                    <MessageSquare className="text-amber-600" />
                    Discussões de {tribo.name}
                </h1>
                <p className="text-sm text-stone-500">
                    Tudo que sua tribo está conversando, de qualquer capítulo, estudo ou termo.
                </p>
            </header>

            <div className="space-y-3">
                {discussoes.map((d) => {
                    const ancora = linkDaAncora(d.anchor_type, d.anchor_ref)
                    return (
                        <Link
                            key={d.id}
                            href={`/discussao/${d.id}`}
                            className="block rounded-xl border border-stone-200 bg-white p-4 hover:border-amber-400 transition-colors group"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-stone-800 truncate">{d.title}</h3>
                                        {ancora && (
                                            <span className="shrink-0 text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-bold">
                                                {ancora.rotulo}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-stone-500 line-clamp-2">{d.body}</p>
                                    <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                                        <span>@{d.author?.username ?? 'anônimo'}</span>
                                        <span>{d.reply_count ?? 0} respostas</span>
                                        <span>{d.edifying_count ?? 0} edificantes</span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="shrink-0 text-stone-300 group-hover:text-amber-500" />
                            </div>
                        </Link>
                    )
                })}

                {discussoes.length === 0 && (
                    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
                        <Users className="mx-auto mb-2 h-8 w-8 text-stone-300" />
                        <p className="text-sm text-stone-500">Sua tribo ainda não começou nenhuma discussão.</p>
                        <p className="text-xs text-stone-400 mt-1">
                            Abra um capítulo na leitura e role até o fim para começar uma.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
