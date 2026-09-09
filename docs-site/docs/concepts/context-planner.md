---
sidebar_position: 3
---

# Planejamento de contexto

`plan_context` recebe candidatos de um cliente — arquivos, símbolos ou trechos —
e escolhe os mais relevantes sem ultrapassar o orçamento de tokens.

## Entrada mínima

Cada candidato informa:

- `path` e `kind`;
- `summary` curto;
- `relevance` entre 0 e 1;
- `estimatedTokens`;
- dependências opcionais.

O cliente continua responsável por descobrir os candidatos. Isso evita uma
varredura completa do repositório e permite usar ripgrep, índices semânticos ou
APIs específicas de cada ambiente.

## Estratégias por modo

- bugs simples priorizam snippets e símbolos;
- bugs complexos equilibram símbolos e arquivos relacionados;
- arquitetura prioriza arquivos estruturais e retorna resumos;
- implementação usa um equilíbrio entre símbolos e arquivos.

A resposta inclui os itens selecionados, tokens estimados, tokens economizados,
dependências que merecem novas consultas e os itens excluídos.
