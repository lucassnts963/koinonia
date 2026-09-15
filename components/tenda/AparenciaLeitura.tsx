'use client'

import { useEffect, useState } from 'react'
import { Type } from 'lucide-react'
import {
    definirTamanhoFonte,
    lerTamanhoFonte,
    passos,
    rotulo,
    type TamanhoFonte,
} from '@/lib/preferencias-leitura'

/**
 * Antes: seção inteira com opacity-60 e selo "Em Breve" — os botões de
 * fonte e o toggle de tema não tinham onClick nenhum. Aqui só entra o que
 * de fato funciona: tamanho de fonte, aplicado na hora em toda a Bíblia.
 *
 * O toggle de tema saiu (não ficou "quase pronto e desligado" — foi
 * removido): o app não tem uma única classe `dark:` real em componente
 * nenhum, então ligar o toggle pintaria a tela pela metade. Registrado em
 * docs/DARKMODE.md como trabalho futuro do tamanho de uma fase própria.
 */
export default function AparenciaLeitura() {
    const [tamanho, setTamanho] = useState<TamanhoFonte>('base')

    useEffect(() => {
        // A leitura do localStorage não pode ir direto no useState inicial:
        // o servidor sempre renderiza 'base' (não tem localStorage), e ler
        // sincronamente aqui na primeira passada do efeito produziria o
        // mesmo valor que uma renderização de hidratação divergente teria —
        // o microtask empurra para depois da hidratação, de propósito.
        queueMicrotask(() => setTamanho(lerTamanhoFonte()))
    }, [])

    const escolher = (t: TamanhoFonte) => {
        setTamanho(t)
        definirTamanhoFonte(t)
    }

    const opcoes = passos()
    const indiceAtual = opcoes.indexOf(tamanho)

    return (
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-stone-800">
                <Type size={18} /> Aparência da Leitura
            </h3>

            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>Tamanho da fonte</span>
                    <span className="font-bold text-stone-700">{rotulo(tamanho)}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-stone-100 bg-stone-50 p-2">
                    <button
                        type="button"
                        onClick={() => escolher(opcoes[Math.max(0, indiceAtual - 1)])}
                        disabled={indiceAtual === 0}
                        className="rounded px-2 py-1 text-xs hover:bg-white hover:shadow-sm disabled:opacity-30"
                        aria-label="Diminuir fonte"
                    >
                        Aa
                    </button>
                    <div className="flex flex-1 gap-1">
                        {opcoes.map((op, i) => (
                            <button
                                key={op}
                                type="button"
                                onClick={() => escolher(op)}
                                aria-label={rotulo(op)}
                                aria-pressed={op === tamanho}
                                className={`h-1.5 flex-1 rounded transition-colors ${
                                    i <= indiceAtual ? 'bg-amber-500' : 'bg-stone-200'
                                }`}
                            />
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => escolher(opcoes[Math.min(opcoes.length - 1, indiceAtual + 1)])}
                        disabled={indiceAtual === opcoes.length - 1}
                        className="rounded px-2 py-1 text-lg font-bold hover:bg-white hover:shadow-sm disabled:opacity-30"
                        aria-label="Aumentar fonte"
                    >
                        Aa
                    </button>
                </div>
                <p className="texto-biblico rounded-lg bg-stone-50 p-3 font-serif text-stone-600">
                    No princípio criou Deus os céus e a terra.
                </p>
            </div>
        </section>
    )
}
