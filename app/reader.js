(() => {
"use strict";
const params=new URLSearchParams(location.search);
const bookId=params.get("book"), requested=Number(params.get("chapter"));
const $=(id)=>document.getElementById(id);
const safe=(v)=>String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const progressKey=(id)=>"pagezone:progress:"+id;
function route(id,number){return "reader.html?book="+encodeURIComponent(id)+"&chapter="+encodeURIComponent(number)}
function setNav(element,chapter){if(chapter){element.href=route(bookId,chapter.number);element.removeAttribute("aria-disabled")}else{element.href="";element.setAttribute("aria-disabled","true")}}
async function init(){
 if(!bookId){$("reader-loading").textContent="Escolha uma obra na biblioteca.";return}
 try{
  const [manifestResponse,chaptersResponse]=await Promise.all([fetch("livros/"+encodeURIComponent(bookId)+"/book.json"),fetch("livros/"+encodeURIComponent(bookId)+"/chapters.json")]);
  if(!manifestResponse.ok||!chaptersResponse.ok)throw new Error("Obra não encontrada.");
  const book=await manifestResponse.json(), data=await chaptersResponse.json(), chapters=data.chapters||[];
  const saved=Number(localStorage.getItem(progressKey(book.id)));
  const chapter=chapters.find(c=>c.number===requested)||chapters.find(c=>c.number===saved)||chapters[0];
  if(!chapter)throw new Error("Esta obra ainda não possui capítulos publicados.");
  document.title=book.title+" — PageZone";
  $("book-cover").src="livros/"+encodeURIComponent(book.id)+"/"+book.cover.path;
  $("book-cover").alt="Capa de "+book.title;
  $("book-title").textContent=book.title;
  $("book-status").textContent=({DEVELOPMENT:"Em desenvolvimento",REVIEW:"Em revisão",COMPLETED:"Concluído"})[book.status]||book.status;
  $("chapter-label").textContent=chapter.displayNumber||("Capítulo "+chapter.number);
  $("chapter-title").textContent=chapter.title||"";
  $("chapter-content").innerHTML=chapter.bodyHtml;
  localStorage.setItem(progressKey(book.id),String(chapter.number));
  const position=chapters.findIndex(c=>c.number===chapter.number);
  setNav($("previous-chapter"),chapters[position-1]);setNav($("next-chapter"),chapters[position+1]);
  $("continues").hidden=!(book.status==="DEVELOPMENT"&&position===chapters.length-1);
  $("chapter-index").innerHTML=chapters.map(c=>'<a href="'+route(book.id,c.number)+'">'+safe(c.displayNumber||"Capítulo "+c.number)+(c.title?" — "+safe(c.title):"")+"</a>").join("");
  $("index-toggle").addEventListener("click",()=>{const open=$("chapter-index").hidden;$("chapter-index").hidden=!open;$("index-toggle").setAttribute("aria-expanded",String(open))});
  $("reader-loading").hidden=true;$("reader").hidden=false;
 }catch(error){$("reader-loading").textContent=error.message;console.error(error)}
}
document.addEventListener("DOMContentLoaded",init);
})();