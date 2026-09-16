/**
 * Motor B — voz neural rodando no navegador via @diffusionstudio/vits-web
 * (modelos Piper/VITS, ONNX Runtime Web). Import sempre dinâmico: quem nunca
 * escolhe este motor não baixa uma linha sequer dessa biblioteca no bundle.
 *
 * predict() já roda em Web Worker por conta própria (não é preciso escrever
 * um worker aqui) e guarda o modelo baixado no OPFS do navegador — a
 * primeira geração de cada voz baixa o modelo; as seguintes, na mesma
 * aparelho, reaproveitam o que já está salvo.
 */
import type { VozNeuralId } from './config'

type ProgressoDownload = { url: string; total: number; loaded: number }

async function carregarLib() {
    return import('@diffusionstudio/vits-web')
}

export async function gerarAudio(
    texto: string,
    voiceId: VozNeuralId,
    aoProgredir?: (p: ProgressoDownload) => void
): Promise<Blob> {
    const tts = await carregarLib()
    return tts.predict({ text: texto, voiceId }, aoProgredir)
}

export async function tamanhoDoModelo(voiceId: VozNeuralId): Promise<number | null> {
    try {
        const tts = await carregarLib()
        const vozes = await tts.voices()
        const voz = vozes.find((v) => v.key === voiceId)
        if (!voz) return null
        return Object.values(voz.files).reduce((soma, f) => soma + f.size_bytes, 0)
    } catch {
        // voices() busca a lista no Hugging Face — sem rede, ou com o host
        // bloqueado, a UI cai para o texto de tamanho aproximado.
        return null
    }
}

export async function modelosJaBaixados(): Promise<string[]> {
    try {
        const tts = await carregarLib()
        return await tts.stored()
    } catch {
        return []
    }
}

export async function removerModeloBaixado(voiceId: VozNeuralId): Promise<void> {
    const tts = await carregarLib()
    await tts.remove(voiceId)
}

export function formatarBytes(bytes: number): string {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(0)} MB`
}
