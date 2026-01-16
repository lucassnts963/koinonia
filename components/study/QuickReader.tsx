'use client'

import { useState, useEffect } from 'react'
import { fetchBooksList, fetchQuickChapter } from '@/actions/bible-client'
import { ChevronLeft, ChevronRight, X, Loader2, BookOpen, Grid3X3, ArrowLeft } from 'lucide-react'

// Estrutura Estática da Bíblia (Slug : Total de Capítulos)
// Isso evita chamadas desnecessárias ao banco apenas para montar o grid
const BIBLE_COUNTS: Record<string, number> = {
    gn: 50, ex: 40, lv: 27, nm: 36, dt: 34, js: 24, jz: 21, rt: 4,
    '1sm': 31, '2sm': 24, '1rs': 22, '2rs': 25, '1cr': 29, '2cr': 36, ed: 10, ne: 13, et: 10,
    job: 42, sl: 150, pv: 31, ec: 12, ct: 8, is: 66, jr: 52, lm: 5, ez: 48, dn: 12,
    os: 14, jl: 3, am: 9, ob: 1, jn: 4, mq: 7, na: 3, hc: 3, sf: 3, ag: 2, zc: 14, ml: 4,
    mt: 28, mc: 16, lc: 24, jo: 21, at: 28, rm: 16, '1co': 16, '2co': 13, gl: 6, ef: 6, fp: 4, cl: 4,
    '1ts': 5, '2ts': 3, '1tm': 6, '2tm': 4, tt: 3, fm: 1, hb: 13, tg: 5, '1pe': 5, '2pe': 3,
    '1jo': 5, '2jo': 1, '3jo': 1, jd: 1, ap: 22
}

type QuickReaderProps = {
    onClose: () => void
    onInsertReference?: (ref: string, text: string) => void
    className?: string
}

export default function QuickReader({ onClose, onInsertReference, className = "" }: QuickReaderProps) {
    // Estados de Dados
    const [books, setBooks] = useState<any[]>([])
    const [currentBook, setCurrentBook] = useState('gn')
    const [currentChapter, setCurrentChapter] = useState(1)
    const [chapterData, setChapterData] = useState<any>(null)

    // Estados de UI
    const [view, setView] = useState<'read' | 'grid'>('read') // Alterna entre Ler Texto e Escolher Capítulo
    const [loading, setLoading] = useState(false)
    const [loadingBooks, setLoadingBooks] = useState(true)

    // Inicialização
    useEffect(() => {
        async function init() {
            const b = await fetchBooksList()
            setBooks(b)
            setLoadingBooks(false)
            loadChapter('gn', 1)
        }
        init()
    }, [])

    // Carrega o texto do capítulo
    async function loadChapter(book: string, chapter: number) {
        setView('read') // Garante que volta para leitura
        setLoading(true)

        // Atualiza estados locais imediatamente para UI responder
        setCurrentBook(book)
        setCurrentChapter(chapter)

        const data = await fetchQuickChapter(book, chapter)
        if (data) {
            setChapterData(data)
        }
        setLoading(false)
    }

    // Troca o livro (abre o grid automaticamente para escolher o capítulo)
    const handleBookChange = (bookSlug: string) => {
        setCurrentBook(bookSlug)
        setView('grid') // Ao mudar o livro, joga pro grid para escolher o capitulo
    }

    const totalChapters = BIBLE_COUNTS[currentBook] || 150

    return (
        <div className={`flex flex-col h-full bg-stone-50 border-l border-stone-200 ${className}`}>
            {/* Header Fixo */}
            <div className="flex items-center justify-between p-3 border-b border-stone-200 bg-white shrink-0">
                <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-amber-600" />
                    <h3 className="font-bold text-stone-700 text-sm uppercase tracking-wide">
                        {view === 'read' ? 'Leitura' : 'Selecionar Capítulo'}
                    </h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded text-stone-500">
                    <X size={20} />
                </button>
            </div>

            {/* Barra de Controle (Navegação) */}
            <div className="p-3 bg-stone-100 border-b border-stone-200 shrink-0 space-y-2">

                {/* Seletor de Livro */}
                <select
                    value={currentBook}
                    onChange={(e) => handleBookChange(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg text-sm p-2 font-bold text-stone-700 focus:outline-amber-500 shadow-sm"
                >
                    {loadingBooks ? <option>Carregando livros...</option> :
                        books.map(b => <option key={b.slug} value={b.slug}>{b.name}</option>)
                    }
                </select>

                {/* Seletor de Capítulo (Navegação Híbrida) */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => currentChapter > 1 && loadChapter(currentBook, currentChapter - 1)}
                        disabled={currentChapter <= 1 || view === 'grid'}
                        className="p-2 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-50"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {/* Botão Central que abre o Grid */}
                    <button
                        onClick={() => setView(view === 'read' ? 'grid' : 'read')}
                        className={`
                            flex-1 p-2 border rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors
                            ${view === 'grid'
                                ? 'bg-stone-800 text-white border-stone-800'
                                : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                            }
                        `}
                    >
                        {view === 'grid' ? (
                            <> <ArrowLeft size={14} /> Voltar </>
                        ) : (
                            <> <Grid3X3 size={14} className="text-amber-600" /> Cap. {currentChapter} </>
                        )}
                    </button>

                    <button
                        onClick={() => currentChapter < totalChapters && loadChapter(currentBook, currentChapter + 1)}
                        disabled={currentChapter >= totalChapters || view === 'grid'}
                        className="p-2 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-50"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Conteúdo (Texto ou Grid) */}
            <div className="flex-1 overflow-y-auto bg-white/50 relative">

                {/* MODO GRID (Seleção) */}
                {view === 'grid' && (
                    <div className="absolute inset-0 bg-stone-50 p-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 text-center">
                            Escolha um capítulo
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: totalChapters }, (_, i) => i + 1).map((num) => (
                                <button
                                    key={num}
                                    onClick={() => loadChapter(currentBook, num)}
                                    className={`
                                        p-2 rounded-lg text-sm font-bold border transition-all
                                        ${num === currentChapter
                                            ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105'
                                            : 'bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-600'
                                        }
                                    `}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* MODO LEITURA (Texto) */}
                {view === 'read' && (
                    <div className="p-4 h-full">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-stone-400 gap-2">
                                <Loader2 className="animate-spin text-amber-500" />
                                <span className="text-xs">Carregando pergaminhos...</span>
                            </div>
                        ) : chapterData ? (
                            <div className="space-y-3 pb-10">
                                <h4 className="font-serif font-bold text-xl text-stone-800 text-center mb-4 sticky top-0 bg-white/95 backdrop-blur py-2 border-b border-stone-100 z-10">
                                    {chapterData.bookName} {chapterData.chapter}
                                </h4>
                                {chapterData.verses.map((v: any) => (
                                    <p
                                        key={v.id}
                                        className="text-stone-700 leading-relaxed hover:bg-amber-100 p-2 rounded cursor-pointer transition-colors text-sm md:text-base border-l-2 border-transparent hover:border-amber-400"
                                        onClick={() => onInsertReference?.(`${chapterData.bookName} ${chapterData.chapter}:${v.verse}`, v.text)}
                                        title="Clique para citar"
                                    >
                                        <span className="text-[10px] font-bold text-stone-400 mr-2 select-none align-top">{v.verse}</span>
                                        {v.text}
                                    </p>
                                ))}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    )
}