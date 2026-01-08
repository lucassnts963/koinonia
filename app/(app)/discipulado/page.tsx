import { getTribeData } from '@/actions/tribe'
import JoinTribeForm from '@/components/tribe/JoinTribeForm'
import InviteCard from '@/components/tribe/InviteCard'
import { Users, Crown, Shield, Medal } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DiscipuladoPage() {
    const { me, mentor, disciples } = await getTribeData()

    return (
        <div className="space-y-8 pb-20">
            <header>
                <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
                    <Users className="text-amber-600" />
                    Minha Tribo
                </h1>
                <p className="text-stone-500 text-sm">
                    "Ferro com ferro se afia, e o homem ao seu próximo." (Pv 27:17)
                </p>
            </header>

            {/* 1. Área do Mentor (Minha Cobertura) */}
            <section>
                <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Shield size={12} /> Minha Cobertura
                </h2>

                {mentor ? (
                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-xl">
                            👑
                        </div>
                        <div>
                            <p className="font-bold text-stone-800">{mentor.full_name}</p>
                            <p className="text-xs text-stone-500">Líder Nível {mentor.stature_level}</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-stone-100 p-4 rounded-xl border border-stone-200 border-dashed text-center">
                        <p className="text-stone-500 text-sm mb-2">Você ainda não tem um líder espiritual aqui.</p>
                        <JoinTribeForm />
                    </div>
                )}
            </section>

            {/* 2. Área dos Discípulos (Ranking) */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                        <Crown size={12} /> Meus Discípulos ({disciples.length})
                    </h2>
                </div>

                {disciples.length > 0 ? (
                    <div className="space-y-3">
                        {disciples.map((disciple, index) => (
                            <div key={disciple.id} className="bg-white p-3 rounded-lg border border-stone-100 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                                        {index + 1}º
                                    </div>
                                    <div>
                                        <p className="font-bold text-stone-700 text-sm">{disciple.full_name || 'Discípulo'}</p>
                                        <p className="text-[10px] text-stone-400">@{disciple.username}</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="text-amber-600 font-bold text-sm flex items-center justify-end gap-1">
                                        {disciple.talents_balance} <Medal size={12} />
                                    </span>
                                    <p className="text-[10px] text-stone-400">Nível {disciple.stature_level}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center bg-white rounded-xl border border-stone-100">
                        <Users className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                        <p className="text-stone-400 text-sm">Sua tribo ainda está vazia.</p>
                        <p className="text-stone-400 text-xs">Comece a discipular hoje!</p>
                    </div>
                )}
            </section>

            {/* 3. Área de Convite */}
            <section>
                <InviteCard username={me?.username || 'user'} />
            </section>
        </div>
    )
}