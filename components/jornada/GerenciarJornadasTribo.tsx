'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import CriarJornadaForm from './CriarJornadaForm'
import type { TriboLiderada, ProgressoMembro } from '@/actions/jornadas-tribo'
import type { BibleBook } from '@/services/bibleService'

type Props = {
    tribos: TriboLiderada[]
    triboSelecionadaId: string
    progresso: ProgressoMembro[]
    livros: BibleBook[]
}

export default function GerenciarJornadasTribo({ tribos, triboSelecionadaId, progresso, livros }: Props) {
    const [criando, setCriando] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    // Agrupa o retorno "uma linha por (jornada, membro)" em uma tabela por jornada.
    const porJornada = new Map<string, { titulo: string; diasTotais: number; membros: ProgressoMembro[] }>()
    for (const linha of progresso) {
        if (!porJornada.has(linha.jornada_id)) {
            porJornada.set(linha.jornada_id, { titulo: linha.jornada_titulo, diasTotais: linha.jornada_dias_totais, membros: [] })
        }
        porJornada.get(linha.jornada_id)!.membros.push(linha)
    }

    return (
        <div className="space-y-6">
            {tribos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                    {tribos.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => router.push(`${pathname}?tribo=${t.id}`)}
                            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                                t.id === triboSelecionadaId ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                            }`}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>
            )}

            {criando ? (
                <CriarJornadaForm
                    livros={livros}
                    tribeId={triboSelecionadaId}
                    aoCriar={() => { setCriando(false); router.refresh() }}
                    aoCancelar={() => setCriando(false)}
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setCriando(true)}
                    className="flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 text-sm font-bold hover:bg-amber-700"
                >
                    <Plus size={16} /> Nova jornada para a tribo
                </button>
            )}

            <div className="space-y-4">
                {porJornada.size === 0 && (
                    <p className="text-sm text-stone-500">Esta tribo ainda não tem jornadas próprias.</p>
                )}

                {Array.from(porJornada.entries()).map(([jornadaId, info]) => (
                    <div key={jornadaId} className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                            <h3 className="font-bold text-stone-800">{info.titulo}</h3>
                            <span className="text-xs text-stone-400">{info.diasTotais} dias</span>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-stone-400 border-b border-stone-100">
                                    <th className="px-4 py-2 font-bold">Discípulo</th>
                                    <th className="px-4 py-2 font-bold">Dia Atual</th>
                                    <th className="px-4 py-2 font-bold">Dias Concluídos</th>
                                    <th className="px-4 py-2 font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {info.membros.map((m) => (
                                    <tr key={m.membro_id} className="border-b border-stone-50 last:border-0">
                                        <td className="px-4 py-2 flex items-center gap-1.5">
                                            <Users size={14} className="text-stone-300" />
                                            {m.membro_username ?? '—'}
                                        </td>
                                        <td className="px-4 py-2 text-stone-600">{m.dia_atual ?? '—'}</td>
                                        <td className="px-4 py-2 text-stone-600">{m.dias_completados}</td>
                                        <td className="px-4 py-2">
                                            {m.dia_atual === null ? (
                                                <span className="text-xs text-stone-400">Não começou</span>
                                            ) : m.is_completed ? (
                                                <span className="text-xs text-green-600 font-bold">Concluída</span>
                                            ) : (
                                                <span className="text-xs text-amber-600 font-bold">Em andamento</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    )
}
