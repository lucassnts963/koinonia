'use server'

import { getChapter, getBooks } from '@/services/bibleService'

// Wrapper simples para pegar livros no client
export async function fetchBooksList() {
    return await getBooks()
}

// Wrapper para pegar texto do capítulo no client
export async function fetchQuickChapter(bookSlug: string, chapter: number) {
    try {
        const data = await getChapter(bookSlug, chapter)
        return {
            verses: data.verses,
            bookName: data.book.name,
            chapter: data.chapter
        }
    } catch (error) {
        return null
    }
}