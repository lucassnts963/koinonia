import Navigation from '@/components/layout/Navigation'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSafeUser } from '@/lib/supabase/auth'
import { souLideranca } from '@/actions/moderation'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // MUDANÇA AQUI: Use getSession() ao invés de getUser() para o MVP local
    const user = await getSafeUser(supabase)

    if (!user) {
        console.log("[Layout] Usuário não autenticado. Redirecionando...")
        redirect('/login')
    }

    // O link de moderação só faz sentido para quem pastoreia alguma tribo —
    // a fila de denúncias de todo mundo mais estaria sempre vazia.
    const pastoreia = await souLideranca()

    return (
        <div className="min-h-screen bg-stone-50">
            <Navigation user={user} mostrarModeracao={pastoreia} />
            <main className="md:pl-64 min-h-screen pb-20 md:pb-0 transition-all">
                <div className="max-w-4xl mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}