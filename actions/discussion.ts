'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export type AnchorType = 'verse' | 'passage' | 'study' | 'term' | 'plan_day'
export type ReactionKind = 'edificante' | 'me_ajudou' | 'orando'

// Talentos concedidos por PRODUZIR conteúdo, nunca por recebê-lo.
// Premiar reação recebida ensina a agradar a plateia — o oposto de discipulado.
const TALENTS_PER_DISCUSSION = 15
const TALENTS_PER_REPLY = 5
const DAILY_TALENT_CAP = 50

function getAdmin() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

/**
 * Credita Talentos respeitando um teto diário, para que volume não vire estratégia.
 * Retorna quanto foi efetivamente creditado.
 */
async function awardTalents(userId: string, amount: number): Promise<number> {
    const admin = getAdmin()
    const today = new Date().toISOString().split('T')[0]

    const { data: profile } = await admin
        .from('profiles')
        .select('talents_balance, discussion_talents_today, discussion_talents_date')
        .eq('id', userId)
        .single()

    if (!profile) return 0

    const spentToday = profile.discussion_talents_date === today
        ? (profile.discussion_talents_today || 0)
        : 0

    const granted = Math.max(0, Math.min(amount, DAILY_TALENT_CAP - spentToday))
    if (granted === 0) return 0

    await admin.from('profiles').update({
        talents_balance: (profile.talents_balance || 0) + granted,
        discussion_talents_today: spentToday + granted,
        discussion_talents_date: today,
    }).eq('id', userId)

    return granted
}

async function requireUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')
    return { supabase, user }
}

/** Discussões ancoradas em um objeto (versículo, estudo, termo). RLS filtra o escopo. */
export async function listDiscussions(anchorType: AnchorType, anchorRef: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('discussions')
        .select(`
            id, title, body, is_question, status, reply_count, edifying_count,
            last_activity_at, created_at, tribe_id,
            author:author_id ( username, stature, stature_level )
        `)
        .eq('anchor_type', anchorType)
        .eq('anchor_ref', anchorRef)
        .is('deleted_at', null)
        .order('last_activity_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('[listDiscussions]', error)
        return []
    }
    return data
}

