interface Cost {
    id: number;
    service_name: string;
    amount_usd: number;
}

interface Donation {
    id: number;
    net_amount_brl: number;
}

interface TransparencyMeterProps {
    costs: Cost[];
    donations: Donation[];
}

export default function TransparencyMeter({ costs, donations }: TransparencyMeterProps) {
    const totalCost = costs.reduce((acc: number, item: Cost) => acc + item.amount_usd, 0)
    // Convertendo doações BRL para USD (apenas visual) ou mantendo tudo em BRL
    const totalDonated = donations.reduce((acc: number, item: Donation) => acc + item.net_amount_brl, 0)

    const percentage = Math.min((totalDonated / totalCost) * 100, 100)
    const isCovered = totalDonated >= totalCost

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Manutenção do Templo Digital</h3>
            <p className="text-sm text-gray-600 mb-4">
                Nossa meta é cobrir os custos de servidor para manter a palavra acessível a todos.
                Não visamos lucro, apenas sustentabilidade.
            </p>

            {/* A Barra de Progresso */}
            <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                            Meta do Mês
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-blue-600">
                            {Math.round(percentage)}%
                        </span>
                    </div>
                </div>
                <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-blue-100">
                    <div style={{ width: `${percentage}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${isCovered ? 'bg-green-500' : 'bg-blue-500'}`}>
                    </div>
                </div>
            </div>

            <div className="flex justify-between text-sm font-mono mt-2">
                <span>Arrecadado: R$ {totalDonated.toFixed(2)}</span>
                <span>Custo: R$ {totalCost.toFixed(2)}</span>
            </div>

            {/* Breakdown dos custos */}
            <div className="mt-6 text-xs text-gray-500">
                <h4 className="font-bold mb-2">Detalhamento dos Custos:</h4>
                <ul>
                    {costs.map(cost => (
                        <li key={cost.id} className="flex justify-between border-b py-1">
                            <span>{cost.service_name}</span>
                            <span>R$ {cost.amount_usd.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <button className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition">
                Ofertar para o Servidor
            </button>
        </div>
    )
}