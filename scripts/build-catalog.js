#!/usr/bin/env node
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,".."),booksRoot=path.join(root,"livros"),out=path.join(root,"data","books.json");
const statuses=new Set(["DEVELOPMENT","REVIEW","COMPLETED","PAUSED","ARCHIVED"]);
const books=fs.readdirSync(booksRoot,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>{
 const dir=path.join(booksRoot,d.name),book=JSON.parse(fs.readFileSync(path.join(dir,"book.json"),"utf8"));
 if(!book.id||!book.title||!statuses.has(book.status))throw new Error("Manifesto inválido: "+d.name);
 const chapters=JSON.parse(fs.readFileSync(path.join(dir,book.chapters.path),"utf8")).chapters||[];
 return {...book,cover:"livros/"+book.id+"/"+book.cover.path,url:"reader.html?book="+encodeURIComponent(book.id),legacyUrl:book.legacy.url,currentChapter:book.chapters.currentPublished,chapterCount:chapters.length};
}).sort((a,b)=>(a.order||999)-(b.order||999)||a.title.localeCompare(b.title,"pt-BR"));
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({schemaVersion:3,generatedAt:new Date().toISOString(),books},null,2)+"\n");
fs.writeFileSync(path.join(root,"books.json"),JSON.stringify({schemaVersion:3,generated:true,books},null,2)+"\n");
console.log("Catálogo gerado: "+books.length+" obras.");
