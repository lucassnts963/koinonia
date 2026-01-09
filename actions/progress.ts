'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin' // Bypass RLS para gamificação segura
import { revalidatePath } from 'next/cache'

// Reutilizamos o tipo de retorno
export type ProgressResult = {
    success: boolean
    isFirstRead: boolean
    talentsGained: number
    newStreak: number
    isLevelUp: boolean
    newLevel: number
    message: string
}

export async function completeChapter(bookSlug: string, chapter: number): Promise<ProgressResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // 1. Verificar Histórico (Idempotência)
    const { data: history } = await supabase
        .from('reading_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_slug', bookSlug)
        .eq('chapter', chapter)
        .single()

    const isFirstRead = !history

    // Se já leu, não faz nada de XP, só retorna sucesso
    if (!isFirstRead) {
        return {
            success: true,
            isFirstRead: false,
            talentsGained: 0,
            newStreak: 0, // Não recalcula streak em releitura
            isLevelUp: false,
            newLevel: 0,
            message: "Capítulo já lido anteriormente."
        }
    }

    // 2. Se for inédito, salva no histórico
    // Usamos admin para garantir escrita se houver bloqueios, mas policy permite insert authenticated.
    // Vamos usar o client normal para respeitar RLS do user.
    const { error: historyError } = await supabase.from('reading_history').insert({
        user_id: user.id,
        book_slug: bookSlug,
        chapter: chapter
    })

    if (historyError) {
        console.error("Erro ao salvar histórico de leitura:", historyError)
        // Se falhar o histórico, não devemos dar XP para evitar exploit ou inconsistência
        return {
            success: false,
            isFirstRead: false,
            talentsGained: 0,
            newStreak: 0,
            isLevelUp: false,
            newLevel: 0,
            message: "Erro ao registrar leitura. Tente novamente."
        }
    }

    // 3. Executar Lógica de Gamificação (XP + Streak)
    // Buscamos perfil
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) throw new Error("Profile not found")

    // Lógica de XP (Mesma do anterior, mas agora encapsulada)
    const today = new Date().toISOString().split('T')[0]
    const lastActive = profile.last_activity_date
    let newStreak = profile.current_streak

    let isStreakUpdate = false
    if (lastActive !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        if (lastActive === yesterdayStr) {
            newStreak += 1
        } else {
            newStreak = 1
        }
        isStreakUpdate = true
    } else {
        // Já ganhou streak hoje lendo outro capitulo?
        // Se quisermos dar bonus APENAS no primeiro cap do dia, mantemos assim.
        // Se quisermos que ele continue ganhando XP normal mas sem bonus de streak, ok.
    }

    const baseXp = 10
    const bonusXp = isStreakUpdate ? Math.min(newStreak, 5) : 0
    const talentsGained = baseXp + bonusXp
    const newBalance = profile.talents_balance + talentsGained

    const currentLevel = profile.stature_level || 1
    const newLevel = Math.floor(newBalance / 100) + 1
    const isLevelUp = newLevel > currentLevel

    // Atualiza Perfil (Use admin se tiver problemas de RLS em update de campos sensíveis, mas profile user pode update own)
    await supabaseAdmin.from('profiles').update({
        talents_balance: newBalance,
        current_streak: newStreak,
        last_activity_date: today,
        stature_level: newLevel
    }).eq('id', user.id)

    revalidatePath('/dashboard')
    revalidatePath(`/leitura/${bookSlug}`)

    return {
        success: true,
        isFirstRead: true,
        talentsGained,
        newStreak,
        isLevelUp,
        newLevel,
        message: isLevelUp ? "Nova Estatura Alcançada!" : "Leitura Inédita Selada!"
    }
}
