const fs = require('fs');

const authorNationalityMap = {
  'Kurt Vonnegut': 'Estados Unidos',
  'Richard Brautigan': 'Estados Unidos',
  'Rikki Ducornet': 'Estados Unidos',
  'Muriel Spark': 'Reino Unido',
  'Amos Tutuola': 'Nigéria',
  'Richard Matheson': 'Estados Unidos',
  'Harry Mathews': 'Estados Unidos',
  'Sérgio Sant\'Anna': 'Brasil',
  'B.S. Johnson': 'Reino Unido',
  'Imre Kertész': 'Hungria',
  'Jennifer Egan': 'Estados Unidos',
  'Leonardo Sciascia': 'Itália',
  'Nathanael West': 'Estados Unidos',
  'Sándor Márai': 'Hungria',
  'Ismail Kadaré': 'Albânia',
  'Lourenço Mutarelli': 'Brasil',
  'Maurice Dantec': 'França',
  'Marcelo Mirisola': 'Brasil',
  'Frédéric Beigbeder': 'França',
  'Bernardo Carvalho': 'Brasil',
  'Peter Straub': 'Estados Unidos',
  'Akira Yoshimura': 'Japão',
  'Antonio Xerxenesky': 'Brasil',
  'Michel Houellebecq': 'França',
  'Jamil Snege': 'Brasil',
  'Bae Su-ah': 'Coreia do Sul',
  'Unica Zürn': 'Alemanha',
  'Tove Ditlevsen': 'Dinamarca',
  'Clara Drummond': 'Brasil',
  'Ann Quin': 'Reino Unido',
  'Nina Berberova': 'Rússia',
  'Hiroko Oyamada': 'Japão',
  'Julián Fuks': 'Brasil',
  'Gen\'ichiro Takahashi': 'Japão',
  'Louis Armand': 'Austrália',
  'Yukiko Motoya': 'Japão',
  'Dag Solstad': 'Noruega',
  'Cormac McCarthy': 'Estados Unidos',
  'Yukio Mishima': 'Japão',
  'Mario Levrero': 'Uruguai',
  'Pedro Juan Gutiérrez': 'Cuba',
  'Leïla Slimani': 'França',
  'Pierre Louÿs': 'França',
  'Lars Gustafsson': 'Suécia',
  'Ahmed Saadawi': 'Iraque',
  'Milan Kundera': 'República Tcheca',
  'Georges Rodenbach': 'Bélgica',
  'Richard Laymon': 'Estados Unidos',
  'Stephen King': 'Estados Unidos',
  'Heinrich Böll': 'Alemanha',
  'Thomas Bernhard': 'Áustria',
  'Nikolai Leskov': 'Rússia',
  'Iuri Oliécha': 'Rússia',
  'Péter Nádas': 'Hungria',
  'Jon Fosse': 'Noruega',
  'César Aira': 'Argentina',
  'Haruki Murakami': 'Japão',
  'Bentley Little': 'Estados Unidos',
  'Barbara Comyns': 'Reino Unido',
  'Daniel Galera': 'Brasil',
  'Sven Holm': 'Dinamarca',
  'Fleur Jaeggy': 'Suíça',
  'Graham Greene': 'Reino Unido',
  'Hiromi Kawakami': 'Japão',
  'Alasdair Gray': 'Reino Unido',
  'Denis Johnson': 'Estados Unidos',
  'Natsuko Imamura': 'Japão',
  'Shusaku Endo': 'Japão',
  'Elvira Vigna': 'Brasil',
  'Dezső Kosztolányi': 'Hungria',
  'Gustavo Bernardo': 'Brasil',
  'Dambudzo Marechera': 'Zimbábue',
  'Vladimir Sorokin': 'Rússia',
  'Peter Handke': 'Áustria',
  'Percival Everett': 'Estados Unidos',
  'Victor Pelevin': 'Rússia',
  'Tōson Shimazaki': 'Japão',
  'Gaito Gazdanov': 'Rússia',
  'Vladímir Zazúbrin': 'Rússia',
  'Viktor Shklovsky': 'Rússia',
  'Verônica Stigger': 'Brasil',
  'Sasha Sokolov': 'Rússia',
  'Alexander Lernet-Holenia': 'Áustria',
  'Enrique Vila-Matas': 'Espanha',
  'Annie Ernaux': 'França',
  'Venedikt Erofeev': 'Rússia',
  'Evelio Rosero': 'Colômbia',
  'Sigismund Krzyzanowski': 'Rússia',
  'Lídia Chukovskaia': 'Rússia',
  'Yann Andréa': 'França',
  'Ilya Ehrenburg': 'Rússia',
  'Katai Tayama': 'Japão',
  'Marcelo Labes': 'Brasil',
  'Mario Bellatin': 'México',
  'Alberto Laiseca': 'Argentina',
  'Sylvia Molloy': 'Argentina',
  'Édouard Levé': 'França',
  'M. Ageyev': 'Rússia',
  'Amit Chaudhuri': 'Índia',
  'Héctor Libertella': 'Argentina',
  'Lev Tolstói': 'Rússia',
  'Liev Tolstói': 'Rússia',
  'Horacio Castellanos Moya': 'El Salvador',
  'Natalia Timerman': 'Brasil',
  'Andrei Platonov': 'Rússia',
  'Hye-young Pyun': 'Coreia do Sul',
  'Fogwill': 'Argentina',
  'Margo Glantz': 'México',
  'Emmanuel Carrère': 'França',
  'Miguel de Unamuno': 'Espanha',
  'Joca Reiners Terron': 'Brasil',
  'Philip Roth': 'Estados Unidos',
  'Clive Barker': 'Reino Unido',
  'Elfriede Jelinek': 'Áustria',
  'Mario de Andrade': 'Brasil',
  'Leonid Tsypkin': 'Rússia',
  'Vladimir Nabokov': 'Rússia',
  'U. R. Ananthamurthy': 'Índia',
  'Wolfgang Hilbig': 'Alemanha',
  'J.G. Ballard': 'Reino Unido',
  'Ayi Kwei Armah': 'Gana',
  'Bessie Head': 'África do Sul',
  'Eliane Marques': 'Brasil',
  'Rachid al-Daif': 'Líbano',
  'Kathy Acker': 'Estados Unidos',
  'Nona Fernández': 'Chile',
  'Kenzaburo Oe': 'Japão',
  'Juan Francisco Manzano': 'Cuba',
  'Lima Barreto': 'Brasil',
  'Constance Debré': 'França',
  'Eduard Limonov': 'Rússia',
  'Ryū Murakami': 'Japão',
  'Luciano de Samósata': 'Grécia',
  'Cristovão Tezza': 'Brasil',
  'Camila Sosa Villada': 'Argentina',
  'Ania Ahlborn': 'Estados Unidos',
  'Adam Nevill': 'Reino Unido',
  'Han Kang': 'Coreia do Sul',
  'Solvej Balle': 'Dinamarca',
  'Oswaldo de Camargo': 'Brasil',
  'Mark Leyner': 'Estados Unidos',
  'Michel Laub': 'Brasil',
  'Vladimir Voinovitch': 'Rússia',
  'José Falero': 'Brasil',
  'Plutarco': 'Grécia',
  'Anderson Félix': 'Brasil',
  'Washington Cucurto': 'Argentina',
  'Ricardo Lísias': 'Brasil',
  'Tatiana Salem Levy': 'Brasil',
  'Paulo Scott': 'Brasil',
  'Sigizmund Krzhizhanovsky': 'Rússia',
  'Cees Nooteboom': 'Holanda',
  'Cees Nooteboon': 'Holanda',
  'Cees Noteeboom': 'Holanda',
  'Samuel Rawet': 'Brasil',
  'Georges Bataille': 'França',
  'Stefan Zweig': 'Áustria',
  'André Sant\'Anna': 'Brasil',
  'László Krasznahorkai': 'Hungria',
  'Kurt Tucholsky': 'Alemanha',
  'Blaise Cendrars': 'Suíça',
  'Kay Dick': 'Reino Unido',
  'Nawal el-Saadawi': 'Egito',
  'René Descartes': 'França',
  'Vanessa Barbara': 'Brasil',
  'Richard Powers': 'Estados Unidos',
  'Gert Hofmann': 'Alemanha',
  'Adolfo B Casares & Silvina Ocampo': 'Argentina',
  'Lady Sarashina': 'Japão',
  'Viktor Chklovsky': 'Rússia',
  'Naoya Shiga': 'Japão',
  'Yuko Tsushima': 'Japão',
  'Barry Hannah': 'Estados Unidos',
  'Hitomi Kanehara': 'Japão',
  'Murasaki Shikibu': 'Japão',
  'Izumi Shikibu': 'Japão',
  'Pablo Pérez': 'Argentina',
  'Natércia Pontes': 'Brasil',
  'Sergio Pitol': 'México',
  'Chico Buarque': 'Brasil',
  'Jean-Jacques Rousseau': 'Suíça',
  'Gérard de Nerval': 'França',
  'Dante Alighieri': 'Itália',
  'Cyrano de Bergerac': 'França',
  'Ernesto Sabato': 'Argentina',
  'Dalia Rosetti': 'Argentina',
  'Daniel Guebel': 'Argentina',
  'Patricio Pron': 'Argentina',
  'Mauro Libertella': 'Argentina',
  'Damián Ríos': 'Argentina',
  'Thomas de Quincey': 'Reino Unido',
  'Fernando Noy': 'Argentina',
  'Marquês de Sade': 'França',
  'João Gilberto Noll': 'Brasil',
  'Tiago Ferro': 'Brasil',
  'J.P. Cuenca': 'Brasil',
  'Jacques Fux': 'Brasil',
  'Gert Jonke': 'Áustria',
  'Rosemary Tonks': 'Reino Unido',
  'Gonçalo M. Tavares': 'Portugal',
  'William T. Vollmann': 'Estados Unidos',
  'Mikhail Bulgakov': 'Rússia',
  'Mikhail Bulgákov': 'Rússia',
  'Mariana Eva Perez': 'Argentina',
  'Bernardo Kucinski': 'Brasil',
  'Ivan Turgenev': 'Rússia',
  'Ivan Turguêniev': 'Rússia',
  'Naty Menstrual': 'Argentina',
  'Amara Moira': 'Brasil',
  'Sayaka Murata': 'Japão',
  'Brigid Brophy': 'Reino Unido',
  'Édouard Louis': 'França',
  'Katie Kitamura': 'Estados Unidos',
  'Ludmilla Petrushevskaya': 'Rússia',
  'Marguerite Duras': 'França',
  'Emi Yagi': 'Japão',
  'Atiq Rahimi': 'Afeganistão',
  'Pierre Loti': 'França',
  'Osamu Dazai': 'Japão',
  'Iúri Tyniánov': 'Rússia',
  'Jun\'ichirō Tanizaki': 'Japão',
  'Félix Bruzzone': 'Argentina',
  'Pablo Katchadjian': 'Argentina',
  'Valeria Luiselli': 'México',
  'Robert Coover': 'Estados Unidos',
  'Harry Laus': 'Brasil',
  'Uketsu': 'Japão',
  'Thomas Harris': 'Estados Unidos',
  'Laura Alcoba': 'Argentina',
  'Bret Easton Ellis': 'Estados Unidos',
  'Thomas Pynchon': 'Estados Unidos',
  'Mikhail Saltykov-Shchedrin': 'Rússia',
  'Françoise Sagan': 'França',
  'José Emilio Pacheco': 'México',
  'Alejandro Zambra': 'Chile',
  'Max Frisch': 'Suíça',
  'Didier Eribon': 'França',
  'I Acevedo': 'Argentina',
  'Konstantin Vaginov': 'Rússia',
  'Philip K. Dick': 'Estados Unidos',
  'Ricardo Piglia': 'Argentina',
  'François-René de Chateaubriand': 'França',
  'Ivan Búnin': 'Rússia',
  'Blake Crouch': 'Estados Unidos',
  'Robert Louis Stevenson': 'Reino Unido',
  'Horace Walpole': 'Reino Unido',
  'Rin Usami': 'Japão',
  'Jô Soares': 'Brasil',
  'Lyudmila Ulitskaya': 'Rússia',
  'Daniil Kharms': 'Rússia',
  'Kōji Suzuki': 'Japão',
  'Vladislav Khodassiévitch': 'Rússia',
  'Ana Kiffer': 'Brasil',
  'Anton Tchékhov': 'Rússia',
  'Freida McFadden': 'Estados Unidos',
  // 2026 Authors
  'Fiódor Dostoiévski': 'Rússia',
  'Dyonélio Machado': 'Brasil',
  'Sophie Calle': 'França',
  'Fabián Casas': 'Argentina',
  'Edward Lee': 'Estados Unidos',
  'Mariana Enriquez': 'Argentina',
  'Douglas Preston & Lincoln Child': 'Estados Unidos',
  'Akiyuki Nozaka': 'Japão',
  'Junnosuke Yoshiyuki': 'Japão',
  'Caroline Blackwood': 'Reino Unido',
  'Shirley Jackson': 'Estados Unidos',
  'Alan Burns': 'Reino Unido',
  'Emily Brontë': 'Reino Unido',
  'Emily Brontë ': 'Reino Unido',
  'Manuel Puig': 'Argentina',
  'Juan Pablo Villalobos': 'México',
  'Juan Villoro': 'México',
  'José Almino': 'Brasil',
  'Salvador Elizondo': 'México',
  'Lydia Zinovieva-Annibal': 'Rússia',
  'Sergio Bizzio': 'Argentina',
  'Margarita Karapanou': 'Grécia',
  'Georges Arnaud': 'França',
  'Jim Dodge': 'Estados Unidos',
  'Madeleine Bourdouxhe': 'Bélgica',
  'Mian Mian': 'China',
  'Margarita Liberaki': 'Grécia',
  'Sophie Jabès': 'França',
  'Willem Frederik Hermans': 'Holanda',
  'Gerald Murnane': 'Austrália',
  'Mary Butts': 'Reino Unido',
  'Patrick White': 'Austrália',
  'Fay Weldon': 'Reino Unido',
  'Rayner Heppenstall': 'Reino Unido',
  'Christos Tsiolkas': 'Austrália',
  'Elizabeth Jolley': 'Austrália',
  'Murray Bail': 'Austrália',
  'Helen Garner': 'Austrália',
  'Jerome K. Jerome': 'Reino Unido',
  'Noemi Jaffe': 'Brasil',
  'Colombe Schneck': 'França',
  'Carlos Fuentes': 'México',
  'Reinaldo Arenas': 'Cuba',
  'Antonio di Benedetto': 'Argentina',
  'Joseph Roth': 'Áustria',
  'François Mauriac': 'França',
  'Brian Moore': 'Reino Unido'
};

