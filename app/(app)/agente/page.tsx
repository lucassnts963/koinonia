import { Sparkles } from 'lucide-react'
import AgenteChat from '@/components/agente/AgenteChat'

export const dynamic = 'force-dynamic'

export default function AgentePage() {
    return (
        <div className="space-y-4 h-full">
            <header>
                <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-stone-800">
                    <Sparkles className="text-amber-600" />
                    Agente
                </h1>
            </header>

            <AgenteChat />
        </div>
    )
}
