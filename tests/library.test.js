const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const P = require('../app/library');
const progressCode = fs.readFileSync(require.resolve('../app/progress.js'), 'utf8');
function storageContext(initial = {}, blocked = false) {
  const store = new Map(Object.entries(initial));
  const context = { localStorage: { getItem(k) { if (blocked) throw Error('denied'); return store.get(k) ?? null; }, setItem(k,v) { if (blocked) throw Error('denied'); store.set(k,v); } },
    document: { dispatchEvent() {} }, Event: class {}, console: { warn() {} } };
  context.window = context;
  vm.runInNewContext(progressCode, context);
  return { progress: context.PageZoneProgress, store };
}
test('stable IDs survive insertion, zero and explicit chapter IDs', () => {
  const before = P.chapters([{ number: 0 }, { number: 10 }, { number: 20, chapterId: 'epilogue' }]);
  const after = P.chapters([{ number: 5 }, ...before]);
  assert.equal(after.find(c => c.number === 10).chapterId, 'chapter-10');
  assert.equal(before[0].chapterId, 'chapter-0');
  assert.equal(P.selectChapter(after, { chapterId:'epilogue', chapterNumber:19 }).number,20);
});
test('missing chapter falls back to preceding chapter or first', () => {
  const c = P.chapters([{number:0},{number:8},{number:11}]);
  assert.equal(P.selectChapter(c,{chapterNumber:10}).number,8);
  assert.equal(P.selectChapter(c,{chapterNumber:-1}).number,0);
  assert.equal(P.selectChapter(c,{chapterNumber:NaN}).number,0);
});
test('legacy progress migrates and books remain independent', () => {
  const {progress:p,store} = storageContext({'pagezone:progress:a':'0'});
  assert.equal(p.read('a').chapterNumber,0);
  const id=p.readerId();
  p.save('a',{chapterId:'chapter-10',number:10},2);
  p.save('b',{chapterId:'chapter-3',number:3},1);
  assert.equal(p.read('a').chapterNumber,10);
  assert.equal(p.read('b').chapterNumber,3);
  assert.equal(p.readerId(),id);
  const next=storageContext(Object.fromEntries(store)).progress;
  assert.equal(next.readerId(),id);
  assert.equal(next.read('a').chapterNumber,10);
});
test('blocked or corrupt storage does not prevent reading', () => {
  for(const blocked of [true,false]){
    const {progress:p}=storageContext({pagezone_reading_progress:'{broken'},blocked);
    assert.equal(p.read('a'),null);
    p.save('a',{chapterId:'chapter-10',number:10},2);
    assert.equal(p.read('a').chapterNumber,10);
  }
});
test('asset resolution preserves legacy covers and nested local images', () => {
  const b={id:'test',cover:{path:'capa.png',legacyUrl:'https://example.org/capa%20antiga.png'}};
  assert.equal(P.asset(b,'capa antiga.png'),'livros/test/capa.png');
  assert.equal(P.asset(b,'art/ilustração.png'),'livros/test/art/ilustra%C3%A7%C3%A3o.png');
  assert.equal(P.normalize('ÉPICO'),'epico');
});