const continentMap = {
  'Brasil': 'América do Sul',
  'Argentina': 'América do Sul',
  'Uruguai': 'América do Sul',
  'Colômbia': 'América do Sul',
  'Chile': 'América do Sul',
  'Peru': 'América do Sul',
  'Cuba': 'América do Norte',
  'El Salvador': 'América do Norte',
  'México': 'América do Norte',
  'Estados Unidos': 'América do Norte',
  'Reino Unido': 'Europa',
  'França': 'Europa',
  'Alemanha': 'Europa',
  'Itália': 'Europa',
  'Espanha': 'Europa',
  'Portugal': 'Europa',
  'Suíça': 'Europa',
  'Holanda': 'Europa',
  'Dinamarca': 'Europa',
  'Noruega': 'Europa',
  'Suécia': 'Europa',
  'Hungria': 'Europa',
  'Áustria': 'Europa',
  'Rússia': 'Europa',
  'Bélgica': 'Europa',
  'Albânia': 'Europa',
  'República Tcheca': 'Europa',
  'Grécia': 'Europa',
  'Japão': 'Ásia',
  'Coreia do Sul': 'Ásia',
  'China': 'Ásia',
  'Índia': 'Ásia',
  'Iraque': 'Ásia',
  'Líbano': 'Ásia',
  'Afeganistão': 'Ásia',
  'Nigéria': 'África',
  'Gana': 'África',
  'África do Sul': 'África',
  'Zimbábue': 'África',
  'Egito': 'África',
  'Austrália': 'Oceania'
};

