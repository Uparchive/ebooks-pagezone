# PageZone V3

A PageZone é uma plataforma editorial estática hospedada no GitHub Pages. Obras, capítulos, capas e estado editorial vivem neste repositório; a interface pública usa um catálogo gerado e um único motor de leitura.

## Comandos

```bash
npm run build
npm run validate
npm run check
```

Não há framework nem dependência de produção. O build lê os manifestos internos e gera o catálogo público em `books.json` (e `data/books.json` para compatibilidade).

## Estrutura

- `livros/<id>/book.json` — manifesto de uma obra.
- `livros/<id>/chapters.json` — conteúdo publicado, separado da interface.
- `livros/<id>/capa.*` — capa local da obra.
- `livros/<id>/memoria.md`, `planejamento.md`, `continuidade.json` — documentos internos das obras em desenvolvimento.
- `reader.html` + `app/reader.*` — leitor universal.
- `editorial-state.json` — obra ativa e fila editorial.
- `scripts/` — geração e validação.
- `books.json` — catálogo público gerado, consumido pela biblioteca e pelo leitor; não editar manualmente.
- `app/library.js`, `app/progress.js`, `app/images.js` — identidade, progresso local e assets compartilhados.
- `tests/` — testes de regressão e navegador (`npm test`, `npm run test:browser`).

Leia [DOCUMENTACAO.md](DOCUMENTACAO.md) antes de publicar ou alterar uma obra.
