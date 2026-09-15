'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { resolverDenuncia, type Denuncia, type AcaoDeModeracao } from '@/actions/moderation'
import { EyeOff, Check, Archive, ExternalLink, Loader2, ShieldCheck } from 'lucide-react'

const ACOES: { acao: AcaoDeModeracao; rotulo: string; Icon: typeof Check; classe: string; confirma?: string }[] = [
    {
        acao: 'ignorar',
        rotulo: 'Sem problema',
        Icon: Check,
        classe: 'border-stone-200 text-stone-600 hover:border-stone-400',
    },
    {
        acao: 'ocultar',
        rotulo: 'Ocultar',
        Icon: EyeOff,
        classe: 'border-red-200 text-red-700 hover:border-red-400',
        confirma: 'Ocultar este conteúdo da tribo?',
    },
    {
        acao: 'arquivar',
        rotulo: 'Arquivar discussão',
        Icon: Archive,
        classe: 'border-amber-200 text-amber-700 hover:border-amber-400',
        confirma: 'Arquivar a discussão inteira? Ela para de aceitar respostas.',
    },
]

export default function FilaDeDenuncias({ denuncias }: { denuncias: Denuncia[] }) {
    const [erro, setErro] = useState<string | null>(null)
    const [emAndamento, setEmAndamento] = useState<string | null>(null)
    const [, iniciar] = useTransition()
    const router = useRouter()

    const resolver = (d: Denuncia, acao: AcaoDeModeracao, confirma?: string) => {
        if (confirma && !window.confirm(confirma)) return
        setErro(null)
        setEmAndamento(d.id)
        iniciar(async () => {
            const r = await resolverDenuncia(d.id, acao)
            setEmAndamento(null)
            if (!r.success) {
                setErro(r.message ?? 'Não foi possível resolver.')
                return
            }
            router.refresh()
        })
    }

    if (denuncias.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center">
                <ShieldCheck className="mx-auto mb-2 text-stone-300" size={30} />
                <p className="text-sm text-stone-500">Nenhuma denúncia pendente na sua tribo.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {denuncias.map((d) => (
                <article key={d.id} className="rounded-xl border border-stone-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 font-bold text-stone-600">
                            {d.tribe_name}
                        </span>
                        <span>{d.target_type === 'discussion' ? 'Discussão' : 'Resposta'}</span>
                        <span>de @{d.autor_username ?? '—'}</span>
                        <time dateTime={d.created_at}>
                            {new Date(d.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                            })}
                        </time>
                        {d.ja_oculto && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-700">
                                já oculto
                            </span>
                        )}
                    </div>

                    <p className="mt-3 rounded-lg bg-stone-50 p-3 font-serif text-sm text-stone-700">
                        {d.conteudo}
                    </p>

                    <p className="mt-3 text-sm text-stone-600">
                        <span className="font-bold">@{d.reporter_username ?? 'alguém'} relatou:</span>{' '}
                        {d.reason}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                        {ACOES.map(({ acao, rotulo, Icon, classe, confirma }) => (
                            <button
                                key={acao}
                                type="button"
                                disabled={emAndamento === d.id}
                                onClick={() => resolver(d, acao, confirma)}
                                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 ${classe}`}
                            >
                                {emAndamento === d.id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                ) : (
                                    <Icon size={13} />
                                )}
                                {rotulo}
                            </button>
                        ))}

                        {d.discussion_id && (
                            <Link
                                href={`/discussao/${d.discussion_id}`}
                                className="ml-auto flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700"
                            >
                                Ver no contexto <ExternalLink size={12} />
                            </Link>
                        )}
                    </div>
                </article>
            ))}

            {erro && <p className="text-xs text-red-600">{erro}</p>}
        </div>
    )
}
