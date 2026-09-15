import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { souLideranca } from '@/actions/moderation'
import { listarVerbetesPendentes } from '@/actions/dictionary'
import FilaDeVerbetes from '@/components/wiki/FilaDeVerbetes'

export const dynamic = 'force-dynamic'

export default async function VerbetesPendentesPage() {
    // Mesma decisão de /moderacao: quem não pastoreia nenhuma tribo não tem
    // o que aprovar aqui.
    if (!(await souLideranca())) redirect('/wiki')

    const pendentes = await listarVerbetesPendentes()

    return (
        <div className="space-y-6 pb-20">
            <Link href="/wiki" className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-amber-700">
                <ArrowLeft size={14} /> Voltar à Wiki
            </Link>

            <header>
                <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-stone-800">
                    <ShieldCheck className="text-amber-600" />
                    Verbetes Pendentes
                </h1>
                <p className="text-sm text-stone-500">
                    Rascunhos propostos por qualquer usuário, aguardando aprovação antes de virar público.
                </p>
            </header>

            <FilaDeVerbetes pendentes={pendentes} />
        </div>
    )
}
