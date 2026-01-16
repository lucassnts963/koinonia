'use client'

import React, { useState } from 'react'
import { searchBible } from '@/actions/study'
import { Loader2, Search, PlusCircle, Book, X } from 'lucide-react'

export default function BibleSearchSidebar({
    onInsert,
    isOpen,
    onClose,
    className = "" // Aceita classes extras para posicionamento
}: {
    onInsert: (ref: string, text: string) => void,
    isOpen: boolean,
    onClose: () => void,
    className?: string
}) {
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<any[]>([])

    const handleSearch = async () => {
        if (!query) return
        setLoading(true)
        const res = await searchBible(query)
        setResults(res || [])
        setLoading(false)
    }

    return (
        <div className={`flex flex-col h-full bg-white border-l border-stone-200 shadow-xl md:shadow-none ${className}`}>
            {/* Header */}
            <div className="p-3 border-b border-stone-100 flex justify-between items-center bg-stone-50 md:bg-white shrink-0">
                <h3 className="font-bold text-stone-700 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Search size={16} className="text-amber-600" /> Pesquisar
                </h3>
                <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded hover:bg-stone-100">
                    <X size={20} />
                </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-stone-100 bg-white shrink-0">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Busque versículos..."
                        className="flex-1 bg-stone-50 border border-stone-200 rounded px-3 py-2 text-sm focus:outline-amber-500 focus:bg-white transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        className="p-2 bg-stone-900 hover:bg-stone-800 rounded text-white transition-colors"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    </button>
                </div>
            </div>

            {/* Resultados */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {results.map((r) => (
                    <div key={r.id} className="group bg-stone-50 hover:bg-amber-50 p-3 rounded-lg border border-stone-100 hover:border-amber-200 transition-all cursor-pointer" onClick={() => onInsert(`${r.bible_books.name} ${r.chapter}:${r.verse}`, r.text)}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-amber-800 text-[10px] uppercase tracking-wide bg-white px-2 py-0.5 rounded shadow-sm border border-stone-100">
                                {r.bible_books.name} {r.chapter}:{r.verse}
                            </span>
                            <button
                                title="Inserir no estudo"
                                className="text-stone-300 group-hover:text-green-600 hover:scale-110 transition-transform"
                            >
                                <PlusCircle size={16} />
                            </button>
                        </div>
                        <p className="text-stone-700 font-serif leading-relaxed text-sm">
                            "{r.text}"
                        </p>
                    </div>
                ))}

                {!loading && results.length === 0 && query && (
                    <p className="text-xs text-stone-400 text-center py-4">Nada encontrado.</p>
                )}
            </div>
        </div>
    )
}