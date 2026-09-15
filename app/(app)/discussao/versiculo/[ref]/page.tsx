import Link from 'next/link'
import { ChevronLeft, Anchor } from 'lucide-react'
import DiscussaoAncorada from '@/components/discussion/DiscussaoAncorada'

export const dynamic = 'force-dynamic'

/**
 * Discussão ancorada num versículo.
 *
 * O bloco de discussão é Server Component (a RLS filtra no servidor), e
 * InteractiveVerse é client — então em vez de aninhar um no outro, o
 * versículo aponta para cá. A referência é `<livro>-<cap>:<verso>`, mesmo
 * formato que linkDaAncora() em /discussao/[id] sabe desmontar de volta.
 */
export default async function DiscussaoDoVersiculo({
    params,
}: {
    params: Promise<{ ref: string }>
}) {
    const { ref } = await params
    const anchorRef = decodeURIComponent(ref)

    const [livro, resto] = anchorRef.split('-')
    const capitulo = resto?.split(':')[0]
    const versiculo = resto?.split(':')[1]

    const voltar = livro && capitulo ? `/leitura/${livro}/${capitulo}` : '/leitura'
    const rotulo = `${livro?.toUpperCase() ?? ''} ${resto ?? ''}`.trim()

    return (
        <div className="space-y-6 pb-20">
            <Link
                href={voltar}
                className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
            >
                <ChevronLeft size={16} /> Voltar ao capítulo
            </Link>

            <header>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
                    <Anchor size={12} /> {rotulo}
                </span>
                <h1 className="mt-3 font-serif text-2xl font-bold text-stone-800">
                    Conversa sobre o versículo
                </h1>
                <p className="text-sm text-stone-500">
                    {versiculo
                        ? 'O que sua tribo viu neste versículo.'
                        : 'O que sua tribo viu nesta passagem.'}
                </p>
            </header>

            <DiscussaoAncorada anchorType="verse" anchorRef={anchorRef} titulo="Discussões" />
        </div>
    )
}
