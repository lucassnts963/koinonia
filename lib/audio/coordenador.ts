/**
 * `window.speechSynthesis` é um único motor global no navegador inteiro — e
 * o motor neural também não deveria tocar dois áudios ao mesmo tempo. Sem
 * isto, cada `BotaoOuvir` não sabe da existência dos outros: dois botões
 * podem achar que são "o player ativo" ao mesmo tempo, e o anterior fica
 * mostrando um estado (tocando/pausado) que não é mais verdade.
 *
 * Quem começa a tocar de novo derruba, de fato, quem tocava antes.
 */

type Parar = () => void

let ativo: Parar | null = null

export function tornarAtivo(parar: Parar) {
    if (ativo && ativo !== parar) ativo()
    ativo = parar
}

export function encerrarSeAtivo(parar: Parar) {
    if (ativo === parar) ativo = null
}
