'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, Square, Loader2, Volume2 } from 'lucide-react'
import { lerConfigAudio } from '@/lib/audio/config'
import { falar, suportado as suportaNavegador, type ControleDeFala } from '@/lib/audio/motor-navegador'
import { gerarAudio } from '@/lib/audio/motor-neural'
import { tornarAtivo, encerrarSeAtivo } from '@/lib/audio/coordenador'

type Estado = 'parado' | 'carregando' | 'tocando' | 'pausado' | 'erro'

export default function BotaoOuvir({
    texto,
    rotulo = 'Ouvir',
    compacto = false,
}: {
    texto: string
    rotulo?: string
    compacto?: boolean
}) {
    const [estado, setEstado] = useState<Estado>('parado')
    const [progresso, setProgresso] = useState<string | null>(null)
    const controleFala = useRef<ControleDeFala | null>(null)
    const elementoAudio = useRef<HTMLAudioElement | null>(null)

    // Identidade estável entre renders: o coordenador compara por referência
    // para saber "quem é o player ativo agora". A implementação em si fica
    // num ref, atualizada num effect (nunca durante o render).
    const pararImpl = useRef<() => void>(() => {})
    const parar = useCallback(() => pararImpl.current(), [])

    useEffect(() => {
        pararImpl.current = () => {
            controleFala.current?.parar()
            controleFala.current = null
            elementoAudio.current?.pause()
            if (elementoAudio.current) elementoAudio.current.currentTime = 0
            setEstado('parado')
            setProgresso(null)
            encerrarSeAtivo(parar)
        }
    }, [parar])

    // Sair da tela com o áudio tocando em segundo plano confunde mais do que
    // ajuda — para tudo ao desmontar.
    useEffect(() => {
        return () => {
            controleFala.current?.parar()
            elementoAudio.current?.pause()
            encerrarSeAtivo(parar)
        }
    }, [parar])

    const tocar = async () => {
        // Derruba quem estiver tocando agora (outro versículo, o capítulo
        // inteiro, etc.) antes de começar — dois players ativos ao mesmo
        // tempo é o que deixava o estado dos botões inconsistente.
        tornarAtivo(parar)

        const config = lerConfigAudio()
        setEstado('carregando')

        if (config.motor === 'navegador') {
            if (!suportaNavegador()) {
                setEstado('erro')
                return
            }
            controleFala.current = falar(
                texto,
                { voiceURI: config.vozNavegador || undefined, rate: config.velocidade },
                {
                    aoTerminar: () => setEstado('parado'),
                    aoErrar: () => setEstado('erro'),
                }
            )
            setEstado('tocando')
            return
        }

        // Motor neural: gera (baixando o modelo na primeira vez, com
        // progresso) e toca como um <audio> comum.
        try {
            const blob = await gerarAudio(texto, config.vozNeural, (p) => {
                if (p.total > 0) {
                    setProgresso(`Baixando voz — ${Math.round((p.loaded * 100) / p.total)}%`)
                }
            })
            setProgresso(null)
            const audio = new Audio(URL.createObjectURL(blob))
            audio.playbackRate = config.velocidade
            audio.onended = () => setEstado('parado')
            audio.onerror = () => setEstado('erro')
            elementoAudio.current = audio
            await audio.play()
            setEstado('tocando')
        } catch (e) {
            console.error('[BotaoOuvir] motor neural', e)
            setEstado('erro')
            setProgresso(null)
        }
    }

    const pausar = () => {
        controleFala.current?.pausar()
        elementoAudio.current?.pause()
        setEstado('pausado')
    }

    const retomar = () => {
        controleFala.current?.retomar()
        elementoAudio.current?.play()
        setEstado('tocando')
    }

    const aoClicarPrincipal = () => {
        if (estado === 'parado' || estado === 'erro') tocar()
        else if (estado === 'tocando') pausar()
        else if (estado === 'pausado') retomar()
    }

    if (!texto.trim()) return null

    const tamanhoIcone = compacto ? 14 : 18

    return (
        <span className={`inline-flex items-center gap-1.5 ${compacto ? '' : 'rounded-lg border border-stone-200 bg-white px-3 py-2'}`}>
            <button
                type="button"
                onClick={aoClicarPrincipal}
                disabled={estado === 'carregando'}
                title={estado === 'tocando' ? 'Pausar' : estado === 'pausado' ? 'Continuar' : rotulo}
                className={`flex items-center gap-1.5 font-bold text-stone-600 hover:text-amber-700 disabled:opacity-50 ${compacto ? 'text-xs' : 'text-sm'}`}
            >
                {estado === 'carregando' ? (
                    <Loader2 size={tamanhoIcone} className="animate-spin" />
                ) : estado === 'tocando' ? (
                    <Pause size={tamanhoIcone} />
                ) : estado === 'pausado' ? (
                    <Play size={tamanhoIcone} />
                ) : (
                    <Volume2 size={tamanhoIcone} />
                )}
                {!compacto && (progresso ?? (estado === 'erro' ? 'Não foi possível ouvir' : rotulo))}
            </button>

            {(estado === 'tocando' || estado === 'pausado') && (
                <button type="button" onClick={parar} title="Parar" className="text-stone-400 hover:text-red-500">
                    <Square size={tamanhoIcone - 4} />
                </button>
            )}
        </span>
    )
}
