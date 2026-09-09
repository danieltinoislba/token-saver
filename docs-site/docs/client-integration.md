---
sidebar_position: 4
---

# Integração com clientes

## Integração MCP portátil

Qualquer cliente compatível pode chamar `classify_task`, `recommend_model` e
`plan_context`. Sem um adaptador que controle a sessão, a recomendação é
consultiva.

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
3. aplicar a troca automaticamente com a política `auto`;
4. pedir confirmação com `guarded`;
5. preservar a escolha do usuário com `manual`;
6. registrar recomendação, escolha efetiva e resultado da tarefa.

## Codex

O suporte ao Codex é um adaptador opcional. Ele não codifica uma lista permanente
de modelos: disponibilidade e nomes vêm do ambiente atual por `listModels()`.

O cliente precisa reiniciar ou recarregar o catálogo MCP depois de instalar uma
versão nova do servidor. No Codex, `/mcp` mostra o estado da conexão.
