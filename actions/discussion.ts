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

/** Publica um estudo privado no acervo público, virando discussão. */
export async function publishStudy(studyId: string) {
    const { supabase, user } = await requireUser()

    const { data: study } = await supabase
        .from('studies')
        .select('id, title, content')
        .eq('id', studyId)
        .eq('user_id', user.id)
        .single()

    if (!study) return { success: false, message: 'Estudo não encontrado.' }
    if (!study.content?.trim()) return { success: false, message: 'Estudo vazio.' }

    return createDiscussion({
        tribeId: null,
        anchorType: 'study',
        anchorRef: `study-${study.id}`,
        title: study.title,
        body: study.content,
    })
}
