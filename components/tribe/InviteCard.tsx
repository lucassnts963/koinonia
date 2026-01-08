'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function InviteCard({ username }: { username: string }) {
    const [copied, setCopied] = useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(username)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <h3 className="text-amber-900 font-bold mb-1">Convide Discípulos</h3>
            <p className="text-stone-600 text-sm mb-4">Compartilhe seu código para formar sua tribo.</p>

            <div
                onClick={copyToClipboard}
                className="bg-white border-2 border-dashed border-amber-300 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-amber-500 transition-colors group"
            >
                <span className="font-mono font-bold text-stone-700 text-lg tracking-wider ml-2">
                    {username}
                </span>
                <div className="bg-amber-100 p-2 rounded text-amber-700 group-hover:bg-amber-200">
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                </div>
            </div>
            <p className="text-[10px] text-amber-600/60 mt-2">Toque para copiar</p>
        </div>
    )
}