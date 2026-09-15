'use client'

import { useState } from 'react'
import { Settings, X } from 'lucide-react'
import type { AgenteConfig } from '@/lib/agente/config'
import { PROMPT_PADRAO } from '@/lib/agente/prompt-padrao'

export default function ConfiguracaoAgente({
    config,
    aoSalvar,
}: {
    config: AgenteConfig
    aoSalvar: (config: AgenteConfig) => void
}) {
    const [aberto, setAberto] = useState(false)
    const [rascunho, setRascunho] = useState(config)

    const abrir = () => {
        setRascunho(config)
        setAberto(true)
    }

    const salvar = () => {
        aoSalvar(rascunho)
        setAberto(false)
    }

    if (!aberto) {
        return (
            <button
                type="button"
                onClick={abrir}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-600 hover:border-amber-400"
            >
                <Settings size={14} /> Configurar
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-stone-800">Configurar Agente</h2>
                    <button type="button" onClick={() => setAberto(false)} className="text-stone-400 hover:text-stone-600">
                        <X size={18} />
                    </button>
                </div>

                <p className="text-xs text-stone-500">
                    Sua chave de API fica só neste navegador (localStorage) — nunca é enviada ao
                    servidor do Koinonia. As chamadas ao modelo saem direto daqui para a URL abaixo.
                </p>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 mb-1">Chave de API</label>
                        <input
                            type="password"
                            value={rascunho.apiKey}
                            onChange={(e) => setRascunho({ ...rascunho, apiKey: e.target.value })}
                            placeholder="sk-..."
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-500 mb-1">URL base (compatível com OpenAI)</label>
                        <input
                            value={rascunho.baseUrl}
                            onChange={(e) => setRascunho({ ...rascunho, baseUrl: e.target.value })}
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-500 mb-1">Modelo</label>
                        <input
                            value={rascunho.model}
                            onChange={(e) => setRascunho({ ...rascunho, model: e.target.value })}
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-mono"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-stone-500">Prompt do sistema</label>
                            <button
                                type="button"
                                onClick={() => setRascunho({ ...rascunho, systemPrompt: PROMPT_PADRAO })}
                                className="text-[10px] font-bold text-amber-600 hover:underline"
                            >
                                Restaurar padrão
                            </button>
                        </div>
                        <textarea
                            value={rascunho.systemPrompt}
                            onChange={(e) => setRascunho({ ...rascunho, systemPrompt: e.target.value })}
                            rows={8}
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs font-mono resize-none"
                        />
                    </div>
                </div>

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
                        onClick={salvar}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-600 text-white hover:bg-amber-700"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    )
}
