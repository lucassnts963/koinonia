'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Plan = {
    id: string
    title: string
    description: string | null
    days_count: number
    is_system: boolean
    created_by: string | null
    tribe_id: string | null
}

export type ActivePlan = {
    id: string
    plan_id: string
    current_day: number
    completed_days: number[]
    is_completed: boolean
    updated_at: string
    plan: Plan
}

/** Jornadas visíveis ao usuário que ele ainda não começou. */
export async function getAvailablePlans() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [{ data: plans }, { data: ativos }] = await Promise.all([
        supabase.from('reading_plans').select('*').order('is_system', { ascending: false }).order('title'),
        user
            ? supabase.from('user_active_plans').select('plan_id').eq('user_id', user.id)
            : Promise.resolve({ data: [] as { plan_id: string }[] }),
    ])

    const idsAtivos = new Set((ativos ?? []).map((a) => a.plan_id))
    return ((plans ?? []) as Plan[]).filter((p) => !idsAtivos.has(p.id))
}

/**
 * Todas as jornadas em andamento do usuário — plural de propósito. O teto de
 * "uma jornada por vez" nunca existiu no schema (user_active_plans é
 * unique(user_id, plan_id), não unique(user_id)); estava só aqui, no
 * `.limit(1).single()` que esta função tinha antes.
 */
export async function getUserActivePlans(): Promise<ActivePlan[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('user_active_plans')
        .select(`
            id,
            plan_id,
            current_day,
            completed_days,
            is_completed,
            updated_at,
            plan:reading_plans (*)
        `)
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('[getUserActivePlans]', error)
        return []
    }
    return (data ?? []) as unknown as ActivePlan[]
}

/** Uma jornada ativa específica — usada quando a UI já sabe qual (via ?jornada= ou foco salvo). */
export async function getUserActivePlanById(planId: string): Promise<ActivePlan | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('user_active_plans')
        .select(`
            id,
            plan_id,
            current_day,
            completed_days,
            is_completed,
            updated_at,
            plan:reading_plans (*)
        `)
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .maybeSingle()

    if (error) console.error('[getUserActivePlanById]', error)
    return data as unknown as ActivePlan | null
}

export async function getPlanDays(planId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('plan_days')
        .select('*')
        .eq('plan_id', planId)
        .order('day_number')

    return data || []
}

export async function startPlan(planId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: existing } = await supabase
        .from('user_active_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .maybeSingle()

    if (existing) return { success: true, message: "Plano retomado!" }

    const { error } = await supabase
        .from('user_active_plans')
        .insert({
            user_id: user.id,
            plan_id: planId,
            current_day: 1
        })

    if (error) return { success: false, message: "Erro ao iniciar plano." }

    revalidatePath('/jornada')
    return { success: true, message: "Jornada Iniciada!" }
}

export async function completePlanDay(planId: string, dayNumber: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: active } = await supabase
        .from('user_active_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .single()

    if (!active) return { success: false }

    const completedSet = new Set(active.completed_days || [])
    completedSet.add(dayNumber)
    const nextDay = Math.max(active.current_day, dayNumber + 1)

    await supabase
        .from('user_active_plans')
        .update({
            completed_days: Array.from(completedSet),
            current_day: nextDay,
            updated_at: new Date().toISOString()
        })
        .eq('id', active.id)

    revalidatePath('/jornada')
    return { success: true }
}

/** Jornada em foco: a UI destaca essa e sugere focar nela quando há várias ativas. */
export async function definirJornadaEmFoco(planId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false }

    const { error } = await supabase
        .from('profiles')
        .update({ focused_plan_id: planId })
        .eq('id', user.id)

    if (error) {
        console.error('[definirJornadaEmFoco]', error)
        return { success: false }
    }
    revalidatePath('/jornada')
    return { success: true }
}

export async function getJornadaEmFoco(): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('profiles')
        .select('focused_plan_id')
        .eq('id', user.id)
        .maybeSingle()

    return data?.focused_plan_id ?? null
}

type CriarJornadaInput = {
    titulo: string
    descricao?: string
    livros: number[]
    dias: number
    tribeId?: string | null
}

