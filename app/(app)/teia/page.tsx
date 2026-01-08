import { getKnowledgeGraph } from '@/actions/graph'
import ForceGraphWrapper from '@/components/teia/ForceGraphWrapper'
import { Network } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeiaPage() {
    const graphData = await getKnowledgeGraph()

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

            {/* Área do Grafo Interativo */}
            <div className="w-full flex justify-center">
                <ForceGraphWrapper data={graphData} />
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