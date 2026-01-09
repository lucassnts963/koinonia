'use client'

import React, { useState, useEffect } from 'react'
import { saveStudy, deleteStudy, getStudy } from '@/actions/study'
import BibleSearchSidebar from '@/components/study/BibleSearchSidebar'
import StudioTour from '@/components/study/StudioTour'
import { Save, ChevronLeft, Loader2, PanelRight, HelpCircle, Trash2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function NewStudyPage() {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showTour, setShowTour] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()
    const id = searchParams.get('id') // Edição

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('studio_tour_seen')
        if (!hasSeenTour) setShowTour(true)

        async function loadStudy() {
            if (!id) return;
            setLoading(true)
            try {
                const study = await getStudy(id)
                if (study) {
                    setTitle(study.title)
                    setContent(study.content || '')
                }
            } catch (e) {
                console.error("Erro ao carregar estudo", e)
            } finally {
                setLoading(false)
            }
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
        if (!confirm("Tem certeza que deseja excluir este estudo?")) return;

        setDeleting(true)
        await deleteStudy(id)
        router.push('/estudos')
    }

    const insertText = (ref: string, text: string) => {
        setContent(prev => prev + `\n\n> **${ref}**: ${text}\n`)
        setSidebarOpen(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
                <Loader2 className="animate-spin text-stone-400" size={32} />
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-6rem)] -m-4 md:-m-8 relative overflow-hidden">
            {showTour && <StudioTour onClose={() => { setShowTour(false); localStorage.setItem('studio_tour_seen', 'true') }} />}

            {/* Área Principal (Editor) */}
            <div className="flex-1 flex flex-col bg-stone-50 min-w-0">
                {/* Header do Editor */}
                <div className="bg-white border-b border-stone-200 p-3 md:p-4 flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <Link href="/estudos" className="p-2 hover:bg-stone-100 rounded text-stone-500">
                            <ChevronLeft size={20} />
                        </Link>
                        <input
                            type="text"
                            placeholder="Título do Estudo..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="flex-1 text-lg md:text-xl font-serif font-bold text-stone-800 placeholder:text-stone-300 focus:outline-none bg-transparent min-w-0"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTour(true)}
                            className="p-2 text-stone-400 hover:text-amber-500 hidden md:block"
                            title="Ajuda"
                        >
                            <HelpCircle size={20} />
                        </button>

                        {id && (
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                                title="Excluir"
                            >
                                {deleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                            </button>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-stone-900 text-white p-2 md:px-4 md:py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-stone-800 disabled:opacity-50 text-sm"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            <span className="hidden md:inline">Salvar</span>
                        </button>

                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                        >
                            <PanelRight size={24} />
                        </button>
                    </div>
                </div>

                <div id="editor-area" className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="Comece a escrever sua exegese aqui... (Markdown suportado)"
                        className="w-full h-full bg-transparent resize-none focus:outline-none text-stone-700 font-serif text-base md:text-lg leading-relaxed placeholder:text-stone-300"
                    />
                </div>
            </div>

            <BibleSearchSidebar
                onInsert={insertText}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
        </div>
    )
}
