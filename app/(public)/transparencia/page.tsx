import { supabase } from '@/lib/supabaseClient';
import { ExternalLink, Heart, TrendingUp, TrendingDown } from 'lucide-react';

export const revalidate = 3600; // Update every hour

async function getData() {
    // In a real scenario, handle errors gracefully
    const { data: costs } = await supabase.from('project_costs').select('amount');
    const { data: donations } = await supabase.from('donations').select('amount');

    const totalCosts = costs?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
    const totalDonations = donations?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

    return { totalCosts, totalDonations };
}

export default async function TransparenciaPage() {
    const { totalCosts, totalDonations } = await getData();
    const balance = totalDonations - totalCosts;

    // Calculate percentages for bars
    // If total is 0, avoid usage of 0 in max calculation to prevent full bars visually if both are 0
    const max = Math.max(totalCosts, totalDonations, 100);
    const costPercent = Math.min((totalCosts / max) * 100, 100);
    const donationPercent = Math.min((totalDonations / max) * 100, 100);

    return (
        <div className="min-h-screen bg-[#F5F5F0] text-gray-900 p-4 md:p-8 font-sans">
            <div className="max-w-3xl mx-auto space-y-10">
                <header className="text-center space-y-2">
                    <h1 className="text-4xl font-serif font-bold text-indigo-950">Transparência do Reino</h1>
                    <p className="text-gray-600">
                        "Pois zelamos do que é honesto, não só diante do Senhor, mas também diante dos homens."
                        <br /><span className="text-xs font-semibold uppercase tracking-wider text-gray-400">2 Coríntios 8:21</span>
                    </p>
                </header>

                {/* Chart Card */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            Fluxo do Tesouro
                        </h2>
                        <span className="text-xs font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-500">Últimos 30 dias</span>
                    </div>

                    <div className="space-y-6">
                        {/* Donations Bar */}
                        <div className="group">
                            <div className="flex justify-between text-sm mb-2 items-end">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <div className="p-1 bg-green-100 rounded">
                                        <TrendingUp size={16} className="text-green-600" />
                                    </div>
                                    <span className="font-medium">Ofertas (Entradas)</span>
                                </div>
                                <span className="text-green-700 font-bold text-lg">R$ {totalDonations.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-green-500 h-full rounded-full opacity-90 group-hover:opacity-100 transition-all duration-1000 ease-out"
                                    style={{ width: `${donationPercent}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Costs Bar */}
                        <div className="group">
                            <div className="flex justify-between text-sm mb-2 items-end">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <div className="p-1 bg-red-100 rounded">
                                        <TrendingDown size={16} className="text-red-500" />
                                    </div>
                                    <span className="font-medium">Custos (Saídas)</span>
                                </div>
                                <span className="text-red-700 font-bold text-lg">R$ {totalCosts.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-red-500 h-full rounded-full opacity-90 group-hover:opacity-100 transition-all duration-1000 ease-out"
                                    style={{ width: `${costPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-dashed border-gray-200 flex flex-col items-center justify-center">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Saldo Atual</span>
                        <div className={`text-4xl font-bold tracking-tight ${balance >= 0 ? 'text-indigo-900' : 'text-red-600'}`}>
                            R$ {balance.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Call to Action: Seja uma Coluna */}
                <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-5 transform translate-x-10 -translate-y-10">
                        <Heart size={300} fill="currentColor" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-2xl font-bold font-serif mb-3 text-indigo-50">Seja uma Coluna</h3>
                            <p className="text-indigo-200 text-sm leading-relaxed max-w-md">
                                Ajude-nos a manter a plataforma acessível a todos.
                                Sua generosidade permite que a palavra corra e seja glorificada.
                            </p>
                        </div>

                        <a
                            href="https://apoia.se/koinonia"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whitespace-nowrap inline-flex items-center gap-2 bg-[#F5F5F0] text-indigo-900 px-6 py-4 rounded-xl font-bold hover:bg-white hover:scale-105 transition-all shadow-lg text-sm md:text-base"
                        >
                            Apoiar o Projeto
                            <ExternalLink size={18} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
