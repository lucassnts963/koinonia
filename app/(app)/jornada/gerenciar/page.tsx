import { redirect } from 'next/navigation'
import { souLideranca } from '@/actions/moderation'
import { getTribosQueLidero, getProgressoDaTribo } from '@/actions/jornadas-tribo'
import { getBooks } from '@/services/bibleService'
import { Compass } from 'lucide-react'
import GerenciarJornadasTribo from '@/components/jornada/GerenciarJornadasTribo'

export const dynamic = 'force-dynamic'

export default async function GerenciarJornadasPage({
    searchParams,
}: {
    searchParams: Promise<{ tribo?: string }>
}) {
    // Mesma decisão de /moderacao: sem tribo para pastorear, a tela não tem
    // o que mostrar — redirecionar é mais honesto que uma tela vazia.
    if (!(await souLideranca())) redirect('/discipulado')

    const { tribo: triboParam } = await searchParams
    const [tribos, livros] = await Promise.all([getTribosQueLidero(), getBooks()])

    if (tribos.length === 0) redirect('/discipulado')

    const triboSelecionada = tribos.find((t) => t.id === triboParam) ?? tribos[0]
    const progresso = await getProgressoDaTribo(triboSelecionada.id)

    return (
        <div className="space-y-6 pb-20">
            <header>
                <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-stone-800">
                    <Compass className="text-amber-600" />
                    Gerenciar Jornadas
                </h1>
                <p className="text-sm text-stone-500">
                    Crie jornadas para os discípulos da sua tribo e acompanhe o progresso de cada um.
                    Ninguém é matriculado à força — a jornada aparece como opção, e cada um decide entrar.
                </p>
            </header>

            <GerenciarJornadasTribo
                tribos={tribos}
                triboSelecionadaId={triboSelecionada.id}
                progresso={progresso}
                livros={livros}
            />
        </div>
    )
}
