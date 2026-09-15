require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const postgres = require('postgres');

/**
 * Gera as jornadas "do sistema" (is_system = true) a partir da contagem real
 * de capítulos em bible_verses — nenhuma referência é digitada à mão, então
 * uma tradução com capitulação diferente (rara entre protestantes, mas
 * existe) não pode produzir um dia com capítulo inexistente.
 *
 *   node scripts/seed-jornadas.js               # usa a versão de menor sort_order
 *   node scripts/seed-jornadas.js --versao=kjv   # conta capítulos por essa versão
 */

const JORNADAS = [
    { titulo: 'Bíblia em 365 Dias', dias: 365, livros: null, descricao: 'A Bíblia inteira, do Gênesis ao Apocalipse, em um ano.' },
    { titulo: 'Evangelhos em 40 Dias', dias: 40, livros: [40, 41, 42, 43], descricao: 'Mateus, Marcos, Lucas e João em 40 dias.' },
];

const versaoArg = process.argv.find((a) => a.startsWith('--versao='));
const versaoSlug = versaoArg ? versaoArg.split('=')[1] : null;

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('✖ DATABASE_URL não definida. Veja .env.example.');
    process.exit(1);
}

// Distribui `capitulos` (lista ordenada de {book_slug, chapter}) em `nDias`
// dias por bucketing de índice fracionário — cada dia cobre
// [floor(d*total/nDias), floor((d+1)*total/nDias)), o que garante pelo menos
// 1 capítulo por dia sempre que nDias <= total, sem sobra manual para
// distribuir. Capítulos consecutivos do mesmo livro dentro de um dia viram
// um único {book, chapters: [...]}; troca de livro no meio do dia vira uma
// segunda entrada no array de refs.
function distribuir(capitulos, nDias) {
    const total = capitulos.length;
    if (nDias > total) {
        throw new Error(`Pedindo ${nDias} dias para ${total} capítulos — sobrariam dias vazios.`);
    }

    const dias = [];
    for (let d = 0; d < nDias; d++) {
        const inicio = Math.floor((d * total) / nDias);
        const fim = Math.floor(((d + 1) * total) / nDias);
        const fatia = capitulos.slice(inicio, fim);

        const refs = [];
        for (const { book_slug, chapter } of fatia) {
            const ultimo = refs[refs.length - 1];
            if (ultimo && ultimo.book === book_slug) {
                ultimo.chapters.push(chapter);
            } else {
                refs.push({ book: book_slug, chapters: [chapter] });
            }
        }
        dias.push(refs);
    }
    return dias;
}

async function main() {
    const local = /(^|@)(localhost|127\.0\.0\.1)/.test(dbUrl);
    const sql = postgres(dbUrl, { ssl: local ? false : 'require', connect_timeout: 15 });

    try {
        const [versao] = versaoSlug
            ? await sql`select id, slug from bible_versions where slug = ${versaoSlug} and is_enabled`
            : await sql`select id, slug from bible_versions where is_enabled order by sort_order limit 1`;

        if (!versao) {
            throw new Error('Nenhuma versão habilitada encontrada para contar capítulos.');
        }
        console.log(`📖 Contando capítulos reais a partir de "${versao.slug}"`);

        const linhas = await sql`
            select b.id as book_id, b.slug as book_slug, max(v.chapter) as capitulos
              from public.bible_verses v
              join public.bible_books b on b.id = v.book_id
             where v.version_id = ${versao.id}
             group by b.id, b.slug
             order by b.id
        `;

        if (linhas.length !== 66) {
            throw new Error(`Esperava 66 livros com versículos, achei ${linhas.length}. A versão "${versao.slug}" está incompleta?`);
        }

        for (const jornada of JORNADAS) {
            const livrosAlvo = jornada.livros
                ? linhas.filter((l) => jornada.livros.includes(l.book_id))
                : linhas;

            const capitulos = [];
            for (const livro of livrosAlvo) {
                for (let c = 1; c <= livro.capitulos; c++) {
                    capitulos.push({ book_slug: livro.book_slug, chapter: c });
                }
            }

            const dias = distribuir(capitulos, jornada.dias);
            const somaCapitulos = dias.reduce((acc, refs) => acc + refs.reduce((a, r) => a + r.chapters.length, 0), 0);
            if (somaCapitulos !== capitulos.length) {
                throw new Error(`Distribuição perdeu capítulos: ${somaCapitulos} de ${capitulos.length}.`);
            }

            const [existente] = await sql`
                select id from reading_plans where title = ${jornada.titulo} and is_system
            `;
            let planId;
            if (existente) {
                planId = existente.id;
                await sql`update reading_plans set description = ${jornada.descricao}, days_count = ${jornada.dias} where id = ${planId}`;
                await sql`delete from plan_days where plan_id = ${planId}`;
                console.log(`♻️  "${jornada.titulo}" já existia — dias substituídos.`);
            } else {
                const [nova] = await sql`
                    insert into reading_plans (title, description, days_count, is_system)
                    values (${jornada.titulo}, ${jornada.descricao}, ${jornada.dias}, true)
                    returning id
                `;
                planId = nova.id;
            }

            const linhasDias = dias.map((refs, i) => ({
                plan_id: planId,
                day_number: i + 1,
                refs: sql.json(refs),
            }));
            await sql`insert into plan_days ${sql(linhasDias)}`;

            console.log(`✅ "${jornada.titulo}": ${jornada.dias} dias, ${capitulos.length} capítulos.`);
        }
    } finally {
        await sql.end();
    }
}

main().catch((e) => {
    console.error('\n✖', e.message);
    process.exit(1);
});
