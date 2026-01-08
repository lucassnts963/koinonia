'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/db' // Seu arquivo Dexie
import { CloudDownload, CheckCircle, Trash2, Loader2, WifiOff } from 'lucide-react'

// URL da Bíblia (Mesma do Seed)
const BIBLE_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_acf.json'

export default function OfflineManager() {
    const [status, setStatus] = useState<'checking' | 'ready' | 'empty' | 'downloading'>('checking')
    const [count, setCount] = useState(0)

    // 1. Ao carregar, verifica se já tem dados no Dexie
    useEffect(() => {
        checkStatus()
    }, [])

    async function checkStatus() {
        try {
            const c = await db.verses.count()
            setCount(c)
            setStatus(c > 30000 ? 'ready' : 'empty') // 31102 versículos na ACF
        } catch (e) {
            console.error(e)
            setStatus('empty')
        }
    }

    // 2. Lógica de Download e Processamento
    async function handleDownload() {
        setStatus('downloading')
        try {
            // A. Baixar JSON
            const res = await fetch(BIBLE_URL)
            const data = await res.json()

            // B. Transformar JSON aninhado em Array plano para o Banco
            // Formato esperado pelo Dexie (conforme seu lib/db.ts):
            // { version_slug: 'acf', book_slug: 'gn', chapter: 1, verse: 1, text: '...' }

            const versesToSave: any[] = []
            let bookCounter = 1

            for (const book of data) {
                book.chapters.forEach((chapterContent: string[], chapterIndex: number) => {
                    chapterContent.forEach((verseText, verseIndex) => {
                        versesToSave.push({
                            version_slug: 'acf', // Fixo por enquanto
                            book_slug: book.abbrev,
                            chapter: chapterIndex + 1,
                            verse: verseIndex + 1,
                            text: verseText
                        })
                    })
                })
                bookCounter++
            }

            // C. Salvar no IndexedDB (Bulk Add é rápido)
            await db.verses.bulkAdd(versesToSave)

            await checkStatus()
            alert("Bíblia baixada com sucesso! Você pode ler sem internet.")

        } catch (error) {
            console.error(error)
            alert("Erro ao baixar. Verifique sua conexão.")
            setStatus('empty')
        }
    }

    // 3. Limpar dados (liberar espaço)
    async function handleClear() {
        if (!confirm("Tem certeza? Você precisará de internet para ler novamente.")) return
        await db.verses.clear()
        await checkStatus()
    }

    return (
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                        <WifiOff className="text-stone-400" size={20} />
                        Modo Peregrino (Offline)
                    </h3>
                    <p className="text-sm text-stone-500 mt-1">
                        Baixe a Bíblia completa para ler quando estiver sem sinal (Deserto Digital).
                    </p>
                </div>
            </div>

            {status === 'checking' && (
                <div className="flex items-center gap-2 text-stone-400 text-sm">
                    <Loader2 className="animate-spin" size={16} /> Verificando armazenamento...
                </div>
            )}

            {status === 'downloading' && (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-lg flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin" />
                    <span>Baixando e selando pergaminhos... (Isso pode levar alguns segundos)</span>
                </div>
            )}

            {status === 'ready' && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full text-green-700">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-green-800">Bíblia Disponível Offline</p>
                            <p className="text-xs text-green-600">{count.toLocaleString()} versículos salvos.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClear}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                        title="Apagar download"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            )}

            {status === 'empty' && (
                <button
                    onClick={handleDownload}
                    className="w-full py-3 bg-stone-900 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition shadow-lg"
                >
                    <CloudDownload size={20} />
                    Baixar Bíblia Agora (~5MB)
                </button>
            )}
        </div>
    )
}