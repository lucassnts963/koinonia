/**
 * Motor A — Web Speech API do próprio navegador. Zero download, zero
 * processamento no aparelho além da síntese que o navegador já faz nativamente
 * (geralmente delegada ao sistema operacional). Funciona hoje, sem mudar nada
 * de infraestrutura.
 *
 * Textos longos (um capítulo inteiro) são fatiados em frases e falados em
 * fila: o Chrome tem um bug antigo de `pause()`/`resume()` travar quando o
 * texto de UM utterance é muito longo — falar frase por frase evita isso e
 * de quebra deixa parar/retomar previsível em qualquer ponto do capítulo.
 */

export function vozesDisponiveis(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return []
    return window.speechSynthesis.getVoices()
}

export function vozesPtBR(): SpeechSynthesisVoice[] {
    return vozesDisponiveis().filter((v) => v.lang.toLowerCase().startsWith('pt'))
}

/** As vozes só ficam disponíveis depois do evento `voiceschanged` em vários navegadores. */
export function aoCarregarVozes(callback: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return () => {}
    window.speechSynthesis.addEventListener('voiceschanged', callback)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', callback)
}

function dividirEmFrases(texto: string): string[] {
    return texto
        .split(/(?<=[.!?;:\n])\s+/)
        .map((f) => f.trim())
        .filter(Boolean)
}

export type ControleDeFala = {
    pausar: () => void
    retomar: () => void
    parar: () => void
}

export function suportado(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function falar(
    texto: string,
    opcoes: { voiceURI?: string; rate?: number },
    eventos: { aoTerminar: () => void; aoErrar?: (erro: string) => void }
): ControleDeFala {
    // Sem isto, um pause() anterior (deste texto ou de qualquer outro botão
    // na página) deixa o motor inteiro num estado pausado global: speak()
    // novo é enfileirado e nunca toca até um resume() — o "áudio não sai"
    // relatado ao trocar de versículo depois de pausar.
    window.speechSynthesis.cancel()

    const frases = dividirEmFrases(texto)
    const vozes = vozesDisponiveis()
    const voz =
        (opcoes.voiceURI && vozes.find((v) => v.voiceURI === opcoes.voiceURI)) ||
        vozes.find((v) => v.lang.toLowerCase().startsWith('pt')) ||
        null

    let indice = 0
    let parado = false

    function falarProxima() {
        if (parado) return
        if (indice >= frases.length) {
            eventos.aoTerminar()
            return
        }
        const utterance = new SpeechSynthesisUtterance(frases[indice])
        if (voz) utterance.voice = voz
        utterance.lang = voz?.lang ?? 'pt-BR'
        utterance.rate = opcoes.rate ?? 1
        utterance.onend = () => {
            indice++
            falarProxima()
        }
        utterance.onerror = (e) => {
            // "interrupted"/"canceled" são o resultado esperado de parar() —
            // não é erro de verdade, só o motor confirmando que obedeceu.
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
                eventos.aoErrar?.(e.error)
            }
        }
        window.speechSynthesis.speak(utterance)
    }

    // Chrome trata cancel() como assíncrono por baixo dos panos: falar()
    // logo em seguida, no mesmo tick, às vezes some sem erro nenhum. Um
    // delay mínimo dá tempo do motor terminar de cancelar de verdade.
    setTimeout(falarProxima, 50)

    return {
        pausar: () => window.speechSynthesis.pause(),
        retomar: () => window.speechSynthesis.resume(),
        parar: () => {
            parado = true
            window.speechSynthesis.cancel()
        },
    }
}
