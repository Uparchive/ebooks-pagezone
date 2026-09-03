const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const commandPath = path.join(root, 'editorial-commands', 'current.json');

if (!fs.existsSync(commandPath)) {
  throw new Error('editorial-commands/current.json não encontrado.');
}

const command = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
if (!command.bookId || !Number.isInteger(command.expectedCurrentPublished) || !command.chapter) {
  throw new Error('Comando editorial inválido.');
}

const bookDir = path.join(root, 'livros', command.bookId);
const bookPath = path.join(bookDir, 'book.json');
const chaptersPath = path.join(bookDir, 'chapters.json');
const book = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
const chapterManifest = JSON.parse(fs.readFileSync(chaptersPath, 'utf8'));

if (book.chapters.currentPublished !== command.expectedCurrentPublished) {
  throw new Error(`Estado divergente: esperado ${command.expectedCurrentPublished}, encontrado ${book.chapters.currentPublished}.`);
}

const last = chapterManifest.chapters.at(-1);
if (!last || last.number !== command.expectedCurrentPublished) {
  throw new Error('Manifesto de capítulos divergente do book.json.');
}

if (command.chapter.number !== command.expectedCurrentPublished + 1) {
  throw new Error('Número do novo capítulo não é sequencial.');
}

chapterManifest.chapters.push(command.chapter);
fs.writeFileSync(chaptersPath, JSON.stringify(chapterManifest, null, 2) + '\n');

book.chapters.currentPublished = command.chapter.number;
fs.writeFileSync(bookPath, JSON.stringify(book, null, 2) + '\n');

for (const [relativePath, content] of Object.entries(command.files || {})) {
  const target = path.join(root, relativePath);
  if (!target.startsWith(root + path.sep)) throw new Error(`Caminho inválido: ${relativePath}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.endsWith('\n') ? content : content + '\n');
}

console.log(`Capítulo ${command.chapter.number} aplicado a ${command.bookId}.`);
