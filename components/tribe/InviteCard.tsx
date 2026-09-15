'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

type Props = {
    /** Código de convite da tribo. É o que o convidado digita para entrar. */
    codigo: string
    nomeDaTribo?: string
}

export default function InviteCard({ codigo, nomeDaTribo }: Props) {
    const [copiado, setCopiado] = useState(false)

    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(codigo)
            setCopiado(true)
            setTimeout(() => setCopiado(false), 2000)
        } catch {
            // clipboard exige contexto seguro (https ou localhost) e permissão.
            // Falhar calado deixaria a pessoa clicando sem entender; o código
            // está visível na tela, então selecionar na mão resolve.
            setCopiado(false)
        }
    }

    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
            <h3 className="mb-1 font-bold text-amber-900">Convide para a tribo</h3>
            <p className="mb-4 text-sm text-stone-600">
                {nomeDaTribo
                    ? `Quem tiver este código entra em ${nomeDaTribo}.`
                    : 'Compartilhe este código com sua célula.'}
            </p>

            <button
                type="button"
                onClick={copiar}
                className="group flex w-full items-center justify-between rounded-lg border-2 border-dashed border-amber-300 bg-white p-3 transition-colors hover:border-amber-500"
            >
                <span className="ml-2 font-mono text-lg font-bold tracking-[0.3em] text-stone-700">
                    {codigo}
                </span>
                <span className="rounded bg-amber-100 p-2 text-amber-700 group-hover:bg-amber-200">
                    {copiado ? <Check size={18} /> : <Copy size={18} />}
                </span>
            </button>
            <p className="mt-2 text-[10px] text-amber-600/60">
                {copiado ? 'Copiado' : 'Toque para copiar'}
            </p>
        </div>
    )
}
