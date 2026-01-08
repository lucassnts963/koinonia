import Dexie, { Table } from 'dexie';

export interface OfflineVerse {
    id?: number;
    version_id: number;
    book_id: number;
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
    }
}

export const db = new KoinoniaDB();
