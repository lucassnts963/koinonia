'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { criarJornada, startPlan } from '@/actions/plans'
import type { BibleBook } from '@/services/bibleService'
import { X } from 'lucide-react'

type Props = {
    livros: BibleBook[]
    tribeId?: string
    /** Depois de criar, entra na jornada automaticamente (uso pessoal). Jornada de tribo não entra sozinha — cada membro decide. */
    iniciarAoCriar?: boolean
    aoCriar?: () => void
    aoCancelar: () => void
}

export default function CriarJornadaForm({ livros, tribeId, iniciarAoCriar, aoCriar, aoCancelar }: Props) {
    const [titulo, setTitulo] = useState('')
    const [descricao, setDescricao] = useState('')
    const [dias, setDias] = useState(30)
    const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
    const [erro, setErro] = useState<string | null>(null)
    const [pendente, iniciar] = useTransition()
    const router = useRouter()

    const alternar = (id: number) => {
        setSelecionados((prev) => {
            const novo = new Set(prev)
            if (novo.has(id)) novo.delete(id)
            else novo.add(id)
            return novo
        })
    }

    const submeter = () => {
        setErro(null)
        iniciar(async () => {
            const resultado = await criarJornada({
                titulo,
                descricao,
                livros: Array.from(selecionados),
                dias,
                tribeId,
            })

            if (!resultado.success) {
                setErro(resultado.message)
                return
            }

            if (iniciarAoCriar && resultado.planId) {
                await startPlan(resultado.planId)
            }

            aoCriar?.()
            router.refresh()
        })
    }

    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-800">Nova Jornada</h3>
                <button type="button" onClick={aoCancelar} className="text-stone-400 hover:text-stone-600">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">Título</label>
                    <input
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Ex: Sabedoria de Provérbios"
                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                        maxLength={100}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">Descrição (opcional)</label>
                    <input
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                        maxLength={200}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">Duração (dias)</label>
                    <input
                        type="number"
                        min={1}
                        max={366}
                        value={dias}
                        onChange={(e) => setDias(Number(e.target.value) || 1)}
                        className="w-24 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">
                        Livros ({selecionados.size} selecionados)
                    </label>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-stone-200 bg-white p-2 grid grid-cols-2 sm:grid-cols-3 gap-1">
                        {livros.map((livro) => (
                            <button
                                key={livro.id}
                                type="button"
                                onClick={() => alternar(livro.id)}
                                className={`text-left text-xs px-2 py-1 rounded ${
                                    selecionados.has(livro.id)
                                        ? 'bg-amber-500 text-white'
                                        : 'hover:bg-stone-100 text-stone-600'
                                }`}
                            >
                                {livro.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {erro && <p className="text-xs text-red-600 font-bold">{erro}</p>}

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={aoCancelar}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-stone-500 hover:bg-stone-100"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={submeter}
                    disabled={pendente || !titulo.trim() || selecionados.size === 0}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40"
                >
                    {pendente ? 'Criando...' : 'Criar Jornada'}
                </button>
            </div>
        </div>
    )
}
