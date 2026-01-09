'use client'

import React, { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

// Passos do Tour
const STEPS = [
    {
        title: "Bem-vindo ao Estúdio",
        description: "Este é o seu lugar de foco para escrever sermões, estudos e anotações.",
        targetId: null, // Centro
    },
    {
        title: "Editor de Texto",
        description: "Escreva suas reflexões aqui. Você pode usar Markdown simples.",
        targetId: "editor-area",
    },
    {
        title: "Busca Bíblica",
        description: "Use esta barra lateral para pesquisar versículos sem sair da tela.",
        targetId: "sidebar-area",
    },
    {
        title: "Inserção Rápida",
        description: "Ao encontrar um versículo, clique no botão (+) para inseri-lo diretamente no texto.",
        targetId: "sidebar-area", // Aponta genérico se não tiver resultado
    }
]

export default function StudioTour({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState(0)

    const currentStep = STEPS[step]

    const handleNext = () => {
        if (step < STEPS.length - 1) setStep(step + 1)
        else onClose()
    }

    const handlePrev = () => {
        if (step > 0) setStep(step - 1)
    }

    // Efeito para highlight (simples border/box-shadow overlay seria complexo de calcular position exata responsiva, 
    // vamos usar um Backdrop com z-index alto no elemento alvo se possível, ou apenas focar visualmente)
    // Para MVP rápido: Apenas um Card Modal Fixo no centro/canto com setas indicativas é mais seguro que tentar calcular coordenadas de elementos DOM.

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200">
                {/* Imagem/Header Decorativo */}
                <div className="h-32 bg-amber-100 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[url('/pattern-paper.png')] opacity-10"></div>
                    <span className="text-6xl">💡</span>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold font-sans text-amber-600 tracking-widest uppercase">
                            PASSO {step + 1} DE {STEPS.length}
                        </span>
                        <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                            <X size={18} />
                        </button>
                    </div>

                    <h3 className="text-xl font-serif font-bold text-stone-800 mb-2">
                        {currentStep.title}
                    </h3>
                    <p className="text-stone-600 text-sm leading-relaxed mb-6 h-16">
                        {currentStep.description}
                    </p>

                    <div className="flex justify-between items-center">
                        <button
                            onClick={handlePrev}
                            disabled={step === 0}
                            className="p-2 rounded-full hover:bg-stone-100 text-stone-500 disabled:opacity-30"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex gap-1.5">
                            {STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-amber-500' : 'bg-stone-200'}`}
                                ></div>
                            ))}
                        </div>

                        <button
                            onClick={handleNext}
                            className="bg-stone-900 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1 hover:bg-stone-800"
                        >
                            {step === STEPS.length - 1 ? 'Concluir' : 'Próximo'}
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
