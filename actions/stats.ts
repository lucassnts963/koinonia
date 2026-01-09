'use server'

import { createClient } from '@/lib/supabase/server'

// TOTAL DE CAPÍTULOS (ACF)
// OT: 929, NT: 260 => Total: 1189
// Em produção, isso deveria vir de uma query count real `bible_books join chapters` 
// mas para MVP vamos usar constantes para performance.
const TOTAL_OT = 929
const TOTAL_NT = 260
const TOTAL_BIBLE = 1189

export async function getReadingStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { ot: 0, nt: 0, total: 0 }

    // Buscar todos os capitulos lidos pelo usuario, juntando com a info do livro
    const { data: history } = await supabase
        .from('reading_history')
        .select(`
            bible_books!inner (
                testament
            )
        `)
        .eq('user_id', user.id)

    if (!history) return { ot: 0, nt: 0, total: 0 }

    let countOT = 0
    let countNT = 0

    history.forEach((entry: any) => {
        if (entry.bible_books.testament === 'OT' || entry.bible_books.testament === 'VT') {
            countOT++
        } else {
            countNT++
        }
    })

    const totalRead = countOT + countNT

    return {
        ot: Math.round((countOT / TOTAL_OT) * 100),
        nt: Math.round((countNT / TOTAL_NT) * 100),
        total: Math.round((totalRead / TOTAL_BIBLE) * 100),
        countOT,
        countNT,
        totalRead
    }
}
