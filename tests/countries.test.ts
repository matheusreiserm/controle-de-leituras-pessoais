import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_BOOKS } from '../src/data/initialBooks';
import {
  calculateCountryStats,
  calculateDashboardStats,
  canonicalCountry,
  getCountryCode,
  getCountryContinent,
  getCountryFlag,
} from '../src/utils/helpers';

const read = INITIAL_BOOKS.filter((book) => !book.status || book.status === 'read');

test('spellings with and without accents are one country; distinct names stay distinct', () => {
  assert.equal(canonicalCountry('Russia'), 'Rússia');
  assert.equal(canonicalCountry(' rússia '), 'Rússia');
  assert.equal(canonicalCountry('Suiça'), 'Suíça');
  assert.equal(canonicalCountry('Inglaterra'), 'Inglaterra');
  assert.equal(canonicalCountry('Escócia'), 'Escócia');
  assert.equal(canonicalCountry('Atlântida'), 'Atlântida');
  assert.equal(canonicalCountry(''), '');
});

test('the matrix counts Russia once, with all its books and authors', () => {
  const stats = calculateCountryStats(read);
  assert.equal(stats.find((country) => country.country === 'Russia'), undefined);
  const russia = stats.find((country) => country.country === 'Rússia')!;
  const russianBooks = read.filter((book) => /^r[uú]ssia$/i.test(book.nationality));
  assert.equal(russia.volume, russianBooks.length);
  assert.equal(russia.uniqueAuthors, new Set(russianBooks.map((book) => book.author)).size);
  assert.equal(calculateDashboardStats(read).uniqueCountries, stats.length);
});

test('every country in the catalog has a flag and the matrix agrees with the dashboard on continents', () => {
  const missing = [...new Set(INITIAL_BOOKS.map((book) => book.nationality))].filter((country) => getCountryFlag(country) === '🌐');
  assert.deepEqual(missing, []);
  const byContinent: Record<string, number> = {};
  for (const country of calculateCountryStats(read)) byContinent[country.continent] = (byContinent[country.continent] || 0) + country.volume;
  assert.deepEqual(byContinent, calculateDashboardStats(read).byContinent);
});

test('countries added to the list carry the right continent and flag', () => {
  for (const [country, continent, code] of [
    ['Líbano', 'Ásia', 'lb'], ['Iraque', 'Ásia', 'iq'], ['Afeganistão', 'Ásia', 'af'], ['Zimbábue', 'África', 'zw'],
    ['Gana', 'África', 'gh'], ['Botsuana', 'África', 'bw'], ['El Salvador', 'América do Norte', 'sv'], ['Albânia', 'Europa', 'al'],
  ] as const) {
    assert.equal(getCountryContinent(country), continent, country);
    assert.equal(getCountryCode(country), code, country);
  }
  assert.equal(getCountryFlag('Líbano'), '🇱🇧');
  assert.equal(getCountryFlag('País de Gales'), '🏴󠁧󠁢󠁷󠁬󠁳󠁿');
});

test('a country outside the list takes the continent written on its books', () => {
  const [stat] = calculateCountryStats([{ ...read[0], nationality: 'Atlântida', continent: 'Oceania' }]);
  assert.equal(stat.continent, 'Oceania');
});
