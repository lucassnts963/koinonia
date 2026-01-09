'use client'

import React, { useState } from 'react'
import { searchBible } from '@/actions/study'
import { Loader2, Search, PlusCircle, Book, X } from 'lucide-react'

export default function BibleSearchSidebar({
    onInsert,
    isOpen,
    onClose
}: {
    onInsert: (ref: string, text: string) => void,
    isOpen: boolean,
    onClose: () => void
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
        <>
            {/* Backdrop Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                id="sidebar-area"
                className={`
                    fixed md:relative top-0 right-0 h-full w-80 bg-white border-l border-stone-200 shadow-xl md:shadow-none z-40 transition-transform duration-300 transform
                    ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50 md:bg-white">
                        <h3 className="font-bold text-stone-700 flex items-center gap-2">
                            <Book size={18} className="text-amber-600" /> Bíblia
                        </h3>
                        <button onClick={onClose} className="md:hidden p-1 text-stone-400 hover:text-stone-600">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="p-4 border-b border-stone-100 bg-white sticky top-0">
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
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {loading && (
                            <div className="text-center py-10 text-stone-400">
                                <Loader2 className="animate-spin mx-auto mb-2" />
                            </div>
                        )}

                        {results.map((r) => (
                            <div key={r.id} className="group bg-stone-50 hover:bg-amber-50 p-3 rounded-lg border border-stone-100 hover:border-amber-200 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-amber-800 text-xs uppercase tracking-wide bg-white px-2 py-0.5 rounded shadow-sm border border-stone-100">
                                        {r.bible_books.name} {r.chapter}:{r.verse}
                                    </span>
                                    <button
                                        onClick={() => onInsert(`${r.bible_books.name} ${r.chapter}:${r.verse}`, r.text)}
                                        title="Inserir no estudo"
                                        className="text-stone-400 hover:text-green-600 hover:scale-110 transition-transform"
                                    >
                                        <PlusCircle size={18} />
                                    </button>
                                </div>
                                <p className="text-stone-700 font-serif leading-relaxed text-sm">
                                    "{r.text}"
                                </p>
                            </div>
                        ))}

                        {!loading && results.length === 0 && query && (
                            <p className="text-sm text-stone-400 text-center italic py-10">Nenhum versículo encontrado.</p>
                        )}

                        {!loading && !query && (
                            <div className="text-center py-20 text-stone-300">
                                <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p className="text-xs">Digite uma referência ou palavra-chave.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
