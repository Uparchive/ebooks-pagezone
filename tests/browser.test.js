/* Real browser regression suite, served under the GitHub Pages repository prefix. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const books = JSON.parse(fs.readFileSync(path.join(root, 'books.json'))).books;
const types = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.webmanifest':'application/manifest+json'};
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
    async function details(book){await page.goto(base+`book.html?book=${book}`);await page.waitForSelector('#book-details:visible');}
    async function images(){await page.waitForFunction(()=>[...document.images].filter(i=>i.loading!=='lazy').every(i=>i.complete));assert.deepEqual(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>(i.loading!=='lazy'||i.complete)&&(!i.naturalWidth||i.dataset.fallback)).map(i=>i.src)),[]);}
    async function noOverflow(){
      const layout=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return !el.closest('.app-sidebar')&&(r.right>document.documentElement.clientWidth+1||r.left<-1);}).slice(0,12).map(el=>({tag:el.tagName,class:el.className,width:el.getBoundingClientRect().width}))}));
      assert.ok(layout.scroll<=layout.width,'Horizontal overflow: '+JSON.stringify(layout));
    }

    await page.setViewportSize({width:1440,height:900});await catalog();
    assert.equal(await page.locator('#catalog-grid .book-card').count(),books.length);
    assert.equal(await page.locator('#development-shelf .book-card').count(),books.filter(book=>book.status==='DEVELOPMENT').length);
    assert.equal(await page.locator('#completed-shelf .book-card').count(),books.filter(book=>book.status==='COMPLETED').length);
    assert.ok(await page.locator('#featured-book .featured-card').isVisible());
    console.log('A: app home renders the real catalog, shelves and featured work');

    assert.equal(await page.locator('html').getAttribute('data-sidebar'),'compact');
    await page.getByRole('button',{name:'Expandir menu lateral'}).click();
    assert.equal(await page.locator('html').getAttribute('data-sidebar'),'expanded');
    assert.equal(await page.getByRole('link',{name:'Início',exact:true}).getAttribute('aria-current'),'page');
    console.log('B: desktop app shell expands and marks current navigation');

    await page.emulateMedia({colorScheme:'dark'});
    await page.getByRole('button',{name:'Usar tema do sistema'}).click();
    assert.equal(await page.locator('html').getAttribute('data-theme-choice'),'system');
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.emulateMedia({colorScheme:'light'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
    await page.getByRole('button',{name:'Usar tema escuro'}).click();
    assert.equal(await page.evaluate(()=>localStorage.getItem('pagezone-theme')),'dark');
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    console.log('C: light, dark and live system theme selection work globally');

    for(const book of books){await details(book.id);await images();assert.equal(await page.locator('#chapters-list .chapter-item').count(),book.chapterList.length);}
    console.log('D: every work has a details page and complete chapter list');

    await reader('urbans-family',10);await page.reload();await page.waitForSelector('#reader:visible');
    assert.equal(await page.locator('#chapter-label').innerText(),'Capítulo 10');
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    const savedId=await page.evaluate(()=>localStorage.getItem('pagezone_reader_id'));
    await details('urbans-family');
    assert.match(await page.locator('#primary-reading-action').innerText(),/Continuar no capítulo 10/);
    assert.equal(await page.locator('#detail-progress').isVisible(),true);
    await catalog();
    assert.equal(await page.locator('#continuar').isVisible(),true);
    assert.match(await page.locator('#continue-shelf').innerText(),/Urbans Family/);
    const urban=page.locator('#catalog-grid .book-card[data-book-id="urbans-family"]');
    assert.match(await urban.locator('.reading-link').innerText(),/Continuar — Capítulo 10/);
    await urban.locator('.cover-link').click();await page.waitForSelector('#book-details:visible');
    assert.match(page.url(),/book\.html\?book=urbans-family/);
    await page.locator('#primary-reading-action').click();await page.waitForSelector('#reader:visible');
    assert.equal(await page.locator('#chapter-label').innerText(),'Capítulo 10');
    assert.equal(await page.evaluate(()=>localStorage.getItem('pagezone_reader_id')),savedId);
    console.log('E: Biblioteca → Obra → Leitor and Continue Reading use real persisted progress');

    await catalog();await page.getByRole('searchbox').fill('urban');await page.getByRole('searchbox').press('Enter');
    assert.match(await page.locator('#catalog-heading').innerText(),/Resultados para "urban"/);
    const enter=await page.locator('#catalog-grid h3').allTextContents();assert.equal(enter.length,1);assert.match(page.url(),/q=urban/);
    await page.reload();await page.waitForSelector('#catalog-grid .book-card');assert.deepEqual(await page.locator('#catalog-grid h3').allTextContents(),enter);
    await page.getByRole('searchbox').fill('URBAN');await page.getByRole('button',{name:'Pesquisar',exact:true}).click();assert.deepEqual(await page.locator('#catalog-grid h3').allTextContents(),enter);
    await page.goBack();assert.equal(await page.getByRole('searchbox').inputValue(),'urban');await page.goForward();assert.equal(await page.getByRole('searchbox').inputValue(),'URBAN');
    await page.getByRole('searchbox').fill('zzzz-no-such-book');await page.getByRole('searchbox').press('Enter');
    assert.match(await page.locator('#empty-state').innerText(),/Nenhuma história encontrada para "zzzz-no-such-book"/);
    await page.getByRole('button',{name:'Limpar filtros'}).click();assert.equal(await page.locator('#catalog-grid .book-card').count(),books.length);
    console.log('F: search, URL history, reload and empty state remain intact');

    await reader('urbans-family',10);await page.getByRole('link',{name:'Próximo capítulo',exact:true}).click();await page.waitForSelector('#reader:visible');
    assert.equal(await page.locator('#chapter-label').innerText(),'Capítulo 11');
    await page.getByRole('link',{name:'Capítulo anterior',exact:true}).click();await page.waitForSelector('#reader:visible');assert.equal(await page.locator('#chapter-label').innerText(),'Capítulo 10');
    await page.getByRole('button',{name:'Índice',exact:true}).click();await page.getByRole('link',{name:/^Capítulo 5 —/}).click();await page.waitForSelector('#reader:visible');
    assert.equal(await page.locator('#chapter-label').innerText(),'Capítulo 5');await page.reload();await page.waitForSelector('#reader:visible');
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.getByRole('button',{name:'Usar tema claro'}).click();assert.equal(await page.evaluate(()=>localStorage.getItem('pagezone-theme')),'light');
    await details('echoes-of-eternity');assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await page.reload();await page.waitForSelector('#book-details:visible');assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    console.log('G: distraction-free reader keeps navigation and global appearance preference');

    for(const width of [320,390,768,1024,1440]){
      await page.setViewportSize({width,height:900});await catalog();await noOverflow();
      if(width<=800){await page.getByRole('button',{name:'Abrir menu'}).click();assert.equal(await page.locator('html').getAttribute('data-drawer'),'open');await noOverflow();await page.getByRole('button',{name:'Fechar menu'}).click();assert.equal(await page.locator('html').getAttribute('data-drawer'),'closed');}
      await details('o-guardiao-da-promessa');await images();await noOverflow();
      await reader('o-guardiao-da-promessa',0);await images();await noOverflow();
      await page.getByRole('button',{name:'Índice',exact:true}).click();await noOverflow();await page.keyboard.press('Escape');assert.equal(await page.locator('#chapter-index').isVisible(),false);
    }
    console.log('H: 320/390/768/1024/1440px app shell, drawer, work page and reader have no overflow');
    assert.deepEqual(errors,[],'No console errors/warnings on normal paths');

    await reader('urbans-family',999);assert.ok(await page.locator('#reader-notice').isVisible());
    await page.goto(base+'reader.html?book=missing');await page.waitForSelector('#reader-recovery:visible');assert.match(await page.locator('#reader-loading').innerText(),/Obra não encontrada/);
    await page.goto(base+'book.html?book=missing');await page.waitForSelector('#book-recovery:visible');
    const isolated=await browser.newContext();await isolated.addInitScript(()=>{localStorage.setItem('pagezone:progress:urbans-family','10');localStorage.setItem('pagezone_reading_progress','{bad');});
    const old=await isolated.newPage();await old.goto(base+'reader.html?book=urbans-family');await old.waitForSelector('#reader:visible');assert.equal(await old.locator('#chapter-label').innerText(),'Capítulo 10');await isolated.close();
    const blocked=await browser.newContext();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('denied');}});});
    const denied=await blocked.newPage();await denied.goto(base+'reader.html?book=urbans-family&chapter=10');await denied.waitForSelector('#reader:visible');assert.match(await denied.locator('#reader-notice').innerText(),/não permite salvar/);await blocked.close();
    const fallbackContext=await browser.newContext({serviceWorkers:'block'});const fallbackPage=await fallbackContext.newPage();await fallbackPage.route('**/capa.png',route=>route.abort());
    await fallbackPage.goto(base+'reader.html?book=urbans-family&chapter=0');await fallbackPage.waitForSelector('#reader:visible');await fallbackPage.waitForSelector('#book-cover[data-fallback]');await fallbackPage.waitForFunction(()=>document.querySelector('#book-cover').naturalWidth>0);await fallbackContext.close();
    const catalogFailureContext=await browser.newContext({serviceWorkers:'block'});const catalogFailurePage=await catalogFailureContext.newPage();await catalogFailurePage.route('**/books.json',route=>route.fulfill({status:503,body:'Unavailable'}));await catalogFailurePage.goto(base);
    await catalogFailurePage.waitForSelector('#catalog-loading a');assert.match(await catalogFailurePage.locator('#catalog-loading').innerText(),/Tentar novamente/);await catalogFailureContext.close();
    console.log('I: invalid routes, legacy/corrupt/blocked storage, image and catalog failure recover');
    await context.close();console.log('PASS: PageZone app experience scenarios');
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
