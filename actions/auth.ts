'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signIn(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: 'Credenciais inválidas. Verifique seu email e senha.' }
    }

    // Se tudo certo, redireciona
    redirect('/dashboard')
}

export async function signUp(formData: FormData) {
    const origin = (await headers()).get('origin')
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string
    const fullName = formData.get('full_name') as string

    const supabase = await createClient()

    const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
            data: {
                username: username,
                full_name: fullName,
                stature: 'Neófito', // Valor inicial para gamificação
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    // Nota: A criação do perfil na tabela 'public.profiles' deve ser feita via Trigger no Postgres
    // ou manualmente aqui se a trigger não existir, mas o ideal é Trigger para consistência.

    // Vamos garantir a criação manual caso a trigger falhe ou não exista no MVP
    if (data.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: data.user.id,
                username: username,
                stature: 'Neófito',
                talents_balance: 0,
                constancy_streak: 0
            })
        if (profileError) {
            console.error('Erro ao criar perfil:', profileError)
        }
    }

    return { success: 'Cadastro realizado! Verifique seu email (inclusive SPAM) para confirmar.' }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
