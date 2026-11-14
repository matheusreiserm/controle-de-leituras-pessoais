# Leituras

Diário pessoal de leituras: diário mensal, leituras em andamento, fichamentos, painel analítico, matriz de nacionalidades (volume de livros e diversidade de autores por país) e tabela mestre.

Site: <https://matheusreiserm.github.io/controle-de-leituras-pessoais/>

O acesso é restrito a uma única Conta Google, tanto no app quanto nas regras do Firestore.

## Onde ficam os dados

- **Firestore** (`users/{uid}/books/{id}`): a fonte principal. Cada livro é um documento; o fichamento fica dentro do livro.
- **Navegador** (`localStorage`): uma cópia do último acervo visto, só para abrir rápido. A nuvem sempre substitui essa cópia quando responde.
- **Google Drive**, pasta `Backups`: cópias conferidas do acervo inteiro em JSON. Ficam as 4 mais recentes e a última de cada mês. O backup automático roda no máximo uma vez por dia, só quando algo mudou, e depende do app aberto com a autorização do Drive ativa.
- **Capas**: as do catálogo original ficam em `public/covers` e saem com o site. Capas novas vão para a pasta `Capas do Leituras` no Drive, abertas a quem tiver o link, com uma cópia pequena guardada no livro.

A origem da base inicial está em `FONTE_DOS_DADOS.md`.

## Fichamentos

- Colar mantém só o texto, o itálico e o negrito. No campo de edição eles aparecem como `*itálico*` e `**negrito**`; Ctrl+I e Ctrl+B também aplicam.
- `___` marca a virada de página, sozinho numa linha ou entre espaços no meio do texto. Aparece como uma linha discreta e some do texto copiado e das exportações.
- Exportações: copiar texto, PDF (pela impressão do navegador), Markdown e texto puro.

## Desenvolvimento

Requer [Bun](https://bun.sh) e Node 24 (os testes usam recursos do Node 24).

```bash
bun install --frozen-lockfile
bun run dev      # http://localhost:3000 (o login funciona em localhost)
bun run test     # testes
bun run lint     # verificação de tipos
bun run build    # versão de produção em dist/
```

## Publicação

Um push na `main` dispara o GitHub Actions: testes, verificação de tipos, build e publicação no GitHub Pages. Se os testes falharem, nada é publicado. Branches de trabalho são verificadas a cada push.

As regras de segurança do Firestore estão em `firestore.rules`, mas não são publicadas pelo CI: qualquer mudança nelas precisa ser colada no console do Firebase (Firestore → Regras).

## Estrutura

- `src/App.tsx`: estado do acervo, sincronização com o Firestore e gravações.
- `src/components/`: telas e janelas.
- `src/lib/`: Firebase, Firestore, Google Drive.
- `src/utils/`: regras puras e testadas (numeração das leituras, fichamento, validação de backup, capas, países).
- `src/data/initialBooks.ts`: a base inicial de 551 leituras, usada na primeira migração para o Firestore.
- `tests/`: testes com o executor do próprio Node.
