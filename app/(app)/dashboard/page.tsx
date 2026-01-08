import { supabase } from '@/lib/supabaseClient'
import { Scroll, Flame, Target } from 'lucide-react'

export default async function DashboardPage() {

    const { data: { user } } = await supabase.auth.getUser()

    // Buscar perfil (No futuro faremos um Service para isso)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    return (
        <div className="space-y-6">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-stone-800">
                    Graça e Paz, {profile?.full_name?.split(' ')[0] || 'Irmão'}!
                </h1>
                <p className="text-stone-500">Vamos continuar sua jornada hoje?</p>
            </header>

            {/* Grid de Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-2">
                        <Flame size={20} />
                    </div>
                    <span className="text-2xl font-bold text-stone-800">{profile?.current_streak || 0}</span>
                    <span className="text-xs text-stone-500 uppercase font-bold tracking-wider">Dias Constantes</span>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-2">
                        <Target size={20} />
                    </div>
                    <span className="text-2xl font-bold text-stone-800">{profile?.talents_balance || 0}</span>
                    <span className="text-xs text-stone-500 uppercase font-bold tracking-wider">Talentos</span>
                </div>
            </div>

            {/* Versículo do Dia (Placeholder) */}
            <div className="bg-stone-900 text-stone-300 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <Scroll className="absolute top-4 right-4 text-stone-800 w-24 h-24 opacity-20 rotate-12" />
                <h3 className="text-amber-500 text-sm font-bold uppercase tracking-widest mb-2">Maná do Dia</h3>
                <p className="text-xl font-serif text-white italic mb-4">
                    "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho."
                </p>
                <p className="text-sm font-bold text-amber-500 text-right">— Salmos 119:105</p>
            </div>
        </div>
    )
}