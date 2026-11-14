# Fonte canônica dos dados

O front-end não deve gerar, completar ou estimar dados bibliográficos.

- Livros até julho/2026 e os já registrados na planilha em agosto/2026:
  `Consolidado_Leituras_2023_2026_corrigido.xlsx`.
- Leituras de agosto/2026: `controle_leituras_backup.json`, por ser posterior.
- Idiomas: revisão manual concluída pelo proprietário do acervo.
- Capas: arquivos locais em `public/covers`.

A base utilizada pelo aplicativo está em `src/data/initialBooks.ts`. O arquivo
`controle_leituras_com_idiomas.json` é a cópia JSON auditável da mesma base.

Essa base foi a carga inicial: depois da migração, o acervo vive no Firestore,
que é a fonte principal. Novas leituras e alterações vão direto para lá. O
navegador guarda só uma cópia para abrir rápido, e o Google Drive guarda os
backups em JSON (veja o README).

Os geradores antigos em `scripts/` foram desativados porque continham regras de
preenchimento estimado para notas e idiomas.
