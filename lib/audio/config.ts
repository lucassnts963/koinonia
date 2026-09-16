export type MotorDeAudio = 'navegador' | 'neural'

/**
 * Vozes pt-BR/pt-PT reais de @diffusionstudio/vits-web (modelos Piper),
 * confirmadas no VoiceId do pacote — não inventadas. "low" é bem mais leve
 * e rápida; "medium" tem qualidade melhor, arquivo maior.
 */
export const VOZES_NEURAIS = [
    { id: 'pt_BR-edresson-low', rotulo: 'Português (Brasil) — leve e rápida' },
    { id: 'pt_BR-faber-medium', rotulo: 'Português (Brasil) — melhor qualidade' },
    { id: 'pt_PT-tugão-medium', rotulo: 'Português (Portugal)' },
] as const

export type VozNeuralId = (typeof VOZES_NEURAIS)[number]['id']

export type ConfigAudio = {
    motor: MotorDeAudio
    vozNeural: VozNeuralId
    /** voiceURI da SpeechSynthesisVoice escolhida; vazio = a primeira pt- disponível no navegador. */
    vozNavegador: string
    velocidade: number
}

const CHAVE = 'koinonia:audio-config'

const PADRAO: ConfigAudio = {
    motor: 'navegador',
    vozNeural: 'pt_BR-edresson-low',
    vozNavegador: '',
    velocidade: 1,
}

/** Preferência de aparelho, não de conta — mesma razão de preferencias-leitura.ts. */
export function lerConfigAudio(): ConfigAudio {
    try {
        const bruto = localStorage.getItem(CHAVE)
        if (!bruto) return PADRAO
        return { ...PADRAO, ...JSON.parse(bruto) }
    } catch {
        return PADRAO
    }
}

export function salvarConfigAudio(config: ConfigAudio) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(config))
    } catch {
        // segue sem persistir
    }
}
