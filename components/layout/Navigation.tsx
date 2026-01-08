'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home,
    BookOpen,
    Network,
    Users,
    Settings,
    Menu
} from 'lucide-react'
import { cn } from '@/lib/utils' // Certifique-se de ter essa função utilitária do shadcn/tailwind

const navItems = [
    { name: 'Início', href: '/dashboard', icon: Home },
    { name: 'Bíblia', href: '/leitura', icon: BookOpen }, // Será redirecionado para o último lido
    { name: 'A Teia', href: '/teia', icon: Network },
    { name: 'Tribo', href: '/discipulado', icon: Users },
    { name: 'Tenda', href: '/config', icon: Settings },
]

export function Navigation() {
    const pathname = usePathname()

    return (
        <>
            {/* SIDEBAR (Desktop) */}
            <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-300 h-screen fixed border-r border-stone-800">
                <div className="p-6">
                    <h1 className="text-2xl font-serif font-bold text-amber-500 tracking-tighter">
                        KOINONIA
                    </h1>
                    <p className="text-xs text-stone-500">Discipulado Digital</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                    isActive
                                        ? "bg-amber-900/20 text-amber-500 font-medium"
                                        : "hover:bg-stone-800 hover:text-white"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-stone-800">
                    {/* Espaço para Avatar do Usuário Resumido */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-xs font-bold text-white">
                            EU
                        </div>
                        <div className="text-xs">
                            <p className="text-white">Meu Perfil</p>
                            <p className="text-stone-500">Nível: Discípulo</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* BOTTOM NAV (Mobile) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-stone-900 border-t border-stone-800 z-50 pb-safe">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1",
                                    isActive ? "text-amber-500" : "text-stone-500"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive && "fill-current")} />
                                <span className="text-[10px] font-medium">{item.name}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}