export async function getDiscussion(id: string) {
    const supabase = await createClient()

    const { data: discussion } = await supabase
        .from('discussions')
        .select(`
            id, title, body, anchor_type, anchor_ref, is_question, status,
            answered_reply_id, reply_count, edifying_count, created_at, tribe_id,
            author:author_id ( id, username, stature, stature_level )
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single()

    if (!discussion) return null

    const { data: replies } = await supabase
        .from('discussion_replies')
        .select(`
            id, body, parent_id, edifying_count, created_at,
            author:author_id ( id, username, stature, stature_level )
        `)
        .eq('discussion_id', id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

    return { discussion, replies: replies || [] }
}

export async function createDiscussion(input: {
    tribeId: string | null
    anchorType: AnchorType
    anchorRef: string
    title: string
    body: string
    isQuestion?: boolean
}) {
    const { supabase, user } = await requireUser()

    const title = input.title.trim()
    const body = input.body.trim()

    if (title.length < 3) return { success: false, message: 'Dê um título ao tema.' }
    if (!body) return { success: false, message: 'Escreva o corpo da mensagem.' }

    const { data, error } = await supabase
        .from('discussions')
        .insert({
            tribe_id: input.tribeId,
            author_id: user.id,
            anchor_type: input.anchorType,
            anchor_ref: input.anchorRef,
            title,
            body,
            is_question: input.isQuestion ?? false,
        })
        .select('id')
        .single()

    if (error || !data) {
        console.error('[createDiscussion]', error)
        return { success: false, message: 'Não foi possível abrir a discussão.' }
    }

    const talents = await awardTalents(user.id, TALENTS_PER_DISCUSSION)

    revalidatePath(`/discussao/${data.id}`)
    return { success: true, id: data.id, talentsGained: talents }
}

export async function addReply(discussionId: string, body: string, parentId?: string) {
    const { supabase, user } = await requireUser()

    const text = body.trim()
    if (!text) return { success: false, message: 'Escreva uma resposta.' }

    const { data, error } = await supabase
        .from('discussion_replies')
        .insert({
            discussion_id: discussionId,
            parent_id: parentId ?? null,
            author_id: user.id,
            body: text,
        })
        .select('id')
        .single()

    if (error || !data) {
        console.error('[addReply]', error)
        return { success: false, message: 'Não foi possível responder.' }
    }

    const talents = await awardTalents(user.id, TALENTS_PER_REPLY)

    revalidatePath(`/discussao/${discussionId}`)
    return { success: true, id: data.id, talentsGained: talents }
}

/** Alterna a reação. Não existe reação negativa — por desenho. */
export async function toggleReaction(
    targetType: 'discussion' | 'reply',
    targetId: string,
    kind: ReactionKind
) {
    const { supabase, user } = await requireUser()

    const { data: existing } = await supabase
        .from('reactions')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .eq('kind', kind)
        .maybeSingle()

    if (existing) {
        await supabase
            .from('reactions')
            .delete()
            .eq('user_id', user.id)
            .eq('target_type', targetType)
            .eq('target_id', targetId)
            .eq('kind', kind)
        return { success: true, active: false }
    }

    const { error } = await supabase
        .from('reactions')
        .insert({ user_id: user.id, target_type: targetType, target_id: targetId, kind })

    if (error) {
        console.error('[toggleReaction]', error)
        return { success: false, active: false }
    }

    return { success: true, active: true }
}

/** Denúncia vai para o pastor da tribo — nunca afeta a pontuação do conteúdo. */
export async function flagContent(
    targetType: 'discussion' | 'reply',
    targetId: string,
    reason: string
) {
    const { supabase, user } = await requireUser()

    const { error } = await supabase
        .from('discussion_flags')
        .insert({
            target_type: targetType,
            target_id: targetId,
            reporter_id: user.id,
            reason: reason.trim(),
        })

    if (error && error.code !== '23505') {
        console.error('[flagContent]', error)
        return { success: false, message: 'Não foi possível registrar.' }
    }

    return { success: true, message: 'A liderança da sua tribo foi avisada.' }
}

/** O autor da pergunta marca qual resposta a respondeu. */
export async function markAnswered(discussionId: string, replyId: string) {
    const { supabase, user } = await requireUser()

    const { error } = await supabase
        .from('discussions')
        .update({ answered_reply_id: replyId, status: 'answered' })
        .eq('id', discussionId)
        .eq('author_id', user.id)

    if (error) {
        console.error('[markAnswered]', error)
        return { success: false }
    }

    revalidatePath(`/discussao/${discussionId}`)
    return { success: true }
}

/** Referência canônica de um estudo no acervo. */
function refDoEstudo(studyId: string) {
    return `study-${studyId}`
}

/** Já existe uma publicação deste estudo no acervo? */
export async function estudoPublicado(studyId: string): Promise<string | null> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('discussions')
        .select('id')
        .eq('anchor_type', 'study')
        .eq('anchor_ref', refDoEstudo(studyId))
        .is('deleted_at', null)
        .maybeSingle()

    return data?.id ?? null
}

/**
 * Publica um estudo privado no acervo público, virando discussão.
 *
 * É o elo entre estudar e conversar: a pessoa já escreve aqui, então
 * publicar é um clique e não "escrever de novo em outro lugar". Vai para o
 * acervo (`tribe_id = null`), não para a tribo — o acervo público recebe
 * apenas estudos publicados deliberadamente.
 */
export async function publishStudy(studyId: string) {
    const { supabase, user } = await requireUser()

    const { data: study } = await supabase
        .from('studies')
        .select('id, title, content')
        .eq('id', studyId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (!study) return { success: false, message: 'Estudo não encontrado.' }

    const corpo = study.content?.trim() ?? ''
    const titulo = study.title?.trim() ?? ''

    if (!corpo) return { success: false, message: 'Escreva o estudo antes de publicar.' }

    // Os limites são checks do banco (title 3..160, body 1..20000). Sem
    // validar aqui, um estudo longo falharia com erro cru do Postgres depois
    // de o usuário já ter confirmado a publicação.
    if (titulo.length < 3) {
        return { success: false, message: 'Dê um título de ao menos 3 letras ao estudo.' }
    }
    if (titulo.length > 160) {
        return { success: false, message: 'O título tem mais de 160 caracteres. Encurte antes de publicar.' }
    }
    if (corpo.length > 20000) {
        return {
            success: false,
            message: `O estudo tem ${corpo.length.toLocaleString('pt-BR')} caracteres; o limite do acervo é 20.000.`,
        }
    }

    // Publicar duas vezes criaria duas discussões para o mesmo estudo, cada
    // uma com suas respostas, e nenhuma delas seria "a" discussão.
    const jaPublicado = await estudoPublicado(study.id)
    if (jaPublicado) {
        return { success: false, message: 'Este estudo já está no acervo.', id: jaPublicado }
    }

    return createDiscussion({
        tribeId: null,
        anchorType: 'study',
        anchorRef: refDoEstudo(study.id),
        title: titulo,
        body: corpo,
    })
}

/** Tribos das quais o usuário é membro — usado no seletor do compositor. */
export async function listMyTribes() {
    const { supabase, user } = await requireUser()

    const { data } = await supabase
        .from('tribe_members')
        .select('role, tribe:tribe_id ( id, name, slug )')
        .eq('user_id', user.id)

    return (data ?? [])
        .map((m) => ({ ...(m.tribe as unknown as { id: string; name: string; slug: string }), role: m.role }))
        .filter((t) => t.id)
}

/**
 * Reações do usuário atual sobre um conjunto de alvos.
 *
 * Vem separado de listDiscussions/getDiscussion porque a reação é do
 * leitor, não do conteúdo: misturar as duas coisas na mesma query
 * impediria cachear a discussão, que é igual para todo mundo.
 */
export async function getMyReactions(
    targetType: 'discussion' | 'reply',
    targetIds: string[]
): Promise<Record<string, ReactionKind[]>> {
    if (targetIds.length === 0) return {}

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    const { data } = await supabase
        .from('reactions')
        .select('target_id, kind')
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .in('target_id', targetIds)

    const porAlvo: Record<string, ReactionKind[]> = {}
    for (const r of data ?? []) {
        porAlvo[r.target_id] = [...(porAlvo[r.target_id] ?? []), r.kind as ReactionKind]
    }
    return porAlvo
}
