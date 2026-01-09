'use client'

import { useState } from 'react'
import { signIn, signUp } from '@/actions/auth'
import { Loader2, ShieldCheck, UserPlus, KeyRound, Mail, User } from 'lucide-react'
import KoinoniaLogo from '@/components/brand/KoinoniaLogo'
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
            setMessage({ type: 'error', text: 'Ocorreu um erro inesperado.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorativo */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-amber-50 to-transparent pointer-events-none" />

            <div className="text-center mb-8 space-y-4 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Link href="/">
                    <div className="mx-auto w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-stone-100 transform hover:scale-105 transition-transform duration-300">
                        <KoinoniaLogo className="w-12 h-12 text-amber-600" />
                    </div>
                </Link>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Koinonia</h1>
                    <p className="text-xs font-bold tracking-[0.2em] text-amber-600 uppercase mt-1">Discipulado</p>
                </div>
                <p className="text-stone-500 text-sm max-w-xs mx-auto">
                    {isLogin ? 'Retorne à comunhão.' : 'Inicie sua jornada sagrada hoje.'}
                </p>
            </div>

            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl shadow-stone-200/50 p-6 md:p-8 border border-stone-100 relative z-10 animate-in zoom-in-95 duration-500">

                {/* Toggle Login/Sign Up */}
                <div className="flex bg-stone-100 p-1 rounded-lg mb-6">
                    <button
                        onClick={() => { setIsLogin(true); setMessage(null) }}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${isLogin ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setMessage(null) }}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${!isLogin ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        Cadastro
                    </button>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider ml-1">Nome Completo</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-2.5 text-stone-300 w-4 h-4 group-focus-within:text-amber-500 transition-colors" />
                                    <input
                                        name="full_name"
                                        type="text"
                                        required
                                        placeholder="Seu nome"
                                        className="w-full bg-stone-50 border-stone-200 border rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-stone-300 text-stone-700"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-400">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider ml-1">Username</label>
                                <div className="relative group">
                                    <UserPlus className="absolute left-3 top-2.5 text-stone-300 w-4 h-4 group-focus-within:text-amber-500 transition-colors" />
                                    <input
                                        name="username"
                                        type="text"
                                        required
                                        placeholder="seu.usuario"
                                        className="w-full bg-stone-50 border-stone-200 border rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-stone-300 text-stone-700"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider ml-1">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-2.5 text-stone-300 w-4 h-4 group-focus-within:text-amber-500 transition-colors" />
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="exemplo@email.com"
                                className="w-full bg-stone-50 border-stone-200 border rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-stone-300 text-stone-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider ml-1">Senha</label>
                        <div className="relative group">
                            <KeyRound className="absolute left-3 top-2.5 text-stone-300 w-4 h-4 group-focus-within:text-amber-500 transition-colors" />
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                minLength={6}
                                className="w-full bg-stone-50 border-stone-200 border rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-stone-300 text-stone-700"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in zoom-in duration-300 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                            <ShieldCheck className="w-4 h-4" />
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-stone-900 hover:bg-black text-white font-bold py-3 rounded-xl shadow-lg shadow-stone-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isLogin ? 'Entrar na Tenda' : 'Criar Conta'}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-stone-100">
                    <Link href="/" className="text-xs text-stone-400 hover:text-amber-600 transition-colors font-medium">
                        ← Voltar para a Início
                    </Link>
                </div>
            </div>
        </div>
    )
}
