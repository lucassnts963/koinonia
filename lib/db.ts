import Dexie, { Table } from 'dexie';

export interface OfflineVerse {
    id?: number;
    /** Slug da versão ('blivre', 'kjv'). */
    version_slug: string;
    /** Slug do livro ('gn', 'sl') — o mesmo que o resto do app usa. */
    book_slug: string;
    chapter: number;
    verse: number;
    text: string;
}

// Dictionary can also be cached offline
export interface OfflineDictionary {
    term: string;
    definition: string;
}

export class KoinoniaDB extends Dexie {
    verses!: Table<OfflineVerse>;
    dictionary!: Table<OfflineDictionary>;

    constructor() {
        super('KoinoniaOfflineDB');
        this.version(1).stores({
            verses: '++id, [version_id+book_id+chapter], text',
            dictionary: 'term'
        });

        // v2: o índice era [version_id+book_id+chapter], mas o download sempre
        // gravou version_slug/book_slug — nenhum registro casava com o índice.
        // Passou despercebido porque nada lê este store ainda. Slug é a chave
        // certa: é o que o resto do app usa (reading_history, annotations, a
        // Teia) e não depende de id numérico do servidor.
        this.version(2).stores({
            verses: '++id, [version_slug+book_slug+chapter], text',
            dictionary: 'term'
        }).upgrade(tx => tx.table('verses').clear());
    }
}

export const db = new KoinoniaDB();
