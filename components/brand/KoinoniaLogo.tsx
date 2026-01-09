export default function KoinoniaLogo({ className = "w-8 h-8", color = "currentColor" }: { className?: string, color?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Círculo Base (Unidade) */}
            <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="8" className="opacity-20" />

            {/* Triunidade Entrelaçada (Estilizada Geometrica) */}
            <path
                d="M50 20 L25 80 L75 80 Z"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-80"
            />
            {/* Peixe (Ichthys) Implícito no cruzamento */}
            <path
                d="M25 45 Q50 20 75 45 T25 45"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                className="opacity-60"
            />
        </svg>
    )
}
