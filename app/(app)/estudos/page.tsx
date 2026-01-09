import { createClient } from '@/lib/supabase/server'
import { Plus, BookOpen, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EstudosListPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: studies } = await supabase
        .from('studies')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

    return (
        <div className="space-y-6 pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
                        <BookOpen className="text-amber-600" />
                        Seus Estudos
                    </h1>
                    <p className="text-stone-500 text-sm">Organize suas pregações e revelações.</p>
                </div>
                <Link
                    href="/estudos/novo"
                    className="bg-stone-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-stone-800 shadow-lg"
                >
                    <Plus size={18} /> Novo Estudo
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studies && studies.length > 0 ? studies.map((study: any) => (
                    <Link
                        key={study.id}
                        href={`/estudos/novo?id=${study.id}`} // MVP: Editar na mesma tela de novo (ajustar depois se precisar)
                        className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group"
                    >
                        <h3 className="font-bold text-lg text-stone-800 mb-2 group-hover:text-amber-800 line-clamp-1">{study.title}</h3>
                        <p className="text-stone-500 text-sm mb-4 line-clamp-3 font-serif">
                            {study.content || 'Sem conteúdo...'}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-stone-400">
                            <Clock size={12} />
                            {new Date(study.updated_at).toLocaleDateString('pt-BR')}
                        </div>
                    </Link>
                )) : (
                    <div className="col-span-full text-center py-20 bg-stone-50 rounded-xl border-dashed border-2 border-stone-200">
                        <BookOpen className="mx-auto text-stone-300 w-12 h-12 mb-2" />
                        <p className="text-stone-500">Nenhum estudo criado ainda.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
