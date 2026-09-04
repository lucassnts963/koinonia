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

    const { error } = await supabase.auth.signUp({
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

    // O perfil é criado pela trigger `on_auth_user_created` (migration
    // 20260904130000), que lê username e full_name do metadata acima.
    //
    // O insert manual que existia aqui foi removido: ele escrevia
    // talents_balance e constancy_streak, colunas que o cliente não pode
    // mais tocar — a gamificação agora só é gravável pelo service role.

    return { success: 'Cadastro realizado! Verifique seu email (inclusive SPAM) para confirmar.' }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
