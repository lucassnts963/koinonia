'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Map, Users, PenTool, Network, Settings, LogOut } from 'lucide-react'
import KoinoniaLogo from '@/components/brand/KoinoniaLogo'

const navItems = [
    { name: 'Início', href: '/dashboard', icon: Home },
    { name: 'Leitura', href: '/leitura', icon: BookOpen },
    { name: 'Jornada', href: '/jornada', icon: Map },
    { name: 'Estudos', href: '/estudos', icon: PenTool },
    { name: 'Teia', href: '/teia', icon: Network },
    { name: 'Tribo', href: '/discipulado', icon: Users },
    { name: 'Tenda', href: '/config', icon: Settings },
]

export default function Navigation({ user }: { user: any }) {
    const pathname = usePathname()

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-300 h-screen fixed left-0 top-0 border-r border-stone-800">
                <div className="p-6 border-b border-stone-800 flex items-center gap-3">
                    <KoinoniaLogo className="w-8 h-8 text-amber-500" />
                    <div>
                        <h1 className="font-serif font-bold text-xl text-stone-100 tracking-wide">KOINONIA</h1>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest">Discipulado</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'hover:bg-stone-800 hover:text-white'}`}
                            >
                                <item.icon size={20} className={isActive ? 'text-white' : 'text-stone-500 group-hover:text-amber-500'} />
                                <span className="font-medium text-sm">{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-stone-800">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-amber-900 border border-amber-700 flex items-center justify-center text-xs font-bold text-amber-100">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-stone-200 truncate">{user?.user_metadata?.username || 'Peregrino'}</p>
                            <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-stone-950/95 backdrop-blur border-t border-stone-800 z-50 pb-safe">
                <div className="flex justify-around items-center p-2">
                    {navItems.slice(0, 5).map((item) => { // Mostra só os 5 principais no mobile para caber
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl w-14 transition-colors ${isActive ? 'text-amber-500' : 'text-stone-500 hover:text-stone-300'}`}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
                                <span className="text-[10px] font-medium">{item.name.slice(0, 5)}</span>
                            </Link>
                        )
                    })}
                    <Link href="/config" className="flex flex-col items-center justify-center p-2 rounded-xl w-14 text-stone-500">
                        <Settings size={20} />
                        <span className="text-[10px]">Tenda</span>
                    </Link>
                </div>
            </nav>
        </>
    )
}