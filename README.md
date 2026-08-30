# PageZone V3

A PageZone é uma plataforma editorial estática hospedada no GitHub Pages. Obras, capítulos, capas e estado editorial vivem neste repositório; a interface pública usa um catálogo gerado e um único motor de leitura.

## Comandos

```bash
npm run build
npm run validate
npm run check
```

Não há framework nem dependência de produção. O build lê os manifestos internos e gera o catálogo público em `data/books.json`.

## Estrutura

- `livros/<id>/book.json` — manifesto de uma obra.
- `livros/<id>/chapters.json` — conteúdo publicado, separado da interface.
- `livros/<id>/capa.*` — capa local da obra.
- `livros/<id>/memoria.md`, `planejamento.md`, `continuidade.json` — documentos internos das obras em desenvolvimento.
- `reader.html` + `app/reader.*` — leitor universal.
- `editorial-state.json` — obra ativa e fila editorial.
- `scripts/` — geração e validação.
- `data/books.json` — catálogo público gerado; não editar manualmente.

Leia [DOCUMENTACAO.md](DOCUMENTACAO.md) antes de publicar ou alterar uma obra.
