# Fonte canônica dos dados

O front-end não deve gerar, completar ou estimar dados bibliográficos.

- Livros até julho/2026 e os já registrados na planilha em agosto/2026:
  `Consolidado_Leituras_2023_2026_corrigido.xlsx`.
- Leituras de agosto/2026: `controle_leituras_backup.json`, por ser posterior.
- Idiomas: revisão manual concluída pelo proprietário do acervo.
- Capas: arquivos locais em `public/covers`.

A base utilizada pelo aplicativo está em `src/data/initialBooks.ts`. O arquivo
`controle_leituras_com_idiomas.json` é a cópia JSON auditável da mesma base.

Após a carga inicial, novas leituras e alterações ficam no armazenamento local
do navegador. O botão de nuvem importa ou exporta o acervo completo em JSON no
Google Drive. O Firestore não é usado como fonte dos livros.

Os geradores antigos em `scripts/` foram desativados porque continham regras de
preenchimento estimado para notas e idiomas.
