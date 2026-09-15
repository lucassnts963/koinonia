import Link from 'next/link'
import { getTribeData } from '@/actions/tribe'
import JoinTribeForm from '@/components/tribe/JoinTribeForm'
import InviteCard from '@/components/tribe/InviteCard'
import CriarTriboForm from '@/components/tribe/CriarTriboForm'
import MembrosList from '@/components/tribe/MembrosList'
import { Users, Crown, Shield, Medal, MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DiscipuladoPage() {
    const { me, mentor, disciples, tribo, membros, souLideranca } = await getTribeData()

    return (
        <div className="space-y-8 pb-20">
            <header>
                <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-stone-800">
                    <Users className="text-amber-600" />
                    Minha Tribo
                </h1>
                <p className="text-sm text-stone-500">
                    &ldquo;Ferro com ferro se afia, e o homem ao seu próximo.&rdquo; (Pv 27:17)
                </p>
            </header>

            {/* 1. A tribo em si — é o escopo das discussões. */}
            <section>
                <h2 className="mb-3 flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-stone-400">
                    <Users size={12} /> A Tribo
                </h2>

                {tribo ? (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-stone-200 bg-white p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-serif text-lg font-bold text-stone-800">{tribo.name}</h3>
                                    {tribo.description && (
                                        <p className="mt-1 text-sm text-stone-500">{tribo.description}</p>
                                    )}
                                    <p className="mt-2 text-xs text-stone-400">
                                        {membros.length} {membros.length === 1 ? 'membro' : 'membros'}
                                    </p>
                                </div>
                                {souLideranca && (
                                    <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-800">
                                        Você pastoreia
                                    </span>
                                )}
                            </div>

                            <p className="mt-4 border-t border-stone-100 pt-4 text-xs text-stone-500">
                                As discussões nascem dentro de um capítulo, estudo ou termo — mas
                                você não precisa ir atrás de onde cada uma começou.{' '}
                                <Link href="/discussao/tribo" className="font-bold text-amber-700 hover:underline">
                                    Ver discussões da tribo
                                </Link>
                                {' '}ou{' '}
                                <Link href="/leitura" className="font-bold text-amber-700 hover:underline">
                                    ir para a leitura
                                </Link>
                                {' '}para começar uma nova.
                            </p>
                        </div>

                        <MembrosList
                            triboId={tribo.id}
                            membros={membros}
                            podeGerenciar={souLideranca}
                            meuId={me?.id ?? ''}
                            liderId={tribo.leader_id}
                        />

                        {/* Convidar é ação de qualquer membro, não só de quem lidera —
                            o código identifica a tribo, não quem convidou. RLS de
                            `tribes` já libera a leitura do invite_code para qualquer
                            membro (is_tribe_member), então isto é só liberar a UI. */}
                        <InviteCard codigo={tribo.invite_code} nomeDaTribo={tribo.name} />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4">
                            <p className="flex items-start gap-2 text-sm text-stone-600">
                                <MessageSquare size={16} className="mt-0.5 shrink-0 text-stone-400" />
                                <span>
                                    Você ainda não está em nenhuma tribo. A discussão sobre a Bíblia
                                    acontece dentro dela — sem tribo, dá para ler, mas não para conversar.
                                </span>
                            </p>
                        </div>
                        <CriarTriboForm />
                    </div>
                )}
            </section>

            {/* 2. Discipulado 1:1 — outra coisa, de propósito. */}
            <section>
                <h2 className="mb-3 flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-stone-400">
                    <Shield size={12} /> Minha Cobertura
                </h2>

                {mentor ? (
                    <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-xl">
                            👑
                        </div>
                        <div>
                            <p className="font-bold text-stone-800">
                                {mentor.full_name || mentor.username}
                            </p>
                            <p className="text-xs text-stone-500">Líder Nível {mentor.stature_level ?? 1}</p>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-stone-200 bg-stone-100 p-4 text-center">
                        <p className="mb-2 text-sm text-stone-500">
                            Você ainda não tem um líder espiritual aqui.
                        </p>
                        {/* Aceitar um mentor também te coloca na tribo dele. */}
                        <JoinTribeForm />
                    </div>
                )}
            </section>

            {/* 3. Discípulos (ranking) */}
            <section>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-stone-400">
                        <Crown size={12} /> Meus Discípulos ({disciples.length})
                    </h2>
                </div>

                {disciples.length > 0 ? (
                    <div className="space-y-3">
                        {disciples.map((disciple, index) => (
                            <div
                                key={disciple.id}
                                className="flex items-center justify-between rounded-lg border border-stone-100 bg-white p-3 shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                                        {index + 1}º
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-stone-700">
                                            {disciple.full_name || 'Discípulo'}
                                        </p>
                                        <p className="text-[10px] text-stone-400">@{disciple.username}</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="flex items-center justify-end gap-1 text-sm font-bold text-amber-600">
                                        {disciple.talents_balance} <Medal size={12} />
                                    </span>
                                    <p className="text-[10px] text-stone-400">
                                        Nível {disciple.stature_level ?? 1}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-stone-100 bg-white py-8 text-center">
                        <Users className="mx-auto mb-2 h-8 w-8 text-stone-200" />
                        <p className="text-sm text-stone-400">Você ainda não discipula ninguém.</p>
                        <p className="text-xs text-stone-400">
                            Quem entrar com seu nome de usuário aparece aqui.
                        </p>
                    </div>
                )}
            </section>
        </div>
    )
}
