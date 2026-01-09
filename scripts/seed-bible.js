require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const postgres = require('postgres');

const BIBLE_JSON_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_acf.json';
const dbUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function seedWithPostgres(url) {
    console.log('🔗 Tentando conexão direta via DATABASE_URL...');

    const sql = postgres(url, {
        ssl: 'require',
        connect_timeout: 10,
    });

    try {
        const response = await fetch(BIBLE_JSON_URL);
        const booksData = await response.json();

        console.log('📖 Dados baixados. Verificando Tabelas...');

        // 1. Inserir Versão
        const [version] = await sql`
            insert into bible_versions (name, slug, language)
            values ('Almeida Corrigida Fiel', 'acf', 'pt-BR')
            on conflict (slug) do update set name = excluded.name
            returning id
        `;

        let bookCounter = 1;
        let allVerses = [];

        console.log('📚 Inserindo Livros...');
        for (const book of booksData) {
            const testament = bookCounter <= 39 ? 'VT' : 'NT'; // Corrigido OT -> VT

            await sql`
                insert into bible_books (id, slug, name, testament, order_index)
                values (${bookCounter}, ${book.abbrev}, ${book.name}, ${testament}, ${bookCounter})
                on conflict (id) do update set name = excluded.name, slug = excluded.slug
            `;

            book.chapters.forEach((chapterContent, chapterIndex) => {
                chapterContent.forEach((verseText, verseIndex) => {
                    allVerses.push({
                        version_id: version.id,
                        book_id: bookCounter,
                        chapter: chapterIndex + 1,
                        verse: verseIndex + 1,
                        text: verseText
                    });
                });
            });
            bookCounter++;
        }

        console.log(`\n🚀 Inserindo ${allVerses.length} versículos...`);

        for (let i = 0; i < allVerses.length; i += 2000) {
            const batch = allVerses.slice(i, i + 2000);
            await sql`
                insert into bible_verses ${sql(batch, 'version_id', 'book_id', 'chapter', 'verse', 'text')}
            `;
            const percent = Math.round(((i + batch.length) / allVerses.length) * 100);
            process.stdout.write(`\r⏳ Progresso: ${percent}%`);
        }

        console.log('\n✨ Bíblia importada com sucesso via Postgres!');
        return true;
    } catch (err) {
        console.error('\n❌ Falha na conexão Postgres:', err.message);
        return false;
    } finally {
        await sql.end();
    }
}

async function seedWithSupabase() {
    console.log('📡 Iniciando Seed via Supabase API...');
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Erro: Variáveis NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas.');
        return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const response = await fetch(BIBLE_JSON_URL);
        const booksData = await response.json();

        console.log('✅ Versão...');
        const { data: version, error: vErr } = await supabase
            .from('bible_versions')
            .upsert({ name: 'Almeida Corrigida Fiel', slug: 'acf', language: 'pt-BR' }, { onConflict: 'slug' })
            .select().single();

        if (vErr) {
            console.error("Erro ao criar versão:", vErr);
            return;
        }

        let bookCounter = 1;
        let versesToInsert = [];

        console.log('📚 Inserindo Livros...');
        for (const book of booksData) {
            const testament = bookCounter <= 39 ? 'VT' : 'NT'; // Corrigido OT -> VT
            const { error: bErr } = await supabase.from('bible_books').upsert({
                id: bookCounter,
                slug: book.abbrev,
                name: book.name,
                testament: testament,
                order_index: bookCounter
            });

            if (bErr) {
                console.error(`\n❌ Erro ao inserir livro ${book.name}:`, bErr.message);
                return;
            }

            book.chapters.forEach((chapterContent, chapterIndex) => {
                chapterContent.forEach((verseText, verseIndex) => {
                    versesToInsert.push({
                        version_id: version.id,
                        book_id: bookCounter,
                        chapter: chapterIndex + 1,
                        verse: verseIndex + 1,
                        text: verseText
                    });
                });
            });
            process.stdout.write(`\r📚 Processado: ${book.name} (${bookCounter}/66)      `);
            bookCounter++;
        }

        console.log(`\n🚀 Inserindo ${versesToInsert.length} versículos via API...`);
        const BATCH_SIZE = 500;
        for (let i = 0; i < versesToInsert.length; i += BATCH_SIZE) {
            const batch = versesToInsert.slice(i, i + BATCH_SIZE);
            const { error: insErr } = await supabase.from('bible_verses').insert(batch);

            if (insErr) {
                console.error(`\n❌ Erro no lote ${i}:`, insErr.message);
            }

            const p = Math.round((i / versesToInsert.length) * 100);
            process.stdout.write(`\r⏳ Progresso API: ${p}%`);
        }
        console.log('\n✨ Bíblia importada com sucesso via Supabase API!');
    } catch (err) {
        console.error('\n❌ Erro fatal no script API:', err);
    }
}

async function main() {
    let success = false;
    if (dbUrl) {
        success = await seedWithPostgres(dbUrl);
    }

    if (!success) {
        await seedWithSupabase();
    }
}

main();