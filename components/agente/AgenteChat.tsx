'use client'

import { useEffect, useState, useRef } from 'react'
import { Send, Loader2, Copy, Check, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { lerConfig, salvarConfig, type AgenteConfig } from '@/lib/agente/config'
import { perguntarAoAgente, type Mensagem } from '@/lib/agente/executor'
import ConfiguracaoAgente from './ConfiguracaoAgente'

export default function AgenteChat() {
    const [config, setConfig] = useState<AgenteConfig | null>(null)
    const [historico, setHistorico] = useState<Mensagem[]>([])
    const [pergunta, setPergunta] = useState('')
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const fimRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Mesma técnica de AparenciaLeitura.tsx: localStorage não existe no
        // servidor, então ler direto no useState inicial produziria uma
        // hidratação divergente. O microtask empurra para depois dela.
        queueMicrotask(() => setConfig(lerConfig()))
    }, [])

    useEffect(() => {
        fimRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [historico])

    const visiveis = historico.filter((m) => m.role === 'user' || (m.role === 'assistant' && !m.tool_calls))

    const enviar = async () => {
        if (!config || !pergunta.trim() || carregando) return
        setErro(null)

        const baseHistorico: Mensagem[] = historico.length === 0
            ? [{ role: 'system', content: config.systemPrompt }]
            : historico

        const proximo: Mensagem[] = [...baseHistorico, { role: 'user', content: pergunta.trim() }]
        setHistorico(proximo)
        setPergunta('')
        setCarregando(true)

        try {
            const resultado = await perguntarAoAgente(config, proximo)
            setHistorico(resultado)
        } catch (e) {
            setErro(e instanceof Error ? e.message : 'Erro inesperado ao falar com o agente.')
        } finally {
            setCarregando(false)
        }
    }

    if (!config) return null

    const semChave = !config.apiKey.trim()

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <p className="text-xs text-stone-500">
                    Só lê: versículos, verbetes, seus estudos e notas, e o acervo público.
                    Não salva nada — o que ele sugerir, você copia e guarda você mesmo.
                </p>
                <ConfiguracaoAgente config={config} aoSalvar={(c) => { salvarConfig(c); setConfig(c) }} />
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {semChave && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                        Configure sua chave de API (botão &quot;Configurar&quot; acima) para começar a conversar.
                    </div>
                )}

                {visiveis.map((m, i) => (
                    <MensagemBolha key={i} mensagem={m} />
                ))}

                {carregando && (
                    <div className="flex items-center gap-2 text-stone-400 text-sm">
                        <Loader2 size={14} className="animate-spin" /> Buscando e pensando...
                    </div>
                )}

                {erro && <p className="text-sm text-red-600 font-bold">{erro}</p>}

                <div ref={fimRef} />
            </div>

            <div className="flex gap-2 pt-3 border-t border-stone-200">
                <input
                    value={pergunta}
                    onChange={(e) => setPergunta(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
                    placeholder={semChave ? 'Configure sua chave de API primeiro...' : 'Pergunte sobre um versículo, tema, ou peça para buscar seus estudos...'}
                    disabled={semChave || carregando}
                    className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:opacity-50"
                />
                <button
                    type="button"
                    onClick={enviar}
                    disabled={semChave || carregando || !pergunta.trim()}
                    className="rounded-lg bg-amber-600 text-white px-4 py-2 hover:bg-amber-700 disabled:opacity-40"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    )
}

function MensagemBolha({ mensagem }: { mensagem: Mensagem }) {
    const [copiado, setCopiado] = useState(false)
    const ehUsuario = mensagem.role === 'user'

    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(mensagem.content)
            setCopiado(true)
            setTimeout(() => setCopiado(false), 1500)
        } catch {
            // clipboard pode falhar (permissão, contexto não seguro) — sem drama, a pessoa seleciona o texto manualmente
        }
    }

    return (
        <div className={`flex gap-2 ${ehUsuario ? 'justify-end' : 'justify-start'}`}>
            {!ehUsuario && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                    <Bot size={14} className="text-amber-600" />
                </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-4 py-2.5 ${ehUsuario ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200'}`}>
                <div className={`text-sm prose prose-sm max-w-none ${ehUsuario ? 'prose-invert' : 'prose-stone'}`}>
                    <ReactMarkdown>{mensagem.content}</ReactMarkdown>
                </div>
                {!ehUsuario && mensagem.content && (
                    <button
                        type="button"
                        onClick={copiar}
                        className="mt-2 flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-amber-600"
                    >
                        {copiado ? <Check size={11} /> : <Copy size={11} />}
                        {copiado ? 'Copiado' : 'Copiar para salvar como nota ou estudo'}
                    </button>
                )}
            </div>
            {ehUsuario && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center">
                    <User size={14} className="text-stone-500" />
                </div>
            )}
        </div>
    )
}
