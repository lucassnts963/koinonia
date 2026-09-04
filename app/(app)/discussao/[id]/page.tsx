import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MessageSquare, Anchor } from 'lucide-react'
import { getDiscussion, getMyReactions } from '@/actions/discussion'
import { createClient } from '@/lib/supabase/server'
import DiscussionThread, { type Resposta } from '@/components/discussion/DiscussionThread'
import ReactionBar from '@/components/discussion/ReactionBar'
import Autor from '@/components/discussion/Autor'

export const dynamic = 'force-dynamic'

// A âncora é o motivo de a discussão existir: todo tema nasce preso a um
// objeto do app. O link de volta é o que impede isto de virar fórum.
function linkDaAncora(tipo: string, ref: string): { href: string; rotulo: string } | null {
    if (tipo === 'verse' || tipo === 'passage') {
        // 'gn-1' ou 'gn-1:1'
        const [livro, resto] = ref.split('-')
        const capitulo = resto?.split(':')[0]
        if (livro && capitulo) {
            return { href: `/leitura/${livro}/${capitulo}`, rotulo: `${livro.toUpperCase()} ${resto}` }
        }
    }
    if (tipo === 'study') return { href: `/estudos`, rotulo: 'Estudo publicado' }
    return null
}

export default async function DiscussaoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const dados = await getDiscussion(id)
    if (!dados) notFound()

    const { discussion, replies } = dados

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Uma chamada por tipo de alvo, em paralelo — não uma por resposta.
    const [reacoesDaDiscussao, reacoesDasRespostas] = await Promise.all([
        getMyReactions('discussion', [discussion.id]),
        getMyReactions('reply', replies.map((r) => r.id)),
    ])

    const autor = discussion.author as unknown as {
        id?: string; username: string | null; stature: string | null; stature_level: number | null
    } | null

    const ancora = linkDaAncora(discussion.anchor_type, discussion.anchor_ref)

    return (
        <div className="space-y-6 pb-20">
            <Link
                href={ancora?.href ?? '/dashboard'}
                className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
            >
                <ChevronLeft size={16} /> Voltar
            </Link>

            <header className="rounded-xl border border-stone-200 bg-white p-5">
                {ancora && (
                    <Link
                        href={ancora.href}
                        className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600 hover:bg-stone-200"
                    >
                        <Anchor size={12} /> {ancora.rotulo}
                    </Link>
                )}

                <h1 className="font-serif text-2xl font-bold text-stone-900">{discussion.title}</h1>

                <div className="mt-3">
                    <Autor autor={autor} quando={discussion.created_at} />
                </div>

                <p className="mt-4 whitespace-pre-wrap font-serif text-stone-800">{discussion.body}</p>

                <div className="mt-4 flex items-center gap-3 border-t border-stone-100 pt-4">
                    <ReactionBar
                        targetType="discussion"
                        targetId={discussion.id}
                        minhasReacoes={reacoesDaDiscussao[discussion.id] ?? []}
                    />
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-stone-400">
                        <MessageSquare size={13} /> {discussion.reply_count ?? 0}
                    </span>
                </div>
            </header>

            <DiscussionThread
                discussionId={discussion.id}
                respostas={replies as unknown as Resposta[]}
                reacoesPorResposta={reacoesDasRespostas}
                ehAutorDaDiscussao={!!user && autor?.id === user.id}
                respostaAceitaId={discussion.answered_reply_id ?? null}
            />
        </div>
    )
}
