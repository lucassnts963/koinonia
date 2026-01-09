'use client'
import { useState } from 'react'
import { getDefinition } from '@/actions/dictionary'

export default function BibleText({ text, lang }: { text: string, lang: string }) {
    const [selectedWord, setSelectedWord] = useState(null)
    const words = text.split(' ')

    const handleWordClick = async (word: string) => {
        // Limpeza básica (remover pontuação como vírgulas ou pontos)
        const cleanWord = word.replace(/[.,;!?]/g, '')

        // Chama a Server Action
        const result = await getDefinition(cleanWord, lang)
        if (result.success) {
            // Mostrar Modal ou Tooltip com result.data.definition
            console.log(result.data.definition)
        }
    }

    return (
        <p>
            {words.map((word, index) => (
                <span
                    key={index}
                    onClick={() => handleWordClick(word)}
                    className="cursor-pointer hover:bg-yellow-200 hover:text-black transition-colors"
                >
                    {word}{' '}
                </span>
            ))}
        </p>
    )
}