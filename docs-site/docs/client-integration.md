---
sidebar_position: 4
---

# Integração com clientes

## Integração MCP portátil

Qualquer cliente compatível pode chamar `classify_task` e `recommend_model`. Essa
modalidade é consultiva porque o MCP pode não controlar a sessão do cliente.

## Adaptadores opcionais

Um adaptador pode executar um preflight antes do modelo principal:

```text
pedido → classificação barata → escolha do modelo → execução → métricas
```

Esse é o caminho para evitar que a primeira chamada já aconteça em um modelo
desnecessariamente caro.

Adaptadores devem:

1. consultar os modelos realmente disponíveis;
2. enviar esse catálogo ao roteador;
3. aplicar a recomendação somente se o cliente permitir;
4. preservar a escolha do usuário quando a política for `advisory`;
5. registrar recomendação, escolha efetiva e resultado da tarefa.

## Codex

O suporte ao Codex será um adaptador opcional. O núcleo permanecerá utilizável
por outros clientes, e o adaptador não deverá codificar uma lista permanente de
modelos: disponibilidade e nomes precisam vir do ambiente atual.
