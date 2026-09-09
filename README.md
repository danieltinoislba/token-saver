# Token Saver MCP

Servidor MCP que classifica tarefas de desenvolvimento antes da exploração do
repositório. O objetivo é selecionar somente o contexto necessário para cada
tipo de trabalho, preservando qualidade enquanto reduz tokens.

## Estado atual

O primeiro incremento oferece `classify_task`, com cinco modos:
`bug_simple`, `bug_complex`, `architecture`, `implementation` e `unknown`.

A classificação é determinística, explicável e não chama outro modelo.

## Desenvolvimento

```shell
npm test
npm start
```

Antes de iniciar, execute `npm run build`.

Os pesos e orçamentos atuais são hipóteses iniciais. Eles deverão ser calibrados
com um conjunto de tarefas reais e métricas de resolução por token consumido.
