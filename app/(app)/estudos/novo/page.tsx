'use client'

import React, { useState, useEffect } from 'react'
import { saveStudy, deleteStudy, getStudy } from '@/actions/study'
import BibleSearchSidebar from '@/components/study/BibleSearchSidebar'
import StudioTour from '@/components/study/StudioTour'
import QuickReader from '@/components/study/QuickReader'
import { Save, ChevronLeft, Loader2, HelpCircle, Trash2, BookOpen, Search, LogOut } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function NewStudyPage() {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    // UI States
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showTour, setShowTour] = useState(false)

    // Layout States - Desktop: True por padrão (50/25/25)
    // Mobile: False por padrão
    const [searchOpen, setSearchOpen] = useState(true)
    const [readerOpen, setReaderOpen] = useState(true)
    const [isMobile, setIsMobile] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    // Detectar Mobile para fechar as abas inicialmente
    useEffect(() => {
        const checkMobile = () => {
            if (window.innerWidth < 768) {
                setIsMobile(true)
                setSearchOpen(false)
                setReaderOpen(false)
            } else {
                setIsMobile(false)
                // Desktop: Mantém aberto
                setSearchOpen(true)
                setReaderOpen(true)
            }
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)

        const hasSeenTour = localStorage.getItem('studio_tour_seen')
        if (!hasSeenTour) setShowTour(true)

        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        async function loadStudy() {
            if (!id) return;
            setLoading(true)
            try {
                const study = await getStudy(id)
                if (study) {
                    setTitle(study.title)
                    setContent(study.content || '')
                }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        }
        loadStudy()
    }, [id])

    const handleSave = async () => {
        if (!title.trim()) return alert("Digite um título")
        setSaving(true)
        await saveStudy(id, title, content)
        router.push('/estudos')
        setSaving(false)
    }

    const handleDelete = async () => {
        if (!id) return;
        if (confirm("Excluir estudo?")) {
            setDeleting(true)
            await deleteStudy(id)
            router.push('/estudos')
        }
    }

    const insertText = (ref: string, text: string) => {
        setContent(prev => prev + `\n\n> **${ref}**: ${text}\n`)
        if (isMobile) {
            setSearchOpen(false)
            setReaderOpen(false)
        }
    }

    if (loading) return <div className="fixed inset-0 bg-stone-50 flex items-center justify-center z-50"><Loader2 className="animate-spin" /></div>

    return (
        // LAYOUT PRINCIPAL: Fixed inset-0 cobre toda a app (Modo Foco)
        <div className="fixed inset-0 z-50 bg-stone-50 flex flex-col md:flex-row overflow-hidden">

            {showTour && <StudioTour onClose={() => { setShowTour(false); localStorage.setItem('studio_tour_seen', 'true') }} />}

            {/* =================================================================================
                COLUNA 1: EDITOR
                Desktop: Flex-1 (Ocupa o espaço restante). Se abas abertas: 50% (100-25-25).
                Mobile: W-full.
            ================================================================================= */}
            <div className="flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ease-in-out">

                {/* Header (Barra de Ferramentas) */}
                <div className="bg-white border-b border-stone-200 p-3 flex justify-between items-center shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Link href="/estudos" className="p-2 hover:bg-stone-100 rounded text-stone-500" title="Voltar / Sair do Modo Foco">
                            <LogOut size={20} className="rotate-180" />
                        </Link>
                        <input
                            type="text"
                            placeholder="Título do Estudo..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="flex-1 text-lg font-serif font-bold text-stone-800 placeholder:text-stone-300 focus:outline-none bg-transparent min-w-0"
                        />
                    </div>

                    <div className="flex items-center gap-1 md:gap-2">
                        {/* Botões Toggle (Desktop) */}
                        <button
                            onClick={() => setReaderOpen(!readerOpen)}
                            className={`p-2 rounded transition-colors ${readerOpen ? 'bg-amber-100 text-amber-700' : 'text-stone-400 hover:bg-stone-100'}`}
                            title="Bíblia (Leitura)"
                        >
                            <BookOpen size={20} />
                        </button>
                        <button
                            onClick={() => setSearchOpen(!searchOpen)}
                            className={`p-2 rounded transition-colors ${searchOpen ? 'bg-amber-100 text-amber-700' : 'text-stone-400 hover:bg-stone-100'}`}
                            title="Pesquisar"
                        >
                            <Search size={20} />
                        </button>

                        <div className="w-px h-6 bg-stone-200 mx-2 hidden md:block"></div>

                        <button onClick={() => setShowTour(true)} className="hidden md:block p-2 text-stone-400 hover:text-amber-600"><HelpCircle size={20} /></button>
                        {id && <button onClick={handleDelete} className="hidden md:block p-2 text-red-400 hover:bg-red-50 rounded"><Trash2 size={20} /></button>}

                        <button onClick={handleSave} disabled={saving} className="bg-stone-900 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-stone-800">
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            <span className="hidden md:inline">Salvar</span>
                        </button>
                    </div>
                </div>

                {/* Área de Texto */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full bg-stone-50">
                    <div className="max-w-3xl mx-auto h-full">
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="# Comece seu estudo..."
                            className="w-full h-full bg-transparent resize-none focus:outline-none text-stone-700 font-serif text-lg leading-relaxed placeholder:text-stone-300"
                        />
                    </div>
                </div>
            </div>

            {/* =================================================================================
                COLUNA 2: LEITOR RÁPIDO
                Desktop: Width animado para 25vw.
                Mobile: Sheet Bottom-Up (Fixed z-40).
            ================================================================================= */}
            <div
                className={`
                    bg-white border-l border-stone-200 transition-all duration-300 ease-in-out
                    ${isMobile
                        ? `fixed inset-0 z-40 pt-14 transform ${readerOpen ? 'translate-y-0' : 'translate-y-full'}`
                        : `relative h-full overflow-hidden ${readerOpen ? 'w-[25vw] opacity-100' : 'w-0 opacity-0 border-l-0'}`
                    }
                `}
            >
                {/* Container interno para largura fixa durante animação desktop */}
                <div className={`${isMobile ? 'h-full w-full' : 'w-[25vw] h-full'}`}>
                    <QuickReader
                        onClose={() => setReaderOpen(false)}
                        onInsertReference={insertText}
                    />
                </div>
            </div>

            {/* =================================================================================
                COLUNA 3: BUSCA
                Desktop: Width animado para 25vw.
                Mobile: Sidebar Right-to-Left (Fixed z-50).
            ================================================================================= */}
            <div
                className={`
                    bg-white border-l border-stone-200 transition-all duration-300 ease-in-out
                    ${isMobile
                        ? `fixed inset-y-0 right-0 w-80 z-50 shadow-2xl transform ${searchOpen ? 'translate-x-0' : 'translate-x-full'}`
                        : `relative h-full overflow-hidden ${searchOpen ? 'w-[25vw] opacity-100' : 'w-0 opacity-0 border-l-0'}`
                    }
                `}
            >
                <div className={`${isMobile ? 'h-full w-full' : 'w-[25vw] h-full'}`}>
                    <BibleSearchSidebar
                        isOpen={true} // Controlado pelo container pai
                        onClose={() => setSearchOpen(false)}
                        onInsert={insertText}
                    />
                </div>
            </div>

            {/* Backdrop Mobile para Busca */}
            {isMobile && searchOpen && (
                <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
            )}
        </div>
    )
}