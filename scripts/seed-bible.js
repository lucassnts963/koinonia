require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente ausentes.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// URL direta do JSON "Cru" (Raw)
const BIBLE_JSON_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_acf.json';

async function seedBible() {
    console.log('🌐 Baixando a Bíblia direto do GitHub...');

    try {
        // 1. Baixar o JSON
        const response = await fetch(BIBLE_JSON_URL);
        if (!response.ok) throw new Error(`Falha ao baixar JSON: ${response.statusText}`);
        const booksData = await response.json();

        console.log('📖 Download concluído. Iniciando a importação no Supabase...');

        // 2. Criar a Versão
        const { data: version, error: vError } = await supabase
            .from('bible_versions')
            .upsert({ name: 'Almeida Corrigida Fiel', slug: 'acf', language: 'pt-BR' }, { onConflict: 'slug' })
            .select()
            .single();

        if (vError) throw vError;
        console.log(`✅ Versão verificada: ${version.name} (ID: ${version.id})`);

        let versesToInsert = [];
        let bookCounter = 1;

        // 3. Processar Livros
        for (const book of booksData) {
            const testament = bookCounter <= 39 ? 'OT' : 'NT';

            // --- A CORREÇÃO ESTÁ AQUI ABAIXO ---
            // Adicionamos "name: book.name"
            const { error: bookError } = await supabase.from('bible_books').upsert({
                id: bookCounter,
                slug: book.abbrev,
                name: book.name, // <--- CAMPO QUE FALTAVA
                testament: testament,
                order_index: bookCounter
            });
            // -----------------------------------

            if (bookError) {
                console.error(`❌ Erro ao inserir livro ${book.name}:`, bookError);
                // Se falhar o livro, não tentamos os versículos desse livro
                continue;
            }

            console.log(`📚 Processando Livro ${bookCounter}: ${book.name}`);

            // Processar Capítulos e Versículos
            book.chapters.forEach((chapterContent, chapterIndex) => {
                const chapterNum = chapterIndex + 1;

                chapterContent.forEach((verseText, verseIndex) => {
                    const verseNum = verseIndex + 1;

                    versesToInsert.push({
                        version_id: version.id,
                        book_id: bookCounter,
                        chapter: chapterNum,
                        verse: verseNum,
                        text: verseText
                    });
                });
            });

            bookCounter++;
        }

        // 4. Inserção em Lote (Batch Insert)
        const BATCH_SIZE = 1000;

        if (versesToInsert.length === 0) {
            console.log("⚠️ Nenhum versículo encontrado para inserir. Verifique se os livros foram criados.");
            return;
        }

        console.log(`🚀 Preparando para inserir ${versesToInsert.length} versículos...`);

        for (let i = 0; i < versesToInsert.length; i += BATCH_SIZE) {
            const batch = versesToInsert.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('bible_verses').insert(batch);

            if (error) {
                console.error(`❌ Erro no lote ${i}:`, error.message);
            } else {
                const percent = Math.round(((i + batch.length) / versesToInsert.length) * 100);
                process.stdout.write(`\r⏳ Progresso: ${percent}%`);
            }
        }

        console.log('\n✨ Bíblia importada com sucesso para a Glória de Deus!');

    } catch (err) {
        console.error('\n❌ Erro fatal no script:', err);
    }
}

seedBible();