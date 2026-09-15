'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { criarTriboAction, entrarPorCodigoAction } from '@/actions/tribe'
import { Loader2, Plus, KeyRound } from 'lucide-react'

/**
 * Porta de entrada para quem ainda não tem tribo: criar uma ou entrar por
 * código. Sem isto não existia caminho nenhum no app — a única forma de ter
 * uma tribo era rodar SQL na mão, e a discussão inteira ficava inacessível.
 */
export default function CriarTriboForm() {
    const [aba, setAba] = useState<'criar' | 'entrar'>('criar')
    const [nome, setNome] = useState('')
    const [descricao, setDescricao] = useState('')
    const [codigo, setCodigo] = useState('')
    const [erro, setErro] = useState<string | null>(null)
    const [enviando, iniciar] = useTransition()
    const router = useRouter()

    const executar = (fn: () => Promise<{ success: boolean; message?: string }>) => {
        setErro(null)
        iniciar(async () => {
            const r = await fn()
            if (!r.success) {
                setErro(r.message ?? 'Não deu certo.')
                return
            }
            router.refresh()
        })
    }

    return (
        <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="mb-4 flex gap-1 rounded-lg bg-stone-100 p-1">
                {(['criar', 'entrar'] as const).map((k) => (
                    <button
                        key={k}
                        type="button"
                        onClick={() => { setAba(k); setErro(null) }}
                        className={`flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                            aba === k ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                        }`}
                    >
                        {k === 'criar' ? 'Criar uma tribo' : 'Tenho um código'}
                    </button>
                ))}
            </div>

            {aba === 'criar' ? (
                <div className="space-y-3">
                    <input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Nome da tribo (ex: Célula Zona Sul)"
                        className="w-full rounded-lg border border-stone-200 p-2.5 text-sm focus:border-amber-400 focus:outline-none"
                    />
                    <input
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descrição (opcional)"
                        className="w-full rounded-lg border border-stone-200 p-2.5 text-sm focus:border-amber-400 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => executar(() => criarTriboAction(nome, descricao))}
                        disabled={enviando || nome.trim().length < 3}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-2.5 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-40"
                    >
                        {enviando ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                        Criar tribo
                    </button>
                    <p className="text-xs text-stone-400">
                        Você vira o líder e recebe um código para convidar sua célula.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <input
                        value={codigo}
                        // Sempre maiúsculo na tela: o código é gerado em maiúsculas e
                        // ver o que se digita batendo com o que se recebeu evita a
                        // sensação de "digitei certo e não funcionou".
                        onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                        placeholder="XS69TX"
                        maxLength={6}
                        className="w-full rounded-lg border border-stone-200 p-2.5 text-center font-mono text-lg tracking-[0.3em] focus:border-amber-400 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => executar(() => entrarPorCodigoAction(codigo))}
                        disabled={enviando || codigo.trim().length < 6}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-2.5 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-40"
                    >
                        {enviando ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                        Entrar na tribo
                    </button>
                    <p className="text-xs text-stone-400">
                        Peça o código a quem lidera sua célula.
                    </p>
                </div>
            )}

            {erro && <p className="mt-3 text-xs text-red-600">{erro}</p>}
        </div>
    )
}
