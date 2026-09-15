'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { proporVerbete } from '@/actions/dictionary'
import { Plus, X } from 'lucide-react'

export default function PropostaVerbeteForm({ termoInicial }: { termoInicial?: string }) {
    const [aberto, setAberto] = useState(false)
    const [term, setTerm] = useState(termoInicial ?? '')
    const [definition, setDefinition] = useState('')
    const [mensagem, setMensagem] = useState<{ ok: boolean; texto: string } | null>(null)
    const [pendente, iniciar] = useTransition()
    const router = useRouter()

    if (!aberto) {
        return (
            <button
                type="button"
                onClick={() => setAberto(true)}
                className="flex items-center gap-2 rounded-lg border-2 border-dashed border-stone-300 px-4 py-3 text-sm font-bold text-stone-400 hover:border-amber-400 hover:text-amber-600 transition-colors"
            >
                <Plus size={16} /> Propor um verbete
            </button>
        )
    }

    const submeter = () => {
        setMensagem(null)
        iniciar(async () => {
            const resultado = await proporVerbete({ term, definition })
            setMensagem({ ok: resultado.success, texto: resultado.message })
            if (resultado.success) {
                setTerm('')
                setDefinition('')
                router.refresh()
            }
        })
    }

    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-800">Propor Verbete</h3>
                <button type="button" onClick={() => setAberto(false)} className="text-stone-400 hover:text-stone-600">
                    <X size={18} />
                </button>
            </div>

            <div>
                <label className="block text-xs font-bold text-stone-500 mb-1">Termo</label>
                <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    maxLength={80}
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-stone-500 mb-1">Definição</label>
                <textarea
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm resize-none"
                    maxLength={2000}
                />
            </div>

            {mensagem && (
                <p className={`text-xs font-bold ${mensagem.ok ? 'text-green-600' : 'text-red-600'}`}>
                    {mensagem.texto}
                </p>
            )}

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={() => setAberto(false)}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-stone-500 hover:bg-stone-100"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={submeter}
                    disabled={pendente || term.trim().length < 2 || definition.trim().length < 10}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40"
                >
                    {pendente ? 'Enviando...' : 'Enviar para aprovação'}
                </button>
            </div>
        </div>
    )
}
