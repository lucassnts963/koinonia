/**
 * A âncora é o motivo de a discussão existir: todo tema nasce preso a um
 * objeto do app. O link de volta é o que impede isto de virar fórum solto.
 * Extraído de app/(app)/discussao/[id]/page.tsx porque o feed da tribo
 * (discussao/tribo) precisa do mesmo mapeamento.
 */
export function linkDaAncora(tipo: string, ref: string): { href: string; rotulo: string } | null {
    if (tipo === 'verse' || tipo === 'passage') {
        // 'gn-1' ou 'gn-1:1'
        const [livro, resto] = ref.split('-')
        const capitulo = resto?.split(':')[0]
        if (livro && capitulo) {
            return { href: `/leitura/${livro}/${capitulo}`, rotulo: `${livro.toUpperCase()} ${resto}` }
        }
    }
    if (tipo === 'study') return { href: `/estudos`, rotulo: 'Estudo publicado' }
    return null
}
