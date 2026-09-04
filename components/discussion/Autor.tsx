import { UserRound } from 'lucide-react'

export type AutorInfo = {
    id?: string
    username: string | null
    stature: string | null
    stature_level: number | null
} | null

/** Assinatura do autor. Mostra Estatura porque é o vocabulário do app. */
export default function Autor({ autor, quando }: { autor: AutorInfo; quando?: string }) {
    return (
        <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-200 text-stone-500">
                <UserRound size={13} />
            </span>
            <span className="font-bold text-stone-700">{autor?.username ?? 'Anônimo'}</span>
            {autor?.stature && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {autor.stature}
                    {autor.stature_level ? ` · Estatura ${autor.stature_level}` : ''}
                </span>
            )}
            {quando && (
                <time dateTime={quando} className="text-stone-400">
                    {new Date(quando).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </time>
            )}
        </div>
    )
}
