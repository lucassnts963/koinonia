'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getMonthDevotionals(year: number, month: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Formata para buscar o mês inteiro (ex: '2023-10-01' a '2023-10-31')
    // Nota: Mês em JS começa em 0, mas aqui esperamos o número real (1-12)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`

    const { data } = await supabase
        .from('studies')
        .select('id, title, scheduled_date, created_at')
        .eq('user_id', user.id)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)

    return data || []
}

export async function openDevotionalDay(dateStr: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // 1. Tenta achar um estudo existente nesta data
    const { data: existing } = await supabase
        .from('studies')
        .select('id')
        .eq('user_id', user.id)
        .eq('scheduled_date', dateStr)
        .limit(1)
        .single()

    if (existing) {
        // Redireciona para o editor com o ID existente
        redirect(`/estudos/novo?id=${existing.id}`)
    }

    // 2. Se não existe, CRIA um novo rascunho
    const { data: newStudy, error } = await supabase
        .from('studies')
        .insert({
            user_id: user.id,
            title: `Devocional de ${new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`,
            content: '',
            scheduled_date: dateStr
        })
        .select('id')
        .single()

    if (error) {
        console.error("Erro ao criar devocional:", error)
        throw new Error("Falha ao criar devocional")
    }

    // 3. Redireciona para o editor
    redirect(`/estudos/novo?id=${newStudy.id}`)
}