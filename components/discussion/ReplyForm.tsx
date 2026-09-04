'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addReply } from '@/actions/discussion'
import { CornerDownRight, Loader2 } from 'lucide-react'

type Props = {
    discussionId: string
    parentId?: string
    onDone?: () => void
    placeholder?: string
}

export default function ReplyForm({ discussionId, parentId, onDone, placeholder }: Props) {
    const [texto, setTexto] = useState('')
    const [erro, setErro] = useState<string | null>(null)
    const [ganho, setGanho] = useState<number | null>(null)
    const [enviando, iniciar] = useTransition()
    const router = useRouter()

    const enviar = () => {
        const corpo = texto.trim()
        if (!corpo) return

        iniciar(async () => {
            const r = await addReply(discussionId, corpo, parentId)
            if (!r.success) {
                setErro(r.message ?? 'Não foi possível responder.')
                return
            }
            // Só limpa depois do sucesso: se falhar, o texto continua na tela.
            setTexto('')
            setErro(null)
            setGanho(r.talentsGained ?? 0)
            onDone?.()
            router.refresh()
        })
    }

    return (
        <div className="space-y-2">
            <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={parentId ? 2 : 3}
                placeholder={placeholder ?? 'Escreva sua resposta...'}
                className="w-full rounded-lg border border-stone-200 p-3 text-sm font-serif focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-200"
            />

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={enviar}
                    disabled={enviando || !texto.trim()}
                    className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-40"
                >
                    {enviando ? <Loader2 size={15} className="animate-spin" /> : <CornerDownRight size={15} />}
                    Responder
                </button>

                {/* Talentos são creditados por PRODUZIR, com teto diário. Quando o
                    teto estoura o retorno é 0 — e dizer isso é melhor do que
                    deixar a pessoa achar que o botão quebrou. */}
                {ganho !== null && (
                    <span className="text-xs text-stone-500">
                        {ganho > 0 ? `+${ganho} Talentos` : 'Teto diário de Talentos atingido'}
                    </span>
                )}
                {erro && <span className="text-xs text-red-600">{erro}</span>}
            </div>
        </div>
    )
}
