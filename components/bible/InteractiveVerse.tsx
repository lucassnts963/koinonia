'use client'

import { useState } from 'react'
import { getDefinition } from '@/actions/dictionary'
import { Loader2, Book } from 'lucide-react'

export default function InteractiveVerse({ text, verseNumber }: { text: string, verseNumber: number }) {
    const [loadingWord, setLoadingWord] = useState<string | null>(null)

    // Estado para mostrar a definição (pode substituir por um Modal do ShadcnUI depois)
    const [definition, setDefinition] = useState<{ term: string, text: string } | null>(null)

    const words = text.split(' ')

    const handleWordClick = async (word: string) => {
        // Remove pontuação para visualização
        const cleanWord = word.replace(/[.,;!?()"]/g, '')
        if (cleanWord.length < 3) return

        setLoadingWord(word)
        try {
            const result = await getDefinition(word)
            if (result) {
                // Aqui você abriria um Modal bonitão. 
                // Por enquanto vamos usar um alert customizado na tela
                setDefinition({ term: result.data.term, text: result.data.definition })
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingWord(null)
        }
    }

    return (
        <div className="relative mb-6">
            {/* O Versículo */}
            <p className="text-lg md:text-xl font-serif leading-relaxed text-stone-700">
                <span className="text-xs font-sans text-stone-400 font-bold mr-2 select-none align-top mt-1 inline-block">
                    {verseNumber}
                </span>

                {words.map((word, i) => (
                    <span
                        key={i}
                        onClick={() => handleWordClick(word)}
                        className={`
              inline-block mr-1 cursor-pointer rounded px-0.5 transition-colors duration-200
              ${loadingWord === word ? 'bg-amber-200 animate-pulse' : 'hover:bg-amber-100 hover:text-amber-800'}
            `}
                    >
                        {word}
                    </span>
                ))}
            </p>

            {/* Mini Modal de Definição (Aparece logo abaixo do versículo se houver definição ativa) */}
            {definition && (
                <div className="mt-2 p-4 bg-stone-100 border-l-4 border-amber-500 rounded-r shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-amber-700 capitalize flex items-center gap-2">
                            <Book size={16} />
                            {definition.term}
                        </h4>
                        <button
                            onClick={() => setDefinition(null)}
                            className="text-xs text-stone-400 hover:text-stone-600"
                        >
                            FECHAR
                        </button>
                    </div>
                    <p className="text-stone-600 text-sm mt-1 font-sans">
                        {definition.text}
                    </p>
                </div>
            )}
        </div>
    )
}