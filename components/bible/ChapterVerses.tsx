'use client'

import { WifiOff } from 'lucide-react'
import InteractiveVerse from '@/components/bible/InteractiveVerse'
import BotaoOuvir from '@/components/audio/BotaoOuvir'
import { useOfflineChapter, useEstaOffline } from '@/hooks/useOfflineBible'
import type { BibleVerse } from '@/services/bibleService'

type Props = {
    versiculosDoServidor: BibleVerse[]
    bookSlug: string
    chapter: number
    versionSlug?: string
}

/**
 * Server e client se completam aqui: o servidor já trouxe os versículos na
 * primeira renderização (é o caminho normal, com rede). Este componente só
 * assume o Dexie quando o servidor não trouxe nada — sessão que ficou sem
 * rede, ou versão momentaneamente vazia — e havia cópia baixada em Tenda.
 *
 * O que isto NÃO faz: abrir um capítulo nunca visitado sem rede nenhuma. A
 * navegação em si depende de um round-trip com o servidor (Server Component,
 * force-dynamic); sem essa primeira resposta, não há para onde vir.
 */
export default function ChapterVerses({ versiculosDoServidor, bookSlug, chapter, versionSlug }: Props) {
    const offline = useEstaOffline()
    const precisaDoOffline = versiculosDoServidor.length === 0
    const { versiculos: doDexie, carregando } = useOfflineChapter(
        precisaDoOffline ? versionSlug : undefined,
        bookSlug,
        chapter
    )

    if (precisaDoOffline && !carregando && doDexie.length > 0) {
        return (
            <div className="space-y-1">
                <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                    <WifiOff size={13} /> Lendo a cópia baixada no seu aparelho
                    {offline ? ' — sem conexão agora' : ''}.
                </p>
                <div className="mb-3">
                    <BotaoOuvir texto={doDexie.map((v) => v.text).join(' ')} rotulo="Ouvir capítulo" />
                </div>
                {doDexie.map((v) => (
                    <p key={v.id} className="texto-biblico font-serif leading-relaxed text-stone-700">
                        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded text-xs font-sans font-bold text-stone-400">
                            {v.verse}
                        </span>
                        {v.text}
                    </p>
                ))}
            </div>
        )
    }

    if (precisaDoOffline && !carregando && doDexie.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
                {offline
                    ? 'Sem conexão, e este capítulo ainda não foi baixado. Baixe a Bíblia em Tenda para ler offline.'
                    : 'Não foi possível carregar este capítulo agora.'}
            </div>
        )
    }

    return (
        <div className="space-y-1">
            <div className="mb-3">
                <BotaoOuvir texto={versiculosDoServidor.map((v) => v.text).join(' ')} rotulo="Ouvir capítulo" />
            </div>
            {versiculosDoServidor.map((verse) => (
                <InteractiveVerse
                    key={verse.id}
                    text={verse.text}
                    verseNumber={verse.verse}
                    bookSlug={bookSlug}
                    chapter={chapter}
                    versionSlug={versionSlug}
                />
            ))}
        </div>
    )
}
