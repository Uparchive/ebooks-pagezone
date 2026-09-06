/* Real browser regression suite, served under the GitHub Pages repository prefix. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const books = JSON.parse(fs.readFileSync(path.join(root, 'books.json'))).books;
const types = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp'};
const server = http.createServer((req,res) => {
  let file = decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/ebooks-pagezone\//,'');
  if (!file) file='index.html';
  file=path.resolve(root,file);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=> {res.writeHead(error?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(error?'Not found':data);});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/ebooks-pagezone/`;
  const browser=await chromium.launch({headless:true});
  try {
    const context=await browser.newContext();
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
    async function catalog(){await page.goto(base);await page.waitForSelector('#catalog-grid .book-card');}
    async function reader(book,chapter){await page.goto(base+`reader.html?book=${book}`+(chapter===undefined?'':`&chapter=${chapter}`));await page.waitForSelector('#reader:visible');}
    async function images(){await page.waitForFunction(()=>[...document.images].filter(i=>i.loading!=='lazy').every(i=>i.complete));assert.deepEqual(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>(i.loading!=='lazy'||i.complete)&&(!i.naturalWidth||i.dataset.fallback)).map(i=>i.src)),[]);}
    async function noOverflow(){
      const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(el=>({tag:el.tagName,class:el.className,width:el.getBoundingClientRect().width}))}));
      assert.ok(layout.scroll<=layout.width,'Horizontal overflow: '+JSON.stringify(layout));
    }
    await catalog();
    assert.equal(await page.locator('#catalog-grid .book-card').count(),books.length);
    console.log('A: all nine catalog books render');
    for(const book of books){
      await reader(book.id,book.chapterList[0].number);await images();
      assert.equal(await page.locator('#chapter-index a').count(),book.chapterList.length);
    }
    console.log('B/C: all covers, introduction images and chapter indexes load');
    await reader('urbans-family',10);
    await page.reload();await page.waitForSelector('#reader:visible');
    assert.equal(await page.locator('#chapter-label').innerText(),'Capítulo 10');
    const savedId=await page.evaluate(()=>localStorage.getItem('pagezone_reader_id'));
    await catalog();
    const urban=page.locator('#catalog-grid .book-card').filter({hasText:'Urbans Family'});
    assert.match(await urban.locator('.reading-link').innerText(),/Continuar lendo — Capítulo 10/);
    await urban.locator('.reading-link').click();await page.waitForSelector('#reader:visible');
    assert.equal(await page.locator('#chapter-label').innerText(),'Capítulo 10');
    await reader('echoes-of-eternity',5);
    await reader('urbans-family');assert.equal(await page.locator('#chapter-label').innerText(),'Capítulo 10');
    await reader('echoes-of-eternity');assert.equal(await page.locator('#chapter-label').innerText(),'Capítulo 5');
    assert.equal(await page.evaluate(()=>localStorage.getItem('pagezone_reader_id')),savedId);
    const disk=await page.evaluate(()=>JSON.parse(localStorage.getItem('pagezone_reading_progress')));
    assert.equal(disk['urbans-family'].chapterId,'chapter-10');assert.equal(disk['echoes-of-eternity'].chapterId,'chapter-5');
    console.log('D/E: reload, resume from catalog, persistent anonymous ID and independent books');
    await catalog();await page.getByRole('searchbox').fill('urban');await page.getByRole('searchbox').press('Enter');
    assert.match(await page.locator('#catalog-heading').innerText(),/Resultados para "urban"/);
    const enter=await page.locator('#catalog-grid h3').allTextContents();assert.equal(enter.length,1);
    assert.match(page.url(),/q=urban/);
    await page.reload();await page.waitForSelector('#catalog-grid .book-card');
    assert.deepEqual(await page.locator('#catalog-grid h3').allTextContents(),enter);
    await page.getByRole('searchbox').fill('URBAN');await page.getByRole('button',{name:'Pesquisar',exact:true}).click();
    assert.deepEqual(await page.locator('#catalog-grid h3').allTextContents(),enter);
    await page.goBack();assert.equal(await page.getByRole('searchbox').inputValue(),'urban');
    await page.goForward();assert.equal(await page.getByRole('searchbox').inputValue(),'URBAN');
    await page.getByRole('searchbox').fill('zzzz-no-such-book');await page.getByRole('searchbox').press('Enter');
    assert.match(await page.locator('#empty-state').innerText(),/Nenhum livro encontrado para "zzzz-no-such-book"/);
    await page.getByRole('button',{name:'Limpar filtros'}).click();assert.equal(await page.locator('#catalog-grid .book-card').count(),books.length);
    console.log('F/G/H/I: Enter and button agree; partial/case-insensitive search, URL history, reload and empty state');
    await reader('urbans-family',10);await page.getByRole('link',{name:'Próximo capítulo',exact:true}).click();await page.waitForSelector('#reader:visible');
    assert.equal(await page.locator('#chapter-label').innerText(),'Capítulo 11');
    await page.getByRole('link',{name:'Capítulo anterior',exact:true}).click();await page.waitForSelector('#reader:visible');
    assert.equal(await page.locator('#chapter-label').innerText(),'Capítulo 10');
    await page.getByRole('button',{name:'Índice',exact:true}).click();await page.getByRole('link',{name:/^Capítulo 5 —/}).click();await page.waitForSelector('#reader:visible');
    assert.equal(await page.locator('#chapter-label').innerText(),'Capítulo 5');
    await page.reload();await page.waitForSelector('#reader:visible');assert.equal(await page.locator('#chapter-label').innerText(),'Capítulo 5');
    console.log('J: direct route, reload, index, next and previous');
    for(const width of [320,390,768,1024,1440]){
      await page.setViewportSize({width,height:900});await catalog();await noOverflow();
      await page.locator('#catalog-grid [data-book-id="urbans-family"]').click();assert.ok(await page.locator('#book-dialog').isVisible());await noOverflow();await page.getByRole('button',{name:'Fechar detalhes'}).click();
      await reader('o-guardiao-da-promessa',0);await images();await noOverflow();
      await page.getByRole('button',{name:'Índice',exact:true}).click();await noOverflow();await page.keyboard.press('Escape');assert.equal(await page.locator('#chapter-index').isVisible(),false);
    }
    console.log('K: 320/390/768/1024/1440px catalog, dialog, reader and index without overflow');
    assert.deepEqual(errors,[],'No console errors/warnings on normal paths');
    // Controlled failure cases: console diagnostics are expected from this point.
    await reader('urbans-family',999);assert.ok(await page.locator('#reader-notice').isVisible());
    await page.goto(base+'reader.html?book=missing');await page.waitForSelector('#reader-recovery:visible');
    assert.match(await page.locator('#reader-loading').innerText(),/Obra não encontrada/);
    const isolated=await browser.newContext();await isolated.addInitScript(()=>{localStorage.setItem('pagezone:progress:urbans-family','10');localStorage.setItem('pagezone_reading_progress','{bad');});
    const old=await isolated.newPage();await old.goto(base+'reader.html?book=urbans-family');await old.waitForSelector('#reader:visible');assert.equal(await old.locator('#chapter-label').innerText(),'Capítulo 10');await isolated.close();
    const blocked=await browser.newContext();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('denied');}});});
    const denied=await blocked.newPage();await denied.goto(base+'reader.html?book=urbans-family&chapter=10');await denied.waitForSelector('#reader:visible');assert.match(await denied.locator('#reader-notice').innerText(),/não permite salvar/);await blocked.close();
    await page.route('**/capa.png',route=>route.abort());await reader('urbans-family',0);await page.waitForSelector('#book-cover[data-fallback]');await page.waitForFunction(()=>document.querySelector('#book-cover').naturalWidth>0);await page.unroute('**/capa.png');
    await page.route('**/books.json',route=>route.fulfill({status:503,body:'Unavailable'}));await page.goto(base);await page.waitForSelector('#catalog-loading a');assert.match(await page.locator('#catalog-loading').innerText(),/Tentar novamente/);
    console.log('Failure cases: invalid routes, legacy/corrupt/blocked storage, image and catalog failure all recover');
    await context.close();
    console.log('PASS: all PageZone browser scenarios');
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
