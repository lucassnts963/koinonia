require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const postgres = require('postgres');

/**
 * Semeia UMA versão da Bíblia por execução.
 *
 *   node scripts/seed-bible.js blivre     # padrão
 *   node scripts/seed-bible.js kjv
 *   node scripts/seed-bible.js --list
 *
 * Cada fonte tem um formato próprio, então cada uma traz seu adaptador. O
 * contrato do adaptador é devolver sempre a mesma coisa:
 *   [{ order: 1..66, name, abbrev, chapters: [[versículo, ...], ...] }]
 *
 * A licença NÃO é registrada aqui: ela é do catálogo, na migration
 * 20260904140000. Semear um texto cuja versão não está catalogada falha de
 * propósito — é o que impede alguém subir uma tradução protegida sem
 * declarar sob que direito ela está no ar.
 */

const FONTES = {
    blivre: {
        url: 'https://raw.githubusercontent.com/Everson33rj/bibialivrejson/main/biblialivre.json',
        // O arquivo tem um cabeçalho de metadados no índice 0 e depois os
        // 66 livros, com chaves em português.
        adapt: (dados) => dados
            .filter((item) => Array.isArray(item.capitulos))
            .map((livro, i) => ({
                order: i + 1,
                name: livro.nome,
                abbrev: livro.abrev,
                chapters: livro.capitulos,
            })),
    },
    kjv: {
        url: 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json',
        adapt: (dados) => dados.map((book, i) => ({
            order: i + 1,
            name: book.name,
            abbrev: book.abbrev,
            chapters: book.chapters,
        })),
    },
};

const slug = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'blivre';

if (process.argv.includes('--list')) {
    console.log('Fontes com adaptador pronto:', Object.keys(FONTES).join(', '));
    console.log('Outras versões do catálogo ainda não têm fonte definida.');
    process.exit(0);
}

const fonte = FONTES[slug];
if (!fonte) {
    console.error(`✖ Sem adaptador para "${slug}". Disponíveis: ${Object.keys(FONTES).join(', ')}`);
    process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('✖ DATABASE_URL não definida. Veja .env.example.');
    process.exit(1);
}

async function main() {
    // ssl 'require' quebra contra um Postgres local sem TLS (supabase start),
    // e omitir quebra contra o Supabase gerenciado. Decide pelo host.
    const local = /(^|@)(localhost|127\.0\.0\.1)/.test(dbUrl);
    const sql = postgres(dbUrl, { ssl: local ? false : 'require', connect_timeout: 15 });

    try {
        const [versao] = await sql`
            select id, name, language, license, is_enabled
              from bible_versions where slug = ${slug}
        `;

        if (!versao) {
            throw new Error(
                `A versão "${slug}" não está no catálogo bible_versions. ` +
                `Aplique as migrations antes de semear — o catálogo é onde a licença fica declarada.`
            );
        }

        if (versao.license === 'licensed') {
            throw new Error(
                `"${versao.name}" está marcada como licensed. Não semeie sem contrato: ` +
                `o texto ficaria hospedado e servido pelo app.`
            );
        }

        console.log(`📖 ${versao.name} (${slug}, ${versao.language}) — licença: ${versao.license}`);
        console.log(`⬇️  ${fonte.url}`);

        const resposta = await fetch(fonte.url);
        if (!resposta.ok) throw new Error(`Download falhou: HTTP ${resposta.status}`);

        // Alguns arquivos vêm com BOM, que quebra o JSON.parse.
        const livros = fonte.adapt(JSON.parse((await resposta.text()).replace(/^﻿/, '')));

        if (livros.length !== 66) {
            throw new Error(`Esperava 66 livros, vieram ${livros.length}. Adaptador errado para esta fonte.`);
        }

        // `bible_books` é canônico: id, slug e nome em português. Só é
        // preenchido se estiver vazio, e NUNCA sobrescrito por uma tradução
        // em outro idioma — reading_history, annotations e a Teia guardam
        // book_slug como texto e quebrariam junto.
        const [{ count: livrosExistentes }] = await sql`select count(*)::int from bible_books`;

        const versiculos = [];
        for (const livro of livros) {
            if (livrosExistentes === 0) {
                await sql`
                    insert into bible_books (id, slug, name, testament, order_index)
                    values (${livro.order}, ${livro.abbrev}, ${livro.name},
                            ${livro.order <= 39 ? 'VT' : 'NT'}, ${livro.order})
                    on conflict (id) do nothing
                `;
            }

            // O nome no idioma da versão vive à parte.
            await sql`
                insert into bible_book_names (book_id, language, name, abbreviation)
                values (${livro.order}, ${versao.language}, ${livro.name}, ${livro.abbrev})
                on conflict (book_id, language) do update
                  set name = excluded.name, abbreviation = excluded.abbreviation
            `;

            livro.chapters.forEach((capitulo, ci) => {
                capitulo.forEach((texto, vi) => {
                    versiculos.push({
                        version_id: versao.id,
                        book_id: livro.order,
                        chapter: ci + 1,
                        verse: vi + 1,
                        text: texto,
                    });
                });
            });
        }

        if (livrosExistentes === 0) {
            console.log(`📚 66 livros cadastrados (canônicos, a partir de ${slug})`);
        } else {
            console.log(`📚 Livros já cadastrados — preservados; só os nomes em ${versao.language} foram gravados`);
        }

        // Re-semear a mesma versão substitui o texto dela, e só o dela.
        await sql`delete from bible_verses where version_id = ${versao.id}`;

        const LOTE = 2000;
        for (let i = 0; i < versiculos.length; i += LOTE) {
            await sql`insert into bible_verses ${sql(versiculos.slice(i, i + LOTE))}`;
            process.stdout.write(`\r✍️  ${Math.min(i + LOTE, versiculos.length)}/${versiculos.length} versículos`);
        }
        console.log('');

        if (!versao.is_enabled) {
            await sql`update bible_versions set is_enabled = true where id = ${versao.id}`;
            console.log('✅ Versão habilitada no catálogo.');
        }

        console.log(`✅ ${versiculos.length} versículos gravados em ${versao.name}.`);
    } finally {
        await sql.end();
    }
}

main().catch((e) => {
    console.error('\n✖', e.message);
    process.exit(1);
});
