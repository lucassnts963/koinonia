'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PerfilResumo = {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
    stature: string | null
    stature_level: number | null
    talents_balance: number | null
    constancy_streak: number | null
}

export type Tribo = {
    id: string
    name: string
    slug: string
    description: string | null
    leader_id: string
    invite_code: string
    is_public: boolean
}

export type MembroDaTribo = {
    user_id: string
    role: 'member' | 'shepherd' | 'leader'
    joined_at: string
    profile: PerfilResumo | null
}

export type TribeData = {
    me: PerfilResumo | null
    mentor: PerfilResumo | null
    disciples: PerfilResumo[]
    /** Tribo onde eu pastoreio ou da qual sou membro. Null = ainda sem tribo. */
    tribo: Tribo | null
    membros: MembroDaTribo[]
    souLideranca: boolean
}

const CAMPOS_PERFIL =
    'id, username, full_name, avatar_url, stature, stature_level, talents_balance, constancy_streak'

export async function getTribeData(): Promise<TribeData> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autenticado")

    // 1. Buscar meus dados e quem é meu mentor
    const { data: me } = await supabase
        .from('profiles')
        .select(`${CAMPOS_PERFIL}, mentor:mentor_id (${CAMPOS_PERFIL})`)
        .eq('id', user.id)
        .single()

    // 2. Buscar meus discípulos (quem tem meu ID como mentor_id)
    const { data: disciples } = await supabase
        .from('profiles')
        .select(CAMPOS_PERFIL)
        .eq('mentor_id', user.id)
        .order('talents_balance', { ascending: false }) // Ranking por XP

    // 3. Minha tribo.
    //
    // mentor_id (discipulado 1:1) e tribe_members (grupo) são coisas
    // diferentes e continuam assim. A diferença é que agora a mesma porta de
    // entrada popula as duas, então quem tem mentor tem tribo — e a discussão,
    // que é escopada por tribo, deixa de ser inalcançável.
    //
    // Se a pessoa está em mais de uma, a que ela lidera vem primeiro: é a que
    // ela administra e onde as ações de liderança fazem sentido.
    const { data: minhasTribos } = await supabase
        .from('tribe_members')
        .select('role, joined_at, tribe:tribe_id ( id, name, slug, description, leader_id, invite_code, is_public )')
        .eq('user_id', user.id)

    const ordenadas = (minhasTribos ?? [])
        .map((m) => ({ role: m.role as MembroDaTribo['role'], tribo: m.tribe as unknown as Tribo }))
        .filter((m) => m.tribo?.id)
        .sort((a, b) => peso(b.role) - peso(a.role))

    const escolhida = ordenadas[0] ?? null
    const tribo = escolhida?.tribo ?? null

    let membros: MembroDaTribo[] = []
    if (tribo) {
        const { data } = await supabase
            .from('tribe_members')
            .select(`user_id, role, joined_at, profile:user_id ( ${CAMPOS_PERFIL} )`)
            .eq('tribe_id', tribo.id)
        membros = (data ?? []) as unknown as MembroDaTribo[]
    }

    const perfil = me as unknown as (PerfilResumo & { mentor: PerfilResumo | null }) | null

    return {
        me: perfil,
        mentor: perfil?.mentor ?? null,
        disciples: (disciples ?? []) as unknown as PerfilResumo[],
        tribo,
        membros,
        souLideranca: escolhida ? escolhida.role !== 'member' : false,
    }
}

function peso(papel: MembroDaTribo['role']) {
    return papel === 'leader' ? 2 : papel === 'shepherd' ? 1 : 0
}

/**
 * Entrar pelo username do líder — o fluxo que já existia na tela.
 *
 * Antes isto só escrevia `profiles.mentor_id` e respondia "Você agora faz
 * parte desta Tribo!". Era mentira do ponto de vista da discussão: nenhuma
 * linha entrava em `tribe_members`, então a pessoa continuava sem poder
 * conversar. Agora a mesma ação faz as duas coisas.
 */
export async function joinTribeAction(leaderUsername: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: "Faça login novamente." }

    const { data: leader } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', leaderUsername.trim())
        .maybeSingle()

    if (!leader) {
        return { success: false, message: "Líder não encontrado. Confira o nome de usuário." }
    }

    if (leader.id === user.id) {
        return { success: false, message: "Você não pode discipular a si mesmo!" }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ mentor_id: leader.id })
        .eq('id', user.id)

    if (error) {
        console.error('[joinTribeAction] mentor_id', error)
        return { success: false, message: "Erro ao definir seu líder." }
    }

    // A tribo do líder é criada sob demanda pela função; o cliente não
    // consegue fazer isso sozinho porque a policy de tribe_members exige
    // role = 'member' no insert.
    const { data: tribo, error: rpcErro } = await supabase
        .rpc('entrar_na_tribo_do_mentor', { mentor: leader.id })
        .maybeSingle<Tribo>()

    if (rpcErro) {
        // O mentor já está gravado; falhar aqui deixaria a pessoa com líder e
        // sem tribo, que é exatamente o estado quebrado que esta mudança veio
        // consertar. Melhor dizer.
        console.error('[joinTribeAction] tribo', rpcErro)
        return {
            success: false,
            message: "Seu líder foi definido, mas não consegui te colocar na tribo dele. Tente de novo.",
        }
    }

    revalidatePath('/discipulado')
    return { success: true, message: `Você agora faz parte de ${tribo?.name ?? 'uma tribo'}!` }
}

export async function criarTriboAction(nome: string, descricao?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: "Faça login novamente." }

    if (nome.trim().length < 3) {
        return { success: false, message: "Dê um nome de ao menos 3 letras à tribo." }
    }

    const { data, error } = await supabase
        .rpc('criar_tribo', { nome: nome.trim(), descricao: descricao?.trim() || null })
        .maybeSingle<Tribo>()

    if (error || !data) {
        console.error('[criarTriboAction]', error)
        return { success: false, message: "Não foi possível criar a tribo." }
    }

    revalidatePath('/discipulado')
    return { success: true, message: `Tribo "${data.name}" criada.`, tribo: data }
}

export async function entrarPorCodigoAction(codigo: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: "Faça login novamente." }

    const limpo = codigo.trim().toUpperCase()
    if (!limpo) return { success: false, message: "Digite o código de convite." }

    const { data, error } = await supabase
        .rpc('entrar_na_tribo_por_codigo', { codigo: limpo })
        .maybeSingle<Tribo>()

    if (error || !data) {
        return { success: false, message: "Código de convite inválido." }
    }

    revalidatePath('/discipulado')
    return { success: true, message: `Bem-vindo a ${data.name}.`, tribo: data }
}

export async function definirPapelAction(
    triboId: string,
    usuarioId: string,
    papel: 'member' | 'shepherd' | 'leader'
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: "Faça login novamente." }

    const { error } = await supabase.rpc('definir_papel', {
        alvo_tribo: triboId,
        alvo_usuario: usuarioId,
        novo_papel: papel,
    })

    if (error) {
        // A função levanta mensagens já legíveis ("O líder da tribo não pode
        // ser rebaixado"), então repassar é melhor do que genericizar.
        console.error('[definirPapelAction]', error)
        return { success: false, message: error.message ?? "Não foi possível mudar o papel." }
    }

    revalidatePath('/discipulado')
    return { success: true, message: "Papel atualizado." }
}
