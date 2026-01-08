'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type RewardResult = {
    success: boolean
    talentsGained: number
    newStreak: number
    isLevelUp: boolean
    newLevel: number
    message: string
}

export async function completeChapterAction(bookSlug: string, chapter: number): Promise<RewardResult> {
    const supabase = await createClient()

    // 1. Identificar Usuário
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado")

    // 2. Buscar Perfil Atual
    const { data: profile } = await supabase
        .from('profiles')
        .select('talents_balance, current_streak, last_activity_date, stature_level')
        .eq('id', user.id)
        .single()

    if (!profile) throw new Error("Perfil não encontrado")

    // 3. Calcular Constância (Streak)
    const today = new Date().toISOString().split('T')[0] // AAAA-MM-DD
    const lastActive = profile.last_activity_date

    let newStreak = profile.current_streak

    // Se a última atividade não foi hoje...
    if (lastActive !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        if (lastActive === yesterdayStr) {
            // Leu ontem, leu hoje -> Aumenta streak
            newStreak += 1
        } else {
            // Quebrou a constância (não leu ontem) -> Reseta ou começa
            newStreak = 1
        }
    }
    // Se já leu hoje, mantemos o streak (não aumenta 2x no mesmo dia)

    // 4. Calcular Talentos (XP)
    // Base: 10 talentos por capítulo + Bônus por Streak
    const baseXp = 10
    const bonusXp = Math.min(newStreak, 5) // Máximo de 5 de bônus por streak
    const talentsGained = baseXp + bonusXp
    const newBalance = (profile.talents_balance || 0) + talentsGained

    // 5. Calcular Estatura (Level Up)
    // Fórmula simples: Nível sobe a cada 100 Talentos
    const currentLevel = profile.stature_level || 1
    const calculatedLevel = Math.floor(newBalance / 100) + 1
    const isLevelUp = calculatedLevel > currentLevel

    // 6. Atualizar Banco de Dados
    const { error } = await supabase
        .from('profiles')
        .update({
            talents_balance: newBalance,
            current_streak: newStreak,
            last_activity_date: today,
            stature_level: calculatedLevel,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) {
        console.error("Erro ao salvar progresso:", error)
        return { success: false, talentsGained: 0, newStreak: 0, isLevelUp: false, newLevel: 0, message: "Erro ao salvar" }
    }

    // Atualiza cache das páginas para mostrar novo XP no header imediatamente
    revalidatePath('/app')

    return {
        success: true,
        talentsGained,
        newStreak,
        isLevelUp,
        newLevel: calculatedLevel,
        message: isLevelUp ? "Nova Estatura Alcançada!" : "Leitura Selada!"
    }
}