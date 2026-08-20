# Atualização da base corrigida

Esta versão contém 551 registros e 551 capas locais.

## Composição da base

- 542 registros históricos reconstruídos a partir das planilhas.
- 9 registros de agosto de 2026 provenientes do backup JSON.
- 549 leituras concluídas: 69 em 2023, 183 em 2024, 207 em 2025 e 90 em 2026.
- 2 leituras em andamento.
- Idiomas históricos não presentes nas planilhas aparecem como `Não informado`.

## Aplicação no Firestore

1. Importe este projeto no Google AI Studio e publique a nova versão.
2. Entre com a conta autorizada.
3. Abra **Migração Firestore**.
4. Mantenha marcada a opção **Atualizar registros existentes com a base corrigida**.
5. Clique em **Aplicar Base Corrigida (551 Registros)** e confirme.

A migração usa mesclagem: os campos bibliográficos e as capas são atualizados, enquanto campos adicionais existentes — como notas, gênero e fichamentos — são preservados.

O banco nomeado configurado continua sendo:

`ai-studio-controledeleitur-520bd858-2710-4e37-997f-1e910d1267f6`

As capas ficam em `public/covers` e são referenciadas por caminhos como `/covers/0001.webp`. Elas não dependem de Amazon, Goodreads ou outro serviço de imagens.
