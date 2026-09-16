/**
 * Extrai texto plano de markdown para virar fala — sem isto, o TTS lê
 * "asterisco asterisco palavra asterisco asterisco" em vez da palavra em
 * negrito. Cobre só a sintaxe que os verbetes/estudos deste app realmente
 * usam (ReactMarkdown básico); não é um parser completo de propósito.
 */
export function paraTextoFalavel(markdown: string): string {
    return markdown
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/^>\s?/gm, '')
        .replace(/^[-*+]\s+(.*)$/gm, '$1.')
        .replace(/^\d+\.\s+(.*)$/gm, '$1.')
        .replace(/\n{2,}/g, '. ')
        .replace(/\n/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
}
