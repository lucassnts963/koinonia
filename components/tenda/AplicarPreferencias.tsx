'use client'

import { useEffect } from 'react'
import { aplicarTamanhoFonte, lerTamanhoFonte } from '@/lib/preferencias-leitura'

/**
 * Aplica a preferência de fonte salva assim que o app carrega, em qualquer
 * página — não só na tela de leitura, porque o usuário pode abrir direto
 * num link de capítulo sem passar pela Tenda antes.
 *
 * Sem SSR: a preferência mora no localStorage do aparelho, então o primeiro
 * quadro sempre renderiza no tamanho padrão e ajusta no mount. Para uma
 * preferência de exibição isso é aceitável — o alternativa (ler cookie no
 * servidor) trocaria uma flicker por complexidade que essa escolha não paga.
 */
export default function AplicarPreferencias() {
    useEffect(() => {
        aplicarTamanhoFonte(lerTamanhoFonte())
    }, [])

    return null
}
