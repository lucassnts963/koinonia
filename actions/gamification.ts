'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js' // Importamos o admin client manualmente aqui
import { revalidatePath } from 'next/cache'

export type ProgressResult = {
    success: boolean
    isFirstRead: boolean
    talentsGained: number
    newStreak: number
    isLevelUp: boolean
    newLevel: number
    message: string
}

// Função auxiliar para definir o Título baseado no Nível
function getStatureTitle(level: number): 'Neófito' | 'Discípulo' | 'Obreiro' | 'Mestre' {
    if (level < 10) return 'Neófito'
    if (level < 50) return 'Discípulo'
    if (level < 100) return 'Obreiro'
    return 'Mestre'
}

export async function completeChapter(bookSlug: string, chapter: number): Promise<ProgressResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    // 1. Verificar Histórico (Idempotência)
    // Verifica se o usuário JÁ leu este capítulo específico
    const { data: history } = await supabase
        .from('reading_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_slug', bookSlug)
        .eq('chapter', chapter)
        .single()

    const isFirstRead = !history

    // Se já leu, retorna sucesso mas SEM dar XP
    if (!isFirstRead) {
        return {
            success: true,
            isFirstRead: false,
            talentsGained: 0,
            newStreak: 0,
            isLevelUp: false,
            newLevel: 0,
            message: "Capítulo já lido anteriormente."
        }
    }

    // 2. Se for inédito, salva no histórico
    const { error: historyError } = await supabase.from('reading_history').insert({
        user_id: user.id,
        book_slug: bookSlug,
        chapter: chapter
    })

    if (historyError) {
        console.error("Erro ao salvar histórico:", historyError)
        return { success: false, isFirstRead: false, talentsGained: 0, newStreak: 0, isLevelUp: false, newLevel: 0, message: "Erro ao salvar leitura." }
    }

    // 3. Gamificação (Usando Admin Client para garantir permissão de escrita no Profile)
    // Instanciamos o Admin Client aqui para não depender de arquivo externo
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('constancy_streak, talents_balance, stature_level, last_activity_date')
        .eq('id', user.id)
        .single()

    if (!profile) throw new Error("Profile not found")

    // --- Lógica de Streak (Constância) ---
    const today = new Date().toISOString().split('T')[0]
    const lastActive = profile.last_activity_date

    // Cuidado com valores nulos no banco (primeiro acesso)
    let newStreak = profile.constancy_streak || 0
    let isStreakUpdate = false

    if (lastActive !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        if (lastActive === yesterdayStr) {
            // Leu ontem, leu hoje -> Aumenta +1
            newStreak += 1
        } else {
            // Não leu ontem -> Reseta para 1
            newStreak = 1
        }
        isStreakUpdate = true
    }
    // Se lastActive === today, mantém o streak atual (não aumenta 2x no mesmo dia)

    // --- Lógica de Talentos (XP) ---
    const baseXp = 10
    // Só dá bônus de streak se for a primeira leitura do dia (quando atualiza o streak)
    const bonusXp = isStreakUpdate ? Math.min(newStreak, 5) : 0
    const talentsGained = baseXp + bonusXp

    const currentBalance = profile.talents_balance || 0
    const newBalance = currentBalance + talentsGained

    // --- Lógica de Nível (Estatura) ---
    const currentLevel = profile.stature_level || 1
    // Fórmula: Nível = (Talentos / 100) + 1. Ex: 150 talentos = Nível 2.
    const newLevel = Math.floor(newBalance / 100) + 1
    const isLevelUp = newLevel > currentLevel

    // Define o título em texto baseado no nível numérico
    const newStatureTitle = getStatureTitle(newLevel)

    // 4. Atualiza Perfil
    await supabaseAdmin.from('profiles').update({
        talents_balance: newBalance,
        constancy_streak: newStreak, // Nome correto da coluna
        last_activity_date: today,
        stature_level: newLevel,     // Coluna numérica nova
        stature: newStatureTitle     // Coluna de texto (Neófito, etc)
    }).eq('id', user.id)

    // Revalida caches para a UI atualizar instantaneamente
    revalidatePath('/dashboard')
    revalidatePath(`/leitura/${bookSlug}`)

    return {
        success: true,
        isFirstRead: true,
        talentsGained,
        newStreak,
        isLevelUp,
        newLevel,
        message: isLevelUp ? `Nova Estatura: ${newStatureTitle}!` : "Leitura Selada!"
    }
}