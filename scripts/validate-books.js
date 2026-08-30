#!/usr/bin/env node
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,".."),booksRoot=path.join(root,"livros"),allowed=new Set(["DEVELOPMENT","REVIEW","COMPLETED","PAUSED","ARCHIVED"]);
const ids=new Set();let active=0,errors=[];
for(const entry of fs.readdirSync(booksRoot,{withFileTypes:true}).filter(x=>x.isDirectory())){
 try{const dir=path.join(booksRoot,entry.name),book=JSON.parse(fs.readFileSync(path.join(dir,"book.json"),"utf8")),data=JSON.parse(fs.readFileSync(path.join(dir,book.chapters.path),"utf8"));
 if(ids.has(book.id))errors.push("ID duplicado: "+book.id);ids.add(book.id);
 if(!allowed.has(book.status))errors.push("Status inválido: "+book.id);
 if(book.active)active++;
 if(!fs.existsSync(path.join(dir,book.cover.path)))errors.push("Capa ausente: "+book.id);
 const chapters=data.chapters||[];if(!chapters.length)errors.push("Sem capítulos: "+book.id);
 for(let i=1;i<chapters.length;i++)if(chapters[i].number<=chapters[i-1].number)errors.push("Capítulos fora de ordem: "+book.id);
 if(book.chapters.currentPublished!==chapters.at(-1).number)errors.push("Último capítulo inconsistente: "+book.id);
 if(book.status==="DEVELOPMENT")for(const file of ["memoria.md","planejamento.md","continuidade.json"])if(!fs.existsSync(path.join(dir,file)))errors.push("Arquivo editorial ausente: "+book.id+"/"+file);
 }catch(error){errors.push(entry.name+": "+error.message)}
}
if(active!==1)errors.push("Deve existir exatamente uma obra ativa; encontrado: "+active);
if(errors.length){console.error(errors.join("\n"));process.exit(1)}console.log("Validação aprovada: "+ids.size+" obras.");
