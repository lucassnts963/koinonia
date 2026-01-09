import { getTeiaData, GraphData } from '@/actions/teia'
import ForceGraphWrapper from '@/components/teia/ForceGraphWrapper'
import { Network } from 'lucide-react'

export const dynamic = 'force-dynamic' // evitar cache estático já que dados mudam

export default async function TeiaPage() {
    const data: GraphData = await getTeiaData()

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-3">
                    <Network className="text-amber-600" />
                    A Teia do Conhecimento
                </h1>
                <p className="text-stone-500 mt-1">
                    Explore as conexões divinas entre as Escrituras.
                    <br />
                    <span className="text-xs flex gap-3 mt-2">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-600"></span> Antigo Testamento</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Novo Testamento</span>
                    </span>
                </p>
            </header>

            {/* Client Component do Grafo (Wrapper) */}
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden h-[600px] relative">
                <ForceGraphWrapper data={data} />

                {data.nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                        <p className="text-stone-500">Nenhuma conexão encontrada ainda. Comece a ler e anotar!</p>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                <h3 className="font-bold text-stone-700 mb-2">Como usar?</h3>
                <ul className="text-sm text-stone-600 space-y-2 list-disc pl-4">
                    <li>Arraste para mover a constelação.</li>
                    <li>Use a roda do mouse (ou pinça) para dar <strong>Zoom</strong>.</li>
                    <li>Clique nos nós (estrelas) para ir direto ao versículo.</li>
                </ul>
            </div>
        </div>
    )
}