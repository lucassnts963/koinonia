'use client'

import { useEffect, useState } from 'react'
import { db, type OfflineVerse } from '@/lib/db'

export type EstadoOffline = {
    /** Versículos do Dexie para este capítulo/versão, já ordenados. */
    versiculos: OfflineVerse[]
    carregando: boolean
    /** Este capítulo/versão específico tem cópia baixada? */
    temCopiaOffline: boolean
}

/**
 * Lê o capítulo do IndexedDB (Dexie) em vez do servidor.
 *
 * Existia como arquivo vazio: o botão de download em Tenda gravava 31 mil
 * versículos e nenhum código lia esse armazenamento — escrita sem leitor.
 *
 * Limite real, não escondido: isto não torna a leitura offline-first. A
 * página do capítulo é Server Component (`force-dynamic`) — abrir um
 * capítulo nunca visitado sem rede continua impossível, porque a
 * renderização em si depende de round-trip com o servidor. O que este hook
 * resolve é o caso que a Tenda promete: um capítulo já baixado continua
 * legível quando o servidor não devolve nada (rede caiu no meio da sessão,
 * ou a versão/capítulo momentaneamente vazio no servidor).
 */
export function useOfflineChapter(
    versionSlug: string | undefined,
    bookSlug: string,
    chapter: number
): EstadoOffline {
    const [versiculos, setVersiculos] = useState<OfflineVerse[]>([])
    const [carregando, setCarregando] = useState(true)

    useEffect(() => {
        let montado = true

        async function carregar() {
            if (!versionSlug) {
                if (montado) { setVersiculos([]); setCarregando(false) }
                return
            }
            try {
                const linhas = await db.verses
                    .where('[version_slug+book_slug+chapter]')
                    .equals([versionSlug, bookSlug, chapter])
                    .sortBy('verse')

                if (montado) setVersiculos(linhas)
            } catch (e) {
                // IndexedDB pode falhar (navegação privada, quota, etc.) — a
                // tela deve continuar funcionando com o que o servidor trouxe.
                console.error('[useOfflineChapter]', e)
                if (montado) setVersiculos([])
            } finally {
                if (montado) setCarregando(false)
            }
        }

        carregar()
        return () => { montado = false }
    }, [versionSlug, bookSlug, chapter])

    return { versiculos, carregando, temCopiaOffline: versiculos.length > 0 }
}

/** Está sem rede agora? Reage a on/offline, não só ao valor na montagem. */
export function useEstaOffline(): boolean {
    const [offline, setOffline] = useState(
        () => typeof navigator !== 'undefined' && !navigator.onLine
    )

    useEffect(() => {
        const marcarOnline = () => setOffline(false)
        const marcarOffline = () => setOffline(true)
        window.addEventListener('online', marcarOnline)
        window.addEventListener('offline', marcarOffline)
        return () => {
            window.removeEventListener('online', marcarOnline)
            window.removeEventListener('offline', marcarOffline)
        }
    }, [])

    return offline
}
