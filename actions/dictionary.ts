'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { supabase } from '@/lib/supabaseClient'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function getDefinition(term: string, language: string = 'pt-BR') {


    // 1. Tenta buscar no banco (Cache First)
    // Usamos ilike para ignorar maiúsculas/minúsculas
    const { data: existingEntry } = await supabase
        .from('dictionary_entries')
        .select('*')
        .ilike('term', term)
        .eq('language_code', language)
        .single()

    if (existingEntry) {
        return { success: true, data: existingEntry, source: 'database' }
    }

    // 2. Se não achou, chama a IA (Fallback)
    try {
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Modelo rápido e barato
            messages: [
                {
                    role: "system",
                    content: `You are a biblical scholar and theologian assistant. 
          Define the term provided strictly within a biblical and Christian context. 
          Keep it concise (max 3 sentences). 
          Output only the definition text.
          Language: ${language}.`
                },
                {
                    role: "user",
                    content: `Define: "${term}"`
                }
            ],
            temperature: 0.3, // Baixa criatividade para evitar alucinações teológicas
        })

        const definition = aiResponse.choices[0].message.content

        // 3. Salva no banco para o futuro (Memoization)

        const { data: newEntry, error } = await supabaseAdmin
            .from('dictionary_entries')
            .insert({
                term: term, // Capitalize se quiser padronizar
                definition: definition,
                language_code: language,
                source: 'ai_generated'
            })
            .select()
            .single()

        if (error) throw error

        return { success: true, data: newEntry, source: 'ai' }

    } catch (error) {
        console.error("Dictionary Error:", error)
        return { success: false, error: "Could not define term" }
    }
}