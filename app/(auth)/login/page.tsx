'use client'

import { useState } from 'react'
import { signIn, signUp } from '@/actions/auth'
import { Loader2, Scroll, ShieldCheck, UserPlus, KeyRound, Mail, User } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setMessage(null)

        try {
            if (isLogin) {
                const res = await signIn(formData)
                if (res?.error) setMessage({ type: 'error', text: res.error })
            } else {
                const res = await signUp(formData)
                if (res?.error) setMessage({ type: 'error', text: res.error })
                if (res?.success) setMessage({ type: 'success', text: res.success })
            }
        } catch (e) {
            // Redirects throw errors in Next.js actions, catch distinctively if needed, 
            // but typically success redirect breaks the flow here which is expected.
            // We assume simple error catch for now.
            setMessage({ type: 'error', text: 'Ocorreu um erro inesperado.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-4">

            <div className="text-center mb-8 space-y-2">
                <Link href="/">
                    <div className="bg-indigo-950 w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-indigo-900/20 shadow-xl transform rotate-3 hover:rotate-0 transition-all cursor-pointer">
                        <Scroll className="text-amber-500 w-8 h-8" />
                    </div>
                </Link>
                <h1 className="text-4xl font-serif font-bold text-indigo-950 tracking-tight">Koinonia</h1>
                <p className="text-stone-500 font-medium">
                    {isLogin ? 'Bem-vindo de volta, peregrino.' : 'Junte-se à Tribo.'}
                </p>
            </div>

            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-stone-100">

                <div className="flex bg-stone-100 p-1 rounded-xl mb-8">
                    <button
                        onClick={() => { setIsLogin(true); setMessage(null) }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-indigo-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setMessage(null) }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-indigo-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                        Cadastrar
                    </button>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-4 duration-300">
                                <label className="text-xs font-bold text-stone-500 uppercase ml-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-stone-400 w-5 h-5" />
                                    <input
                                        name="full_name"
                                        type="text"
                                        required
                                        placeholder="Ex: João da Silva"
                                        className="w-full bg-stone-50 border-stone-200 border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 animate-in fade-in slide-in-from-top-4 duration-500">
                                <label className="text-xs font-bold text-stone-500 uppercase ml-1">Nome de Peregrino (Username)</label>
                                <div className="relative">
                                    <UserPlus className="absolute left-3 top-3 text-stone-400 w-5 h-5" />
                                    <input
                                        name="username"
                                        type="text"
                                        required
                                        placeholder="Ex: joao.peregrino"
                                        className="w-full bg-stone-50 border-stone-200 border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-stone-400 w-5 h-5" />
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="seu@email.com"
                                className="w-full bg-stone-50 border-stone-200 border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase ml-1">Senha</label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3 text-stone-400 w-5 h-5" />
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                minLength={6}
                                className="w-full bg-stone-50 border-stone-200 border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in zoom-in duration-300 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                            <ShieldCheck className="w-4 h-4" />
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {isLogin ? 'Acessar Tabernáculo' : 'Iniciar Peregrinação'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-sm text-stone-400 hover:text-indigo-900 transition-colors">
                        ← Voltar para a Início
                    </Link>
                </div>
            </div>

        </div>
    )
}