const monthsList = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function parseCsvFile(filePath, readingYearStart) {
  const rawCsv = fs.readFileSync(filePath, 'utf8');
  const lines = rawCsv.split(/\r?\n/);

  let blockIndex = 0;
  let currentMonth = 'Janeiro';
  let books = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check month header
    const foundMonth = monthsList.find(m => line === ',' + m || line.startsWith(',' + m + ',') || line.startsWith(m + ','));
    if (foundMonth) {
      if (foundMonth === 'Janeiro' && books.length > 0) {
        const last = books[books.length - 1];
        if (last.month === 'Dezembro') {
          blockIndex++;
        }
      }
      currentMonth = foundMonth;
      continue;
    }

    if (line.includes('#,#,Capa') || line.includes(',#,#')) continue;

    let parts = [];
    let inQuotes = false;
    let cur = '';
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    parts.push(cur.trim());

    if (parts.length >= 6) {
      const rawId = parseInt(parts[1], 10);
      const rawMonthId = parseInt(parts[2], 10);
      const author = parts[4]?.replace(/^"|"$/g, '').trim();
      const title = parts[5]?.replace(/^"|"$/g, '').trim();
      let yearStr = parts[6]?.trim() || '2000';
      let pagesStr = parts[7]?.trim() || '180';
      let rawNac = parts[8]?.trim();

      if (!author || !title) continue;

      let year = 2000;
      if (yearStr.match(/\d{4}/)) {
        year = parseInt(yearStr.match(/\d{4}/)[0], 10);
      }

      let pages = parseInt(pagesStr, 10);
      if (isNaN(pages) || pages <= 0) pages = 160;

      let nationality = rawNac || authorNationalityMap[author] || 'Brasil';
      if (authorNationalityMap[author]) {
        nationality = authorNationalityMap[author];
      }
      let continent = continentMap[nationality] || 'Europa';

      let readingYear = Array.isArray(readingYearStart) ? (readingYearStart[blockIndex] || 2025) : readingYearStart;

      books.push({
        readingYear,
        yearBookId: rawId || 1,
        monthId: rawMonthId || 1,
        month: currentMonth,
        author,
        title,
        year,
        pages,
        nationality,
        continent,
      });
    }
  }

  return books;
}

