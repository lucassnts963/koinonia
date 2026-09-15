'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { definirPapelAction, type MembroDaTribo } from '@/actions/tribe'
import { Crown, Shield, UserRound, Medal } from 'lucide-react'

const ROTULO: Record<MembroDaTribo['role'], { texto: string; Icon: typeof Crown; cor: string }> = {
    leader: { texto: 'Líder', Icon: Crown, cor: 'bg-amber-100 text-amber-800' },
    shepherd: { texto: 'Pastor', Icon: Shield, cor: 'bg-emerald-100 text-emerald-800' },
    member: { texto: 'Membro', Icon: UserRound, cor: 'bg-stone-100 text-stone-600' },
}

type Props = {
    triboId: string
    membros: MembroDaTribo[]
    /** Só líder e pastor podem mudar papéis; o banco confirma de novo. */
    podeGerenciar: boolean
    meuId: string
    liderId: string
}

export default function MembrosList({ triboId, membros, podeGerenciar, meuId, liderId }: Props) {
    const [erro, setErro] = useState<string | null>(null)
    const [salvando, iniciar] = useTransition()
    const router = useRouter()

    const mudar = (usuarioId: string, papel: MembroDaTribo['role']) => {
        setErro(null)
        iniciar(async () => {
            const r = await definirPapelAction(triboId, usuarioId, papel)
            if (!r.success) {
                setErro(r.message ?? 'Não foi possível mudar o papel.')
                return
            }
            router.refresh()
        })
    }

    const ordenados = [...membros].sort((a, b) => {
        const peso = (p: MembroDaTribo['role']) => (p === 'leader' ? 0 : p === 'shepherd' ? 1 : 2)
        return peso(a.role) - peso(b.role)
    })

    return (
        <div className="space-y-2">
            {ordenados.map((m) => {
                const { texto, Icon, cor } = ROTULO[m.role]
                // O líder registrado na tribo não aparece com seletor: o banco
                // recusa rebaixá-lo, e oferecer a opção seria prometer algo que
                // vai falhar.
                const editavel = podeGerenciar && m.user_id !== liderId

                return (
                    <div
                        key={m.user_id}
                        className="flex items-center justify-between rounded-lg border border-stone-100 bg-white p-3"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${cor}`}>
                                <Icon size={14} />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-stone-700">
                                    {m.profile?.full_name || m.profile?.username || 'Membro'}
                                    {m.user_id === meuId && (
                                        <span className="ml-1 text-[10px] font-normal text-stone-400">(você)</span>
                                    )}
                                </p>
                                <p className="text-[10px] text-stone-400">
                                    @{m.profile?.username ?? '—'} · Estatura {m.profile?.stature_level ?? 1}
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                                {m.profile?.talents_balance ?? 0} <Medal size={11} />
                            </span>

                            {editavel ? (
                                <select
                                    value={m.role}
                                    disabled={salvando}
                                    onChange={(e) => mudar(m.user_id, e.target.value as MembroDaTribo['role'])}
                                    className="rounded border border-stone-200 px-1.5 py-1 text-[11px] disabled:opacity-50"
                                >
                                    <option value="member">Membro</option>
                                    <option value="shepherd">Pastor</option>
                                </select>
                            ) : (
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cor}`}>{texto}</span>
                            )}
                        </div>
                    </div>
                )
            })}

            {erro && <p className="text-xs text-red-600">{erro}</p>}
        </div>
    )
}
