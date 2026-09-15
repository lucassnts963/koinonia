import Link from 'next/link'
import { Library, MessageSquare, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type ItemDoAcervo = {
    id: string
    title: string
    body: string
    reply_count: number | null
    edifying_count: number | null
    created_at: string
    author: { username: string | null; stature: string | null } | null
}

/**
 * Acervo público: estudos que alguém decidiu publicar.
 *
 * `tribe_id IS NULL` é o acervo. Nada nasce aqui — só chega por
 * publishStudy(). É o que impede o app de virar praça pública onde qualquer
 * um abre tema e a maioria decide doutrina.
 */
export default async function AcervoPage() {
    const supabase = await createClient()

    const { data } = await supabase
        .from('discussions')
        .select(`
            id, title, body, reply_count, edifying_count, created_at,
            author:author_id ( username, stature )
        `)
        .is('tribe_id', null)
        .eq('anchor_type', 'study')
        .is('deleted_at', null)
        .order('last_activity_at', { ascending: false })
        .limit(50)

    const itens = (data ?? []) as unknown as ItemDoAcervo[]

    return (
        <div className="space-y-6 pb-20">
            <header>
                <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-stone-800">
                    <Library className="text-amber-600" />
                    Acervo
                </h1>
                <p className="text-sm text-stone-500">
                    Estudos que a comunidade publicou. Qualquer um pode ler e responder.
                </p>
            </header>

            {itens.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 py-20 text-center">
                    <Library className="mx-auto mb-2 h-12 w-12 text-stone-300" />
                    <p className="text-stone-500">O acervo ainda está vazio.</p>
                    <p className="mt-1 text-sm text-stone-400">
                        Publique um dos{' '}
                        <Link href="/estudos" className="font-bold text-amber-700 hover:underline">
                            seus estudos
                        </Link>{' '}
                        para começar.
                    </p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {itens.map((item) => (
                        <li key={item.id}>
                            <Link
                                href={`/discussao/${item.id}`}
                                className="block rounded-xl border border-stone-200 bg-white p-5 transition hover:border-amber-400 hover:shadow-sm"
                            >
                                <h2 className="font-serif text-lg font-bold text-stone-800">{item.title}</h2>
                                <p className="mt-1 line-clamp-2 font-serif text-sm text-stone-500">{item.body}</p>
                                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-stone-400">
                                    <span>@{item.author?.username ?? 'anônimo'}</span>
                                    {item.author?.stature && (
                                        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-800">
                                            {item.author.stature}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <MessageSquare size={12} /> {item.reply_count ?? 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Sparkles size={12} /> {item.edifying_count ?? 0}
                                    </span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
