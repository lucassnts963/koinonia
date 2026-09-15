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

    // Sem redirect() aqui de propósito: esta função é chamada a partir de
    // app/(auth)/login/page.tsx dentro de um try/catch manual no cliente
    // (não como `action` direto de um <form>). redirect() funciona
    // lançando uma exceção especial — o catch local a intercepta antes do
    // Next.js tratá-la, e mostra "Ocorreu um erro inesperado" mesmo o
    // login (e o redirecionamento por baixo) tendo dado certo. Quem
    // decide navegar agora é o cliente, com router.push, fora de qualquer
    // try/catch.
    return { success: true }
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
            // A rota real é app/(auth)/callback/route.ts -> /callback, não
            // /auth/callback (que nunca existiu). O link de confirmação por
            // e-mail dava 404 antes desta correção.
            emailRedirectTo: `${origin}/callback`,
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
