import { redirect } from 'next/navigation'

export default function LeituraIndexPage() {
    // TODO: Buscar no perfil do usuário qual foi o último lido
    // Por enquanto, redireciona para o começo
    redirect('/leitura/gn/1')
}