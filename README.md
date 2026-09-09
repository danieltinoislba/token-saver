# Token Saver MCP

Servidor MCP que classifica tarefas de desenvolvimento antes da exploração do
repositório. O objetivo é selecionar somente o contexto necessário para cada
tipo de trabalho, preservando qualidade enquanto reduz tokens.

## Estado atual

O primeiro incremento oferece `classify_task`, com cinco modos:
`bug_simple`, `bug_complex`, `architecture`, `implementation` e `unknown`.

A classificação é determinística, explicável e não chama outro modelo.

`recommend_model` combina a classificação com o catálogo fornecido pelo cliente.
Ele recomenda um nível (`economy`, `balanced` ou `powerful`), esforço de
raciocínio, limite de saída e gatilhos de escalonamento. O núcleo não contém
nomes fixos de fornecedores e nunca recomenda um modelo fora do catálogo.

As políticas suportadas são `advisory`, `guarded` e `enforced`. O MCP informa
`shouldSwitch`; somente um cliente ou adaptador capaz de controlar a sessão pode
executar a troca de modelo.

## Desenvolvimento

```shell
npm test
npm start
```

Antes de iniciar, execute `npm run build`.

Os pesos e orçamentos atuais são hipóteses iniciais. Eles deverão ser calibrados
com um conjunto de tarefas reais e métricas de resolução por token consumido.
