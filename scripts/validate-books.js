#!/usr/bin/env node
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,".."),booksRoot=path.join(root,"livros"),allowed=new Set(["DEVELOPMENT","REVIEW","COMPLETED","PAUSED","ARCHIVED"]);
const library=require("../app/library.js");
const ids=new Set();let active=0,errors=[];
for(const entry of fs.readdirSync(booksRoot,{withFileTypes:true}).filter(x=>x.isDirectory())){
 try{const dir=path.join(booksRoot,entry.name),book=JSON.parse(fs.readFileSync(path.join(dir,"book.json"),"utf8")),data=JSON.parse(fs.readFileSync(path.join(dir,book.chapters.path),"utf8"));
 if(book.id!==entry.name || !/^[a-z0-9-]+$/.test(book.id))errors.push("ID incompatível com diretório: "+entry.name);
 if(ids.has(book.id))errors.push("ID duplicado: "+book.id);ids.add(book.id);
 if(!allowed.has(book.status))errors.push("Status inválido: "+book.id);
 if(book.active)active++;
 if(!fs.existsSync(path.join(dir,book.cover.path)))errors.push("Capa ausente: "+book.id);
 const chapters=data.chapters||[];
 const chapterIds=new Set(), numbers=new Set();
 for(const c of library.chapters(chapters)){
  if(!Number.isInteger(c.number)||c.number<0||numbers.has(c.number))errors.push("Número de capítulo inválido/duplicado: "+book.id);
  if(chapterIds.has(c.chapterId))errors.push("ID de capítulo duplicado: "+book.id+"/"+c.chapterId);
  numbers.add(c.number);chapterIds.add(c.chapterId);
  if(typeof c.bodyHtml!=="string"||!c.bodyHtml.trim())errors.push("Conteúdo vazio: "+book.id+"/"+c.number);
  for(const match of (c.bodyHtml||"").matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)){
   const asset=library.asset(book,match[1]);
   if(!/^(https?:|data:|blob:)/i.test(asset)&&!fs.existsSync(path.join(root,decodeURIComponent(asset))))errors.push("Imagem ausente: "+asset);
  }
 }
if(!chapters.length)errors.push("Sem capítulos: "+book.id);
 for(let i=1;i<chapters.length;i++)if(chapters[i].number<=chapters[i-1].number)errors.push("Capítulos fora de ordem: "+book.id);
 if(book.chapters.currentPublished!==chapters.at(-1).number)errors.push("Último capítulo inconsistente: "+book.id);
 if(book.status==="DEVELOPMENT")for(const file of ["memoria.md","planejamento.md","continuidade.json"])if(!fs.existsSync(path.join(dir,file)))errors.push("Arquivo editorial ausente: "+book.id+"/"+file);
 }catch(error){errors.push(entry.name+": "+error.message)}
}
if(active!==1)errors.push("Deve existir exatamente uma obra ativa; encontrado: "+active);
if(errors.length){console.error(errors.join("\n"));process.exit(1)}console.log("Validação aprovada: "+ids.size+" obras.");
