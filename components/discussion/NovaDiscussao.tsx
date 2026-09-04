'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDiscussion, type AnchorType } from '@/actions/discussion'
import { Loader2, Plus } from 'lucide-react'

type Tribo = { id: string; name: string }

type Props = {
    anchorType: AnchorType
    anchorRef: string
    tribos: Tribo[]
}

export default function NovaDiscussao({ anchorType, anchorRef, tribos }: Props) {
    const [aberto, setAberto] = useState(false)
    const [titulo, setTitulo] = useState('')
    const [corpo, setCorpo] = useState('')
    const [pergunta, setPergunta] = useState(false)
    const [triboId, setTriboId] = useState<string>(tribos[0]?.id ?? '')
    const [erro, setErro] = useState<string | null>(null)
    const [enviando, iniciar] = useTransition()
    const router = useRouter()

    // Sem tribo não há onde a discussão nascer. O acervo público recebe
    // estudos publicados, não temas abertos direto — é isso que evita a
    // praça pública onde a maioria decide doutrina.
    if (tribos.length === 0) {
        return (
            <p className="rounded-lg border border-dashed border-stone-300 p-4 text-center text-sm text-stone-500">
                Você precisa estar em uma tribo para abrir uma discussão.{' '}
                <a href="/discipulado" className="font-bold text-amber-700 hover:underline">
                    Entrar em uma tribo
                </a>
            </p>
        )
    }

    if (!aberto) {
        return (
            <button
                type="button"
                onClick={() => setAberto(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 py-3 text-sm font-bold text-stone-600 hover:border-amber-400 hover:text-amber-800"
            >
                <Plus size={16} /> Abrir discussão sobre esta passagem
            </button>
        )
    }

    const enviar = () => {
        iniciar(async () => {
            const r = await createDiscussion({
                tribeId: triboId,
                anchorType,
                anchorRef,
                title: titulo,
                body: corpo,
                isQuestion: pergunta,
            })
            if (!r.success) {
                setErro(r.message ?? 'Não foi possível abrir a discussão.')
                return
            }
            router.push(`/discussao/${r.id}`)
        })
    }

    return (
        <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
            <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Qual é o tema?"
                className="w-full rounded-lg border border-stone-200 p-2.5 text-sm font-bold focus:border-amber-400 focus:outline-none"
            />
            <textarea
                value={corpo}
                onChange={(e) => setCorpo(e.target.value)}
                rows={4}
                placeholder="O que você viu neste texto?"
                className="w-full rounded-lg border border-stone-200 p-3 font-serif text-sm focus:border-amber-400 focus:outline-none"
            />

            <div className="flex flex-wrap items-center gap-3">
                {tribos.length > 1 && (
                    <select
                        value={triboId}
                        onChange={(e) => setTriboId(e.target.value)}
                        className="rounded-lg border border-stone-200 p-2 text-xs"
                    >
                        {tribos.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                )}

                <label className="flex items-center gap-1.5 text-xs text-stone-600">
                    <input type="checkbox" checked={pergunta} onChange={(e) => setPergunta(e.target.checked)} />
                    É uma pergunta
                </label>

                <button
                    type="button"
                    onClick={enviar}
                    disabled={enviando || titulo.trim().length < 3 || !corpo.trim()}
                    className="ml-auto flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-40"
                >
                    {enviando && <Loader2 size={15} className="animate-spin" />}
                    Publicar
                </button>
                <button
                    type="button"
                    onClick={() => setAberto(false)}
                    className="text-xs text-stone-400 hover:text-stone-700"
                >
                    Cancelar
                </button>
            </div>

            {erro && <p className="text-xs text-red-600">{erro}</p>}
        </div>
    )
}
