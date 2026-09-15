'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { publishStudy } from '@/actions/discussion'
import { Share2, Loader2, CheckCircle2 } from 'lucide-react'

type Props = {
    studyId: string
    /** Id da discussão, quando este estudo já está no acervo. */
    publicadoComoId?: string | null
    compacto?: boolean
}

/**
 * Leva o estudo privado para o acervo público.
 *
 * Publicar é, na prática, irreversível para quem já leu e respondeu — por
 * isso confirma antes, e depois some, dando lugar ao link da discussão.
 */
export default function PublicarEstudo({ studyId, publicadoComoId, compacto }: Props) {
    const [erro, setErro] = useState<string | null>(null)
    const [enviando, iniciar] = useTransition()
    const router = useRouter()

    if (publicadoComoId) {
        return (
            <Link
                href={`/discussao/${publicadoComoId}`}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
            >
                <CheckCircle2 size={13} /> No acervo
            </Link>
        )
    }

    const publicar = () => {
        if (!window.confirm(
            'Publicar este estudo no acervo público? Outras pessoas poderão ler e responder.'
        )) return

        setErro(null)
        iniciar(async () => {
            const r = await publishStudy(studyId)
            if (!r.success) {
                setErro(r.message ?? 'Não foi possível publicar.')
                return
            }
            router.push(`/discussao/${r.id}`)
        })
    }

    return (
        <div className={compacto ? '' : 'space-y-1'}>
            <button
                type="button"
                onClick={publicar}
                disabled={enviando}
                className={
                    compacto
                        ? 'flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-amber-700 disabled:opacity-40'
                        : 'flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700 hover:border-amber-400 hover:text-amber-800 disabled:opacity-40'
                }
            >
                {enviando ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                Publicar no acervo
            </button>
            {erro && <p className="text-xs text-red-600">{erro}</p>}
        </div>
    )
}
