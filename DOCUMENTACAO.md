# Documentação operacional — PageZone V3

## Arquitetura

A PageZone V3 é um monorepo editorial. A plataforma continua estática e compatível com GitHub Pages, mas a unidade de trabalho passou a ser o módulo da obra, não uma aplicação HTML duplicada.

```
livros/<id>/
  book.json          manifesto e metadados
  capa.*             capa local
  chapters.json      texto publicado estruturado
  memoria.md         memória narrativa interna
  planejamento.md    planejamento interno
  continuidade.json  estado editorial interno
```

A biblioteca pública consome somente `data/books.json`. O leitor público consome somente `book.json`, `chapters.json` e a capa. Documentos de memória e planejamento nunca são referenciados pela interface.

## Fonte da verdade e catálogo

`book.json` é a fonte de verdade de metadados por obra. `scripts/build-catalog.js` gera `data/books.json` e a cópia de compatibilidade `books.json`. Nunca edite esses dois arquivos manualmente: altere o manifesto e execute `npm run build`.

Campos essenciais do manifesto:

- `id`: permanente e único.
- `status`: `DEVELOPMENT`, `REVIEW`, `COMPLETED`, `PAUSED` ou `ARCHIVED`.
- `active`: exatamente uma obra ativa em todo o catálogo.
- `cover.path`: arquivo local da capa.
- `chapters.path`, `firstPublished`, `currentPublished`: referência e intervalo publicado.
- `legacy`: repositório e URL histórica, preservados para auditoria e reversão.
- `assets.formats`: possibilidades editoriais futuras; não ativa monetização.

## Capítulos e leitor

`chapters.json` contém uma lista ordenada de capítulos. Cada registro guarda número, rótulo de exibição, título e `bodyHtml` literário. Não contém layout, scripts, navegação ou CSS. A conversão V3 removeu a aplicação repetida dos antigos arquivos `capituloN.html`, preservando o conteúdo publicado.

O motor único está em `reader.html`, `app/reader.js` e `app/reader.css`. A URL é estável: `reader.html?book=<id>&chapter=<numero>`. Sem capítulo informado, o leitor retoma o último capítulo local; sem progresso local, abre o primeiro disponível.

O progresso usa `pagezone:progress:<id>`. Um livro novo não exige mudar JavaScript. Uma futura conta pode substituir ou complementar essa camada sem alterar capítulos.

Para obra `DEVELOPMENT`, o último capítulo mostra “Continua…”. Quando um capítulo for anexado a `chapters.json` e `currentPublished` for atualizado, o motor reconhece automaticamente a nova posição.

## Fluxo de publicação autônoma

1. Ler `editorial-state.json` e confirmar a única obra ativa.
2. Ler o manifesto, memória, planejamento, continuidade e capítulos relevantes.
3. Atualizar a memória factual antes de escrever.
4. Criar o novo registro em `chapters.json`, com número maior que o anterior.
5. Atualizar `currentPublished`, continuidade, memória, planejamento e `lastExecution` no estado editorial.
6. Executar `npm run check`.
7. Publicar o commit. A PageZone reflete o catálogo e o novo capítulo sem alteração no frontend.

A fila editorial prioriza as obras legadas em `DEVELOPMENT`. Não criar uma obra nova enquanto a fila existir. Ao terminar uma obra: mudar para `REVIEW`, revisar continuidade e capítulos, executar validação e somente então mudar para `COMPLETED`. As prateleiras são derivadas automaticamente do status.

## Memória narrativa

Para obras em desenvolvimento, `memoria.md`, `planejamento.md` e `continuidade.json` são obrigatórios. A migração criou um estado inicial factual e deliberadamente não inventou trama, revelações ou finais. Antes de retomar a autoria, o agente deve transformar os capítulos existentes em dossiês confirmados de personagens, cronologia, conflitos, pistas, objetos, relações e pontas abertas.

## Migração e legado

O inventário completo está em `editorial/migration-inventory.json`. As nove obras, 215 capítulos e nove capas foram centralizados. Os repositórios e URLs antigos não foram apagados nem redirecionados; continuam como legado validável. Cada manifesto mantém o vínculo original. Só considere redirecionar um site histórico em missão futura, após validação pública do leitor V3.

## Validação

`npm run validate` verifica IDs, status, presença de capa, capítulos, ordem, último capítulo, uma única obra ativa e arquivos editoriais obrigatórios. `npm run build` recria o catálogo público. `npm run check` executa ambos.

A plataforma não implementa login, pagamentos, assinatura, analytics ou paywall. O conteúdo editorial está separado dessas futuras camadas.
