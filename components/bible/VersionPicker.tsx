'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { definirVersaoPreferida } from '@/actions/bible-version'
import type { BibleVersion } from '@/services/bibleService'
import { Check, ChevronDown, Languages } from 'lucide-react'

type Props = {
    versoes: BibleVersion[]
    atual: BibleVersion
}

export default function VersionPicker({ versoes, atual }: Props) {
    const [aberto, setAberto] = useState(false)
    const [, iniciar] = useTransition()
    const router = useRouter()
    const pathname = usePathname()

    // Uma versão só: o seletor não teria o que oferecer.
    if (versoes.length <= 1) return null

    const escolher = (slug: string) => {
        setAberto(false)
        // Navega já (a leitura muda na hora) e grava a preferência em
        // paralelo. Se a gravação falhar, a pessoa continua lendo o que
        // pediu — só não fica lembrado para a próxima.
        router.push(`${pathname}?v=${slug}`)
        iniciar(async () => {
            await definirVersaoPreferida(slug)
        })
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                aria-expanded={aberto}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-bold text-stone-600 hover:border-amber-400"
            >
                <Languages size={13} />
                {atual.abbreviation ?? atual.slug.toUpperCase()}
                <ChevronDown size={13} className={aberto ? 'rotate-180 transition' : 'transition'} />
            </button>

            {aberto && (
                <>
                    {/* Fecha ao clicar fora, sem depender de listener global. */}
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={() => setAberto(false)}
                        className="fixed inset-0 z-20 cursor-default"
                    />
                    <ul className="absolute right-0 z-30 mt-1 w-64 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
                        {versoes.map((v) => (
                            <li key={v.slug}>
                                <button
                                    type="button"
                                    onClick={() => escolher(v.slug)}
                                    className={`flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-stone-50 ${
                                        v.slug === atual.slug ? 'bg-amber-50' : ''
                                    }`}
                                >
                                    <Check
                                        size={14}
                                        className={`mt-0.5 shrink-0 ${
                                            v.slug === atual.slug ? 'text-amber-600' : 'text-transparent'
                                        }`}
                                    />
                                    <span className="min-w-0">
                                        <span className="block text-sm font-bold text-stone-800">{v.name}</span>
                                        <span className="block text-[10px] uppercase tracking-wide text-stone-400">
                                            {v.language}
                                            {v.license === 'cc_by' && ' · CC BY'}
                                            {v.license === 'public_domain' && ' · domínio público'}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    )
}
