import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/actions/auth'
import OfflineManager from '@/components/tenda/OfflineManager'
import AparenciaLeitura from '@/components/tenda/AparenciaLeitura'
import ConfiguracaoAudio from '@/components/tenda/ConfiguracaoAudio'
import { Settings, User, LogOut } from 'lucide-react'

// Server Action temporária para o botão de sair
// Em projetos reais, isso estaria no actions/auth.ts
async function handleSignOut() {
    'use server'
    await signOut()
}

export default async function TendaPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    return (
        <div className="space-y-8 pb-20">
            <header>
                <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
                    <Settings className="text-amber-600" />
                    Minha Tenda
                </h1>
                <p className="text-stone-500 text-sm">
                    Ajuste sua experiência e prepare seus mantimentos.
                </p>
            </header>

            {/* 1. Cartão de Perfil */}
            <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-2xl border-4 border-white shadow-sm">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User className="text-amber-600" size={32} />
                    )}
                </div>
                <div className="flex-1">
                    <h2 className="font-bold text-lg text-stone-800">{profile?.full_name || 'Peregrino'}</h2>
                    <p className="text-stone-500 text-sm">@{profile?.username}</p>
                    <div className="mt-2 inline-flex items-center px-2 py-1 bg-stone-100 rounded text-xs text-stone-600 font-mono">
                        ID: {profile?.id.split('-')[0]}...
                    </div>
                </div>
            </section>

            {/* 2. Gerenciador Offline (Dexie) */}
            <section>
                <OfflineManager />
            </section>

            {/* 3. Aparência da Leitura — real agora, não decorativo */}
            <section>
                <AparenciaLeitura />
            </section>

            {/* 3b. Leitura em áudio */}
            <section>
                <ConfiguracaoAudio />
            </section>

            {/* 4. Zona de Perigo / Logout */}
            <section>
                <form action={handleSignOut}>
                    <button
                        type="submit"
                        className="w-full py-4 text-red-600 font-bold bg-red-50 rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2"
                    >
                        <LogOut size={20} />
                        Sair do Acampamento
                    </button>
                </form>
                <p className="text-center text-xs text-stone-400 mt-4">
                    Koinonia MVP v0.1.0 • Soli Deo Gloria
                </p>
            </section>
        </div>
    )
}