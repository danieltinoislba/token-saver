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

As políticas suportadas são `auto`, `guarded` e `manual` (com `advisory` e
`enforced` mantidos como aliases). `auto` é o padrão: quando o adaptador controla
a sessão, ele deve trocar automaticamente; `guarded` exige confirmação; `manual`
apenas recomenda. O MCP informa `switchMode` e `shouldSwitch`, mas a execução
efetiva depende do cliente ou adaptador.

## Desenvolvimento

```shell
npm test
npm start
npm run codex -- "Como rodar este projeto?"
```

Antes de iniciar, execute `npm run build`.

Os pesos e orçamentos atuais são hipóteses iniciais. Eles deverão ser calibrados
com um conjunto de tarefas reais e métricas de resolução por token consumido.

## Avaliações

`npm run eval` executa o dataset versionado em `evals/cases.json`, mostra
acurácia por modo e nível, matriz de confusão e casos divergentes. O comando
falha se a acurácia cair abaixo de 85%.

## Runner Codex

`npm run codex -- "seu pedido"` inicia o Codex App Server por `stdio`, consulta
`model/list`, escolhe o modelo pelo Token Saver e inicia `thread/start` e
`turn/start`. O comando requer o executável `codex` autenticado e disponível no
PATH. O runner é uma integração separada do servidor MCP portátil.

O MCP também expõe `run_routed_task`, que inicia o mesmo runner para clientes
que querem delegar a execução. Ele abre uma nova thread no Codex App Server,
seleciona automaticamente modelo e esforço e retorna o resultado ao concluir.
O cliente precisa ter o executável `codex` autenticado no PATH; como a task pode
editar arquivos, só chame essa ferramenta com autorização explícita do usuário.

`discover_context` cria candidatos locais sem carregar o repositório inteiro:
primeiro classifica os caminhos por relevância e depois lê apenas os mais
relevantes, com limites de tamanho. `run_routed_task` usa essa descoberta por
padrão quando o cliente não fornece candidatos.

Para economizar contexto de verdade, clientes que usam o runner podem fornecer
`contextCandidates` (arquivos, símbolos ou trechos com relevância e custo
estimado). Antes de iniciar o turno, o runner chama `planContext` e anexa apenas
os itens selecionados dentro do orçamento. Sem candidatos, o pedido é enviado
inalterado: o runner não lê nem transmite arquivos do repositório sozinho.
