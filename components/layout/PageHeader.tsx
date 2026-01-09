import { LucideIcon } from 'lucide-react'

export default function PageHeader({
    title,
    subtitle,
    icon: Icon
}: {
    title: string,
    subtitle: string,
    icon: LucideIcon
}) {
    return (
        <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-800 flex items-center gap-3">
                <Icon className="text-amber-600 w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
                {title}
            </h1>
            <p className="text-stone-500 text-sm md:text-base mt-2 ml-1">
                {subtitle}
            </p>
        </header>
    )
}
