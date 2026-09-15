/**
 * `constancy_streak` só é recalculado dentro de `completeChapter`
 * (`actions/progress.ts`), e só quando o capítulo lido é inédito. Quem some
 * por meses e volta sem ler nada novo continua com o valor antigo gravado —
 * o dashboard mostrava esse número cru, como se ainda representasse "hoje".
 *
 * A gravação em si está correta (zera para 1 quando `last_activity_date` não
 * é ontem); o que faltava era o LEITOR saber que um valor gravado há meses
 * não é mais uma sequência viva. Esta função não escreve nada — só decide o
 * que mostrar.
 *
 * `hoje`/`ontem` usam a mesma base (data ISO em UTC) que `progress.ts` usa
 * para gravar `last_activity_date`, para as duas pontas não divergirem por
 * fuso horário.
 */
export function constanciaEfetiva(
    lastActivityDate: string | null | undefined,
    streakGravado: number | null | undefined
): number {
    if (!lastActivityDate) return 0

    const hoje = new Date().toISOString().split('T')[0]
    const ontem = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]

    if (lastActivityDate === hoje || lastActivityDate === ontem) {
        return streakGravado || 0
    }

    // A sequência quebrou. O número antigo continua no banco (é o "recorde"
    // implícito até uma tela própria de recorde existir), mas não é "hoje".
    return 0
}
