'use client'

import { useEffect, useState } from 'react'
import { Volume2, AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import {
    lerConfigAudio,
    salvarConfigAudio,
    VOZES_NEURAIS,
    type ConfigAudio,
    type MotorDeAudio,
    type VozNeuralId,
} from '@/lib/audio/config'
import { vozesPtBR, aoCarregarVozes, suportado as suportaNavegador } from '@/lib/audio/motor-navegador'
import { tamanhoDoModelo, modelosJaBaixados, removerModeloBaixado, formatarBytes } from '@/lib/audio/motor-neural'

export default function ConfiguracaoAudio() {
    const [config, setConfig] = useState<ConfigAudio | null>(null)
    const [vozesNavegador, setVozesNavegador] = useState<SpeechSynthesisVoice[]>([])
    const [tamanhos, setTamanhos] = useState<Record<string, number | null>>({})
    const [baixados, setBaixados] = useState<string[]>([])
    const [removendo, setRemovendo] = useState<string | null>(null)

    useEffect(() => {
        // Mesma técnica de AparenciaLeitura.tsx: localStorage só existe no
        // navegador, então lê depois da hidratação, não no useState inicial.
        queueMicrotask(() => setConfig(lerConfigAudio()))
        setVozesNavegador(vozesPtBR())
        return aoCarregarVozes(() => setVozesNavegador(vozesPtBR()))
    }, [])

    useEffect(() => {
        if (config?.motor !== 'neural') return
        modelosJaBaixados().then(setBaixados)
        VOZES_NEURAIS.forEach(({ id }) => {
            if (tamanhos[id] !== undefined) return
            tamanhoDoModelo(id).then((bytes) => setTamanhos((prev) => ({ ...prev, [id]: bytes })))
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config?.motor])

    if (!config) return null

    const atualizar = (novo: Partial<ConfigAudio>) => {
        const proximo = { ...config, ...novo }
        setConfig(proximo)
        salvarConfigAudio(proximo)
    }

    const escolherMotor = (motor: MotorDeAudio) => atualizar({ motor })

    const remover = async (id: VozNeuralId) => {
        setRemovendo(id)
        await removerModeloBaixado(id)
        setBaixados(await modelosJaBaixados())
        setRemovendo(null)
    }

    return (
        <section className="rounded-xl border border-stone-200 bg-white p-6 space-y-4">
            <h3 className="flex items-center gap-2 font-bold text-stone-800">
                <Volume2 size={18} /> Leitura em Áudio
            </h3>

            <div className="space-y-2">
                <button
                    type="button"
                    onClick={() => escolherMotor('navegador')}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${config.motor === 'navegador' ? 'border-amber-400 bg-amber-50' : 'border-stone-200 hover:border-stone-300'}`}
                >
                    <p className="text-sm font-bold text-stone-800">Voz do navegador (padrão)</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                        Usa a síntese de voz já embutida no seu navegador/aparelho. Sem download, sem processamento
                        extra — funciona na hora, com a qualidade que o seu navegador já oferece.
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => escolherMotor('neural')}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${config.motor === 'neural' ? 'border-amber-400 bg-amber-50' : 'border-stone-200 hover:border-stone-300'}`}
                >
                    <p className="text-sm font-bold text-stone-800">Voz neural (melhor qualidade)</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                        Modelo de voz baixado e executado no seu próprio aparelho — mais natural, mas exige baixar
                        um arquivo e processar no seu dispositivo.
                    </p>
                </button>
            </div>

            {config.motor === 'navegador' && (
                <div className="space-y-3 pt-2 border-t border-stone-100">
                    {!suportaNavegador() ? (
                        <p className="text-xs text-red-600">Seu navegador não tem suporte a síntese de voz.</p>
                    ) : vozesNavegador.length === 0 ? (
                        <p className="text-xs text-stone-500">
                            Nenhuma voz em português encontrada neste navegador. A leitura pode sair em outro idioma.
                        </p>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-stone-500 mb-1">Voz</label>
                            <select
                                value={config.vozNavegador}
                                onChange={(e) => atualizar({ vozNavegador: e.target.value })}
                                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                            >
                                <option value="">Automática</option>
                                {vozesNavegador.map((v) => (
                                    <option key={v.voiceURI} value={v.voiceURI}>
                                        {v.name} ({v.lang})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {config.motor === 'neural' && (
                <div className="space-y-3 pt-2 border-t border-stone-100">
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                        <AlertTriangle size={28} className="shrink-0" />
                        <span>
                            A primeira vez que você ouvir algo com uma voz neural, o aparelho baixa o modelo
                            (dezenas de MB) e o guarda para as próximas vezes. A geração do áudio roda no seu
                            aparelho — em celulares mais fracos pode demorar alguns segundos antes de começar a
                            tocar.
                        </span>
                    </div>

                    <div className="space-y-2">
                        {VOZES_NEURAIS.map(({ id, rotulo }) => {
                            const tamanho = tamanhos[id]
                            const jaBaixado = baixados.includes(id)
                            return (
                                <label
                                    key={id}
                                    className={`flex items-center justify-between gap-2 rounded-lg border p-3 cursor-pointer ${config.vozNeural === id ? 'border-amber-400 bg-amber-50' : 'border-stone-200'}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="voz-neural"
                                            checked={config.vozNeural === id}
                                            onChange={() => atualizar({ vozNeural: id })}
                                        />
                                        <span className="text-sm text-stone-700">{rotulo}</span>
                                    </span>
                                    <span className="flex items-center gap-2 text-xs text-stone-400">
                                        {tamanho === undefined ? (
                                            <Loader2 size={12} className="animate-spin" />
                                        ) : tamanho ? (
                                            formatarBytes(tamanho)
                                        ) : (
                                            '~60 MB'
                                        )}
                                        {jaBaixado && <span className="text-green-600 font-bold">baixado</span>}
                                        {jaBaixado && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    remover(id)
                                                }}
                                                disabled={removendo === id}
                                                title="Remover do aparelho"
                                                className="text-stone-400 hover:text-red-500"
                                            >
                                                {removendo === id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                            </button>
                                        )}
                                    </span>
                                </label>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Velocidade da fala</span>
                    <span className="font-bold text-stone-700">{config.velocidade.toFixed(1)}x</span>
                </div>
                <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={config.velocidade}
                    onChange={(e) => atualizar({ velocidade: Number(e.target.value) })}
                    className="w-full"
                />
            </div>
        </section>
    )
}
