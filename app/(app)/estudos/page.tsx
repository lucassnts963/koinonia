import { createClient } from '@/lib/supabase/server'
import { Plus, BookOpen, Clock, Library } from 'lucide-react'
import Link from 'next/link'
import PublicarEstudo from '@/components/study/PublicarEstudo'

export const dynamic = 'force-dynamic'

type Estudo = {
    id: string
    title: string
    content: string | null
    updated_at: string
}

export default async function EstudosListPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase
        .from('studies')
        .select('id, title, content, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

    const studies = (data ?? []) as Estudo[]

    // Uma consulta para todos os estudos, em vez de uma por card.
    const { data: publicados } = await supabase
        .from('discussions')
        .select('id, anchor_ref')
        .eq('anchor_type', 'study')
        .in('anchor_ref', studies.map((s) => `study-${s.id}`).concat('study-nenhum'))
        .is('deleted_at', null)

    const discussaoDoEstudo = new Map<string, string>(
        (publicados ?? []).map((d) => [d.anchor_ref.replace(/^study-/, ''), d.id])
    )

    return (
        <div className="space-y-6 pb-20">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-stone-800">
                        <BookOpen className="text-amber-600" />
                        Seus Estudos
                    </h1>
                    <p className="text-sm text-stone-500">Organize suas pregações e revelações.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/acervo"
                        className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-600 hover:border-amber-400"
                    >
                        <Library size={16} /> Acervo
                    </Link>
                    <Link
                        href="/estudos/novo"
                        className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 font-bold text-white shadow-lg hover:bg-stone-800"
                    >
                        <Plus size={18} /> Novo Estudo
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {studies.length > 0 ? studies.map((study) => (
                    // O card deixou de ser um <Link> inteiro: publicar é uma ação
                    // dentro dele, e botão aninhado em link não funciona.
                    <article
                        key={study.id}
                        className="group flex flex-col rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-amber-400 hover:shadow-md"
                    >
                        <Link href={`/estudos/novo?id=${study.id}`} className="flex-1">
                            <h3 className="mb-2 line-clamp-1 text-lg font-bold text-stone-800 group-hover:text-amber-800">
                                {study.title}
                            </h3>
                            <p className="mb-4 line-clamp-3 font-serif text-sm text-stone-500">
                                {study.content || 'Sem conteúdo...'}
                            </p>
                        </Link>

                        <div className="flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
                            <span className="flex items-center gap-1 text-xs text-stone-400">
                                <Clock size={12} />
                                {new Date(study.updated_at).toLocaleDateString('pt-BR')}
                            </span>
                            <PublicarEstudo
                                studyId={study.id}
                                publicadoComoId={discussaoDoEstudo.get(study.id) ?? null}
                                compacto
                            />
                        </div>
                    </article>
                )) : (
                    <div className="col-span-full rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 py-20 text-center">
                        <BookOpen className="mx-auto mb-2 h-12 w-12 text-stone-300" />
                        <p className="text-stone-500">Nenhum estudo criado ainda.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
