'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleReaction, type ReactionKind } from '@/actions/discussion'
import { Sparkles, HeartHandshake, HandHeart } from 'lucide-react'

// Não existe reação negativa, por desenho: downvote em conteúdo devocional
// não gera sinal útil e ensina a plateia a punir quem discorda.
const REACOES: { kind: ReactionKind; label: string; Icon: typeof Sparkles }[] = [
    { kind: 'edificante', label: 'Edificante', Icon: Sparkles },
    { kind: 'me_ajudou', label: 'Me ajudou', Icon: HeartHandshake },
    { kind: 'orando', label: 'Orando', Icon: HandHeart },
]

type Props = {
    targetType: 'discussion' | 'reply'
    targetId: string
    minhasReacoes: ReactionKind[]
}

export default function ReactionBar({ targetType, targetId, minhasReacoes }: Props) {
    const [, startTransition] = useTransition()
    const [ativas, alternar] = useOptimistic(
        minhasReacoes,
        (atual: ReactionKind[], kind: ReactionKind) =>
            atual.includes(kind) ? atual.filter((k) => k !== kind) : [...atual, kind]
    )

    return (
        <div className="flex flex-wrap gap-2">
            {REACOES.map(({ kind, label, Icon }) => {
                const ativa = ativas.includes(kind)
                return (
                    <button
                        key={kind}
                        type="button"
                        // A ação é otimista: a reação acende na hora e o servidor
                        // confirma depois. Esperar o round-trip para um clique
                        // desses faz a conversa parecer travada.
                        onClick={() => startTransition(async () => {
                            alternar(kind)
                            await toggleReaction(targetType, targetId, kind)
                        })}
                        aria-pressed={ativa}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
                            ativa
                                ? 'bg-amber-100 border-amber-300 text-amber-900'
                                : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
                        }`}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                )
            })}
        </div>
    )
}
