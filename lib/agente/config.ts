import { PROMPT_PADRAO } from './prompt-padrao'

export type AgenteConfig = {
    apiKey: string
    baseUrl: string
    model: string
    systemPrompt: string
}

const CHAVE = 'koinonia:agente-config'

const PADRAO: AgenteConfig = {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    systemPrompt: PROMPT_PADRAO,
}

/**
 * A chave de API mora só aqui — localStorage do navegador. Nunca é
 * enviada para o servidor do Koinonia (as Server Actions de busca não
 * recebem nem precisam dela); só sai do navegador direto para a URL que a
 * própria pessoa configurou (baseUrl), na chamada feita pelo cliente.
 */
export function lerConfig(): AgenteConfig {
    try {
        const bruto = localStorage.getItem(CHAVE)
        if (!bruto) return PADRAO
        const salvo = JSON.parse(bruto)
        return { ...PADRAO, ...salvo }
    } catch {
        return PADRAO
    }
}

export function salvarConfig(config: AgenteConfig) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(config))
    } catch {
        // segue sem persistir — a pessoa configura de novo na próxima visita
    }
}

export function configPadrao(): AgenteConfig {
    return PADRAO
}
