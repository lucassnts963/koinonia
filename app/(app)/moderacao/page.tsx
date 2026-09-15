import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, History } from 'lucide-react'
import { listarDenuncias, souLideranca } from '@/actions/moderation'
import FilaDeDenuncias from '@/components/discussion/FilaDeDenuncias'

export const dynamic = 'force-dynamic'

export default async function ModeracaoPage({
    searchParams,
}: {
    searchParams: Promise<{ historico?: string }>
}) {
    const { historico } = await searchParams
    const verHistorico = historico === '1'

    // A RPC já filtra por tribo, então quem não pastoreia veria uma tela vazia.
    // Redirecionar é mais honesto do que mostrar uma fila que nunca terá nada.
    if (!(await souLideranca())) redirect('/discipulado')

    const denuncias = await listarDenuncias(verHistorico)

    return (
        <div className="space-y-6 pb-20">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-stone-800">
                        <ShieldAlert className="text-amber-600" />
                        Moderação
                    </h1>
                    <p className="text-sm text-stone-500">
                        Denúncias das tribos que você pastoreia. Isto não mexe em Talentos nem
                        em ranking — a decisão é sua, não da maioria.
                    </p>
                </div>

                <Link
                    href={verHistorico ? '/moderacao' : '/moderacao?historico=1'}
                    className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-600 hover:border-stone-400"
                >
                    <History size={14} />
                    {verHistorico ? 'Ver só pendentes' : 'Ver resolvidas'}
                </Link>
            </header>

            <FilaDeDenuncias denuncias={denuncias} />
        </div>
    )
}
