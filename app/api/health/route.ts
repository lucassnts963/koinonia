import { NextResponse } from 'next/server'

// Endpoint de liveness usado pelo healthcheck do container e pelo Caddy.
// Não toca no banco de propósito: aqui a pergunta é "o processo Next responde?",
// não "o Supabase está de pé?". Misturar as duas coisas faz o orquestrador
// reiniciar o app por causa de indisponibilidade externa.
export const dynamic = 'force-dynamic'

export function GET() {
    return NextResponse.json({ status: 'ok', uptime: process.uptime() })
}
