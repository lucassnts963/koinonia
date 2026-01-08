import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/actions/auth'
import OfflineManager from '@/components/tenda/OfflineManager'
import { Settings, User, LogOut, Moon, Sun, Type } from 'lucide-react'

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

            {/* 3. Configurações de Leitura (Mock Visual) */}
            <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm opacity-60 relative">
                <div className="absolute top-2 right-2 bg-stone-200 text-stone-600 text-[10px] px-2 py-1 rounded font-bold uppercase">
                    Em Breve
                </div>
                <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <Type size={18} /> Aparência da Leitura
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <span className="text-xs text-stone-500">Tamanho da Fonte</span>
                        <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-lg border border-stone-100">
                            <button className="p-2 hover:bg-white rounded shadow-sm text-xs">Aa</button>
                            <div className="flex-1 h-1 bg-stone-200 rounded">
                                <div className="w-1/2 h-full bg-amber-500 rounded"></div>
                            </div>
                            <button className="p-2 hover:bg-white rounded shadow-sm text-lg font-bold">Aa</button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <span className="text-xs text-stone-500">Tema</span>
                        <div className="flex gap-2">
                            <button className="flex-1 p-2 bg-stone-50 border border-amber-500 rounded text-stone-800 flex justify-center">
                                <Sun size={18} />
                            </button>
                            <button className="flex-1 p-2 bg-stone-900 border border-stone-800 rounded text-stone-400 flex justify-center">
                                <Moon size={18} />
                            </button>
                        </div>
                    </div>
                </div>
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