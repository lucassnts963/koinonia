'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markAnswered, flagContent, type ReactionKind } from '@/actions/discussion'
import ReactionBar from './ReactionBar'
import ReplyForm from './ReplyForm'
import Autor, { type AutorInfo } from './Autor'
import { CheckCircle2, Flag, MessageSquare } from 'lucide-react'

export type Resposta = {
    id: string
    body: string
    parent_id: string | null
    edifying_count: number
    created_at: string
    author: AutorInfo
}

type Props = {
    discussionId: string
    respostas: Resposta[]
    reacoesPorResposta: Record<string, ReactionKind[]>
    ehAutorDaDiscussao: boolean
    respostaAceitaId: string | null
}

export default function DiscussionThread({
    discussionId,
    respostas,
    reacoesPorResposta,
    ehAutorDaDiscussao,
    respostaAceitaId,
}: Props) {
    const [respondendo, setRespondendo] = useState<string | null>(null)
    const [, iniciar] = useTransition()
    const router = useRouter()

    // O aninhamento é travado em um nível pelo banco (trigger
    // enforce_reply_depth). A UI reflete isso: raízes e, sob cada uma, as
    // filhas — nunca mais fundo.
    const raizes = respostas.filter((r) => !r.parent_id)
    const filhasDe = (id: string) => respostas.filter((r) => r.parent_id === id)

    const denunciar = (tipo: 'discussion' | 'reply', id: string) => {
        const motivo = prompt('O que há de errado com este conteúdo?')
        if (!motivo?.trim()) return
        iniciar(async () => {
            const r = await flagContent(tipo, id, motivo)
            alert(r.message ?? 'Registrado.')
        })
    }

    const aceitar = (replyId: string) => {
        iniciar(async () => {
            await markAnswered(discussionId, replyId)
            router.refresh()
        })
    }

    if (raizes.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center">
                <MessageSquare className="mx-auto mb-2 text-stone-300" size={28} />
                <p className="text-sm text-stone-500">Ninguém respondeu ainda. Comece você.</p>
                <div className="mx-auto mt-4 max-w-lg text-left">
                    <ReplyForm discussionId={discussionId} />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {raizes.map((r) => {
                const aceita = respostaAceitaId === r.id
                return (
                    <article
                        key={r.id}
                        className={`rounded-xl border bg-white p-4 ${
                            aceita ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-stone-200'
                        }`}
                    >
                        {aceita && (
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                                <CheckCircle2 size={14} /> Resposta marcada pelo autor
                            </p>
                        )}

                        <Autor autor={r.author} quando={r.created_at} />
                        <p className="mt-2 whitespace-pre-wrap font-serif text-stone-800">{r.body}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <ReactionBar
                                targetType="reply"
                                targetId={r.id}
                                minhasReacoes={reacoesPorResposta[r.id] ?? []}
                            />
                            <button
                                type="button"
                                onClick={() => setRespondendo(respondendo === r.id ? null : r.id)}
                                className="rounded-full px-2 py-1 text-xs text-stone-500 hover:text-stone-800"
                            >
                                Responder
                            </button>
                            {ehAutorDaDiscussao && !aceita && (
                                <button
                                    type="button"
                                    onClick={() => aceitar(r.id)}
                                    className="rounded-full px-2 py-1 text-xs text-emerald-700 hover:text-emerald-900"
                                >
                                    Marcar como resposta
                                </button>
                            )}
                            {/* Denúncia vai para a liderança da tribo e nunca afeta
                                a pontuação do conteúdo. */}
                            <button
                                type="button"
                                onClick={() => denunciar('reply', r.id)}
                                title="Avisar a liderança da tribo"
                                className="ml-auto rounded-full p-1 text-stone-300 hover:text-red-500"
                            >
                                <Flag size={13} />
                            </button>
                        </div>

                        {filhasDe(r.id).length > 0 && (
                            <div className="mt-4 space-y-3 border-l-2 border-stone-100 pl-4">
                                {filhasDe(r.id).map((f) => (
                                    <div key={f.id}>
                                        <Autor autor={f.author} quando={f.created_at} />
                                        <p className="mt-1 whitespace-pre-wrap font-serif text-sm text-stone-700">
                                            {f.body}
                                        </p>
                                        <div className="mt-2">
                                            <ReactionBar
                                                targetType="reply"
                                                targetId={f.id}
                                                minhasReacoes={reacoesPorResposta[f.id] ?? []}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {respondendo === r.id && (
                            <div className="mt-4 border-l-2 border-amber-200 pl-4">
                                <ReplyForm
                                    discussionId={discussionId}
                                    parentId={r.id}
                                    placeholder={`Respondendo a ${r.author?.username ?? 'alguém'}...`}
                                    onDone={() => setRespondendo(null)}
                                />
                            </div>
                        )}
                    </article>
                )
            })}

            <div className="rounded-xl border border-stone-200 bg-white p-4">
                <p className="mb-2 text-sm font-bold text-stone-700">Sua resposta</p>
                <ReplyForm discussionId={discussionId} />
            </div>
        </div>
    )
}
