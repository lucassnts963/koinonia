'use client'

import { useState } from 'react'
import { joinTribeAction } from '@/actions/tribe'
import { UserPlus, Loader2 } from 'lucide-react'

export default function JoinTribeForm() {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code) return
        setLoading(true)

        const res = await joinTribeAction(code)
        alert(res.message) // Pode substituir por um Toast depois

        setLoading(false)
        if (res.success) setCode('')
    }

    return (
        <form onSubmit={handleJoin} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm mt-4">
            <h3 className="font-bold text-stone-700 mb-2 flex items-center gap-2">
                <UserPlus size={18} className="text-amber-600" />
                Buscar Cobertura
            </h3>
            <p className="text-xs text-stone-500 mb-3">Insira o "Nome de Usuário" do seu líder para entrar na tribo dele.</p>

            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Ex: joao.silva"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                    disabled={loading}
                    className="bg-stone-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-stone-800 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Entrar'}
                </button>
            </div>
        </form>
    )
}