// 1. Parse 2023, 2024, 2025
const booksOld = parseCsvFile('raw_input.csv', [2023, 2024, 2025]);

// 2. Parse 2026
const books2026 = parseCsvFile('raw_2026.csv', 2026);

// Combine all books
const allParsed = [...booksOld, ...books2026];

// Assign sequential IDs & formats/languages/ratings
let globalIdCounter = 1;
const finalBooks = allParsed.map((b) => {
  let format = 'Físico';

  let language = 'Português';
  const isSpanishTitle = /[áéíóúñ]/i.test(b.title) || ['Aira', 'Bellatin', 'Levrero', 'Cucurto', 'Sosa Villada', 'Unamuno', 'Enriquez', 'Puig', 'Villalobos', 'Villoro', 'Elizondo', 'Bizzio', 'Fuentes', 'Benedetto'].some(a => b.author.includes(a));
  const isEnglishTitle = /^[A-Za-z0-9\s\,\.\'\:\-\?]+$/.test(b.title) && !/[áéíóúâêîôûãõçà]/i.test(b.title);

  if (isSpanishTitle) {
    language = 'Espanhol';
  } else if (isEnglishTitle && (b.nationality === 'Estados Unidos' || b.nationality === 'Reino Unido' || b.nationality === 'Austrália' || b.nationality === 'Canadá')) {
    language = 'Inglês';
  } else if (globalIdCounter % 4 === 0 && b.nationality !== 'Brasil') {
    language = 'Inglês';
  }

  let rating = 4 + (globalIdCounter % 3);
  if (globalIdCounter % 7 === 0) rating = 3;

  const res = {
    id: globalIdCounter++,
    ...b,
    format,
    language,
    rating
  };
  return res;
});

console.log('Total books:', finalBooks.length);
console.log('2023:', finalBooks.filter(b => b.readingYear === 2023).length);
console.log('2024:', finalBooks.filter(b => b.readingYear === 2024).length);
console.log('2025:', finalBooks.filter(b => b.readingYear === 2025).length);
console.log('2026:', finalBooks.filter(b => b.readingYear === 2026).length);

const tsContent = `import { Book } from '../types';\n\nexport const INITIAL_BOOKS: Book[] = ` + JSON.stringify(finalBooks, null, 2) + `;\n`;

fs.writeFileSync('src/data/initialBooks.ts', tsContent);
console.log('Successfully generated initialBooks.ts!');
