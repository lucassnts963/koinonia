export type TamanhoFonte = 'sm' | 'base' | 'lg' | 'xl'

const CHAVE = 'koinonia:tamanho-fonte'
const PASSOS: TamanhoFonte[] = ['sm', 'base', 'lg', 'xl']
const RÓTULOS: Record<TamanhoFonte, string> = {
    sm: 'Pequena', base: 'Padrão', lg: 'Grande', xl: 'Muito grande',
}

export function passos() {
    return PASSOS
}

export function rotulo(t: TamanhoFonte) {
    return RÓTULOS[t]
}

/** Preferência de aparelho, não de conta — por isso localStorage, não Supabase. */
export function lerTamanhoFonte(): TamanhoFonte {
    try {
        const v = localStorage.getItem(CHAVE)
        return (PASSOS as string[]).includes(v ?? '') ? (v as TamanhoFonte) : 'base'
    } catch {
        // localStorage pode falhar (navegação privada, quota). O padrão
        // continua funcionando — só não persiste entre visitas.
        return 'base'
    }
}

/** Aplica no <html> (o CSS lê data-font-size) e persiste. */
export function definirTamanhoFonte(t: TamanhoFonte) {
    try {
        localStorage.setItem(CHAVE, t)
    } catch {
        // segue sem persistir
    }
    aplicarTamanhoFonte(t)
}

export function aplicarTamanhoFonte(t: TamanhoFonte) {
    if (typeof document !== 'undefined') {
        document.documentElement.dataset.fontSize = t
    }
}
