// components/SupportCard.tsx
import { Heart, Server, Shield } from 'lucide-react' // Ícones sugeridos

export default function SupportCard() {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 max-w-md mx-auto my-6">
            <div className="bg-indigo-600 p-6 text-center">
                <h3 className="text-white text-2xl font-bold font-serif">Seja uma Coluna</h3>
                <p className="text-indigo-100 mt-2 text-sm">
                    "A quem vencer, eu o farei coluna no templo do meu Deus" (Ap 3:12)
                </p>
            </div>

            <div className="p-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <Server className="w-5 h-5 text-indigo-600 mt-1" />
                        <p className="text-sm text-gray-600">
                            <span className="font-bold text-gray-800">Manter os Servidores:</span>
                            Sua oferta paga o banco de dados e a hospedagem para que o app continue rápido.
                        </p>
                    </div>

                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-indigo-600 mt-1" />
                        <p className="text-sm text-gray-600">
                            <span className="font-bold text-gray-800">Livre de Anúncios:</span>
                            Ajude-nos a manter a plataforma pura, sem propagandas seculares.
                        </p>
                    </div>
                </div>

                {/* Barra de Progresso Visual (Pode pegar via Webhook ou atualizar manual no banco) */}
                <div className="mt-6">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Meta de Custos (Mês)</span>
                        <span>65%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-center">R$ 130 de R$ 200 necessários</p>
                </div>

                <a
                    href="https://apoia.se/SEU_PROJETO"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg text-center transition transform hover:scale-105"
                >
                    Apoiar Agora com PIX
                </a>

                <p className="text-xs text-center text-gray-400 mt-3">
                    Você será redirecionado para o ambiente seguro do Apoia.se
                </p>
            </div>
        </div>
    )
}