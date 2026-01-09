'use client'

import { useState } from 'react'
import { saveNote } from '@/actions/notes'
import { getDefinition } from '@/actions/dictionary'
import { searchVersesByTerm, type SearchResult } from '@/actions/bible'
import { Loader2, Book, PenLine, X, Save, Search, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

export default function InteractiveVerse({
    text,
    verseNumber,
    bookSlug,
    chapter,
    hasNote
}: {
    text: string,
    verseNumber: number,
    bookSlug: string,
    chapter: number,
    hasNote?: boolean
}) {
    const [loading, setLoading] = useState(false)
    const [showNoteInput, setShowNoteInput] = useState(false)
    const [noteContent, setNoteContent] = useState('')

    // Estado do Popover
    const [activeWord, setActiveWord] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'def' | 'search'>('def')

    // Dados carregados
    const [definition, setDefinition] = useState<{ term: string, text: string } | null>(null)
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [popoverLoading, setPopoverLoading] = useState(false)

    const words = text.split(' ')

    const handleWordClick = async (word: string) => {
        const cleanWord = word.replace(/[.,;!?()"]/g, '')
        if (cleanWord.length < 3) return

        if (activeWord === cleanWord) {
            setActiveWord(null) // Toggle off
            return
        }

        setActiveWord(cleanWord)
        setActiveTab('def') // Reset tab
        setDefinition(null)
        setSearchResults([])

        loadDefinition(cleanWord)
    }

    const loadDefinition = async (word: string) => {
        setPopoverLoading(true)
        try {
            const res = await getDefinition(word)
            if (res?.data) setDefinition({ term: res.data.term, text: res.data.definition })
        } catch (e) { console.error(e) }
        setPopoverLoading(false)
    }

    const loadSearch = async () => {
        if (!activeWord) return
        setActiveTab('search')
        if (searchResults.length > 0) return // Já carregou

        setPopoverLoading(true)
        try {
            const res = await searchVersesByTerm(activeWord)
            setSearchResults(res)
        } catch (e) { console.error(e) }
        setPopoverLoading(false)
    }

    const handleSaveNote = async () => {
        if (!noteContent.trim()) return
        setLoading(true)
        await saveNote(bookSlug, chapter, verseNumber, noteContent)
        setLoading(false)
        setShowNoteInput(false)
        alert('Nota salva!')
    }

    return (
        <div className={`relative mb-6 p-2 rounded-lg transition-colors ${hasNote ? 'bg-amber-50/50 border-l-2 border-amber-300' : 'hover:bg-stone-50'}`}>

            <p className="text-lg md:text-xl font-serif leading-relaxed text-stone-700">
                <button
                    onClick={() => setShowNoteInput(!showNoteInput)}
                    className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded text-xs font-sans font-bold text-stone-400 hover:text-amber-600 hover:bg-amber-100 transition-colors"
                >
                    {verseNumber}
                    {hasNote && <span className="absolute w-1.5 h-1.5 bg-amber-500 rounded-full top-0 right-0"></span>}
                </button>

                {words.map((word, i) => {
                    const clean = word.replace(/[.,;!?()"]/g, '')
                    const isActive = activeWord === clean
                    return (
                        <span
                            key={i}
                            onClick={() => handleWordClick(word)}
                            className={`
                                inline-block mr-1 cursor-pointer transition-all rounded px-0.5
                                ${isActive ? 'bg-amber-100 text-amber-900 font-medium' : 'hover:text-amber-700 hover:underline decoration-amber-300 decoration-2 underline-offset-2'}
                            `}
                        >
                            {word}
                        </span>
                    )
                })}
            </p>

            {/* Input de Nota */}
            {showNoteInput && (
                <div className="mt-3 bg-white p-3 rounded-xl border border-stone-200 shadow-lg animate-in slide-in-from-top-2">
                    <textarea
                        className="w-full text-sm p-2 border border-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none font-sans"
                        rows={2}
                        placeholder={`Anotação em ${bookSlug} ${chapter}:${verseNumber}...`}
                        value={noteContent}
                        onChange={e => setNoteContent(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setShowNoteInput(false)} className="p-2 text-stone-400 hover:text-red-500"><X size={16} /></button>
                        <button
                            onClick={handleSaveNote}
                            disabled={loading || !noteContent}
                            className="bg-stone-900 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-stone-800"
                        >
                            {loading ? <Loader2 className="animate-spin w-3 h-3" /> : <Save size={14} />}
                            Salvar
                        </button>
                    </div>
                </div>
            )}

            {/* Popover de Palavra (Dicionário ou Busca) */}
            {activeWord && (
                <div className="mt-2 bg-stone-50 rounded-lg border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 origin-top-left max-w-md sticky left-0 z-10 w-full md:w-auto">
                    {/* Header Abas */}
                    <div className="flex border-b border-stone-200">
                        <button
                            onClick={() => setActiveTab('def')}
                            className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 ${activeTab === 'def' ? 'bg-white text-amber-700 border-b-2 border-amber-500' : 'text-stone-500 hover:bg-stone-100'}`}
                        >
                            <Book size={14} /> Definição
                        </button>
                        <button
                            onClick={loadSearch}
                            className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 ${activeTab === 'search' ? 'bg-white text-amber-700 border-b-2 border-amber-500' : 'text-stone-500 hover:bg-stone-100'}`}
                        >
                            <Search size={14} /> Ver na Bíblia
                        </button>
                        <button onClick={() => setActiveWord(null)} className="px-3 text-stone-400 hover:text-stone-600 hover:bg-stone-100"><X size={14} /></button>
                    </div>

                    <div className="p-4 max-h-60 overflow-y-auto">
                        {popoverLoading ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-amber-500" /></div>
                        ) : activeTab === 'def' ? (
                            definition ? (
                                <div className="text-sm prose prose-amber prose-p:my-1 prose-headings:my-1 text-stone-700">
                                    <ReactMarkdown>{definition.text}</ReactMarkdown>
                                </div>
                            ) : (
                                <p className="text-xs text-stone-500 text-center">Nenhuma definição encontrada.</p>
                            )
                        ) : (
                            <div className="space-y-2">
                                {searchResults.length > 0 ? searchResults.map((res, idx) => (
                                    <Link
                                        href={`/leitura/${res.book_slug}/${res.chapter}`}
                                        key={idx}
                                        className="block bg-white p-2 rounded border border-stone-100 hover:border-amber-300 transition-colors group"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-amber-800">{res.book_name} {res.chapter}:{res.verse}</span>
                                            <ChevronRight size={12} className="text-stone-300 group-hover:text-amber-500" />
                                        </div>
                                        <p className="text-xs text-stone-600 line-clamp-2 font-serif">{res.text}</p>
                                    </Link>
                                )) : (
                                    <p className="text-xs text-stone-500 text-center">Nenhum outro versículo encontrado.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}