/**
 * Cria uma jornada pessoal (tribeId omitido) ou da tribo (tribeId
 * preenchido) distribuindo capítulos reais entre os dias — mesma técnica de
 * scripts/seed-jornadas.js, só que a pedido de uma pessoa em vez de rodada
 * em lote. `is_system` nunca é setado aqui: nem está no INSERT, e mesmo que
 * estivesse, o grant de coluna da migration barra.
 *
 * Se tribeId vier preenchido, a policy de RLS de reading_plans exige
 * is_tribe_shepherd — quem não pastoreia a tribo recebe erro do Postgres,
 * repassado como mensagem.
 */
export async function criarJornada(input: CriarJornadaInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Faça login novamente.' }

    const titulo = input.titulo.trim()
    if (titulo.length < 3) {
        return { success: false, message: 'Dê um título com ao menos 3 letras.' }
    }
    if (!input.livros.length) {
        return { success: false, message: 'Escolha ao menos um livro.' }
    }
    if (input.dias < 1 || input.dias > 366) {
        return { success: false, message: 'Escolha entre 1 e 366 dias.' }
    }

    const { data: versao } = await supabase
        .from('bible_versions')
        .select('id')
        .eq('is_enabled', true)
        .order('sort_order')
        .limit(1)
        .maybeSingle()

    if (!versao) return { success: false, message: 'Nenhuma versão da Bíblia disponível para contar capítulos.' }

    const { data: livrosContados, error: erroContagem } = await supabase
        .rpc('contar_capitulos', { alvo_versao: versao.id, livros: input.livros })

    if (erroContagem || !livrosContados?.length) {
        console.error('[criarJornada] contagem', erroContagem)
        return { success: false, message: 'Não foi possível contar os capítulos dos livros escolhidos.' }
    }

    const capitulos: { book: string; chapter: number }[] = []
    for (const livro of livrosContados as { book_id: number; book_slug: string; capitulos: number }[]) {
        for (let c = 1; c <= livro.capitulos; c++) {
            capitulos.push({ book: livro.book_slug, chapter: c })
        }
    }

    const nDias = Math.min(input.dias, capitulos.length)
    const dias: { book: string; chapters: number[] }[][] = []
    for (let d = 0; d < nDias; d++) {
        const inicio = Math.floor((d * capitulos.length) / nDias)
        const fim = Math.floor(((d + 1) * capitulos.length) / nDias)
        const refs: { book: string; chapters: number[] }[] = []
        for (const { book, chapter } of capitulos.slice(inicio, fim)) {
            const ultimo = refs[refs.length - 1]
            if (ultimo && ultimo.book === book) ultimo.chapters.push(chapter)
            else refs.push({ book, chapters: [chapter] })
        }
        dias.push(refs)
    }

    const { data: plano, error: erroPlano } = await supabase
        .from('reading_plans')
        .insert({
            title: titulo,
            description: input.descricao?.trim() || null,
            days_count: dias.length,
            created_by: user.id,
            tribe_id: input.tribeId || null,
        })
        .select('id')
        .single()

    if (erroPlano || !plano) {
        console.error('[criarJornada] plano', erroPlano)
        const permissao = erroPlano?.code === '42501'
        return {
            success: false,
            message: permissao
                ? 'Só quem pastoreia a tribo pode criar uma jornada para ela.'
                : 'Não foi possível criar a jornada.',
        }
    }

    const { error: erroDias } = await supabase
        .from('plan_days')
        .insert(dias.map((refs, i) => ({ plan_id: plano.id, day_number: i + 1, refs })))

    if (erroDias) {
        console.error('[criarJornada] dias', erroDias)
        await supabase.from('reading_plans').delete().eq('id', plano.id)
        return { success: false, message: 'Não foi possível gravar os dias da jornada.' }
    }

    revalidatePath('/jornada')
    if (input.tribeId) revalidatePath('/jornada/gerenciar')
    return { success: true, message: `Jornada "${titulo}" criada com ${dias.length} dias.`, planId: plano.id as string }
}
