# PageZone V2 — documentação operacional

## Papel de cada repositório

A PageZone é a biblioteca e o agregador editorial. Cada obra permanece no seu próprio repositório GitHub, com GitHub Pages, capa, capítulos, leitor e progresso de leitura independentes. Nunca copie capítulos para este repositório nem altere o `localStorage` de uma obra a partir da PageZone.

## Fonte do catálogo

`books.json` é a única fonte de metadados exibida no site. A interface em `script.js` busca, valida e renderiza o catálogo. Para publicar uma obra nova, em geral basta criar o repositório/Pages da obra e adicionar um objeto ao array `books`.

Campos usados:

- `id`: identificador estável e único; não o altere após publicar.
- `title`, `description`, `genres`: dados públicos usados em busca e descoberta.
- `cover`: URL pública da capa no repositório da obra.
- `url`: URL pública do leitor da obra.
- `status`: `DEVELOPMENT`, `REVIEW`, `COMPLETED`, `PAUSED` ou `ARCHIVED`.
- `currentChapter`: último capítulo disponível, somente quando confirmado.
- `estimatedChapters`: opcional; se informado junto de `currentChapter`, a biblioteca calcula o progresso.
- `updatedAt`: opcional, no formato ISO `AAAA-MM-DD`; só é exibido quando existe.
- `featured`: apenas uma obra deve ficar marcada como destaque.
- `order`: controla a ordem editorial.

Não invente capítulos, datas, estimativas ou progresso. Se a informação não estiver confirmada, omita o campo.

## Fluxo para continuar uma obra em desenvolvimento

1. Atualize e publique os capítulos no repositório individual da obra, preservando as chaves de `localStorage` daquela obra.
2. Verifique o leitor no GitHub Pages da própria obra.
3. Atualize `currentChapter` e, se houver, `updatedAt` em `books.json`.
4. Quando a obra for encerrada, troque `status` para `COMPLETED` e remova estimativas provisórias que não representem a edição final.
5. A PageZone a moverá automaticamente de “Em desenvolvimento” para “Concluídos”.

## Prateleiras, busca e filtros

As prateleiras são derivadas do catálogo; nenhuma lista de cards é mantida manualmente no HTML. “Em desenvolvimento” mostra `DEVELOPMENT`, “Concluídos” mostra `COMPLETED`, e “Biblioteca” exibe todas as obras públicas. Busca consulta título, descrição, gêneros e série (quando existir). Filtros por estado e gênero funcionam junto com a busca.

## Destaque e capas

Defina `featured: true` para destacar uma obra. As capas devem usar preferencialmente proporção editorial vertical; a PageZone usa `object-fit: cover` e carregamento preguiçoso fora do destaque. A capa continua hospedada no repositório da obra.

## Preparação para automação

Um futuro agente escritor deve editar primeiro a obra ativa e depois alterar somente os campos necessários em `books.json`. O catálogo é deliberadamente simples para permitir atualização por automação, revisão por pull request ou API. Autoria, pagamento, contas e sincronização de progresso não fazem parte da PageZone V2.
