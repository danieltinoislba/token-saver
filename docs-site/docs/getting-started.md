---
sidebar_position: 2
---

# Instalação e primeiro uso

## Requisitos

- Node.js 20 ou superior
- um cliente compatível com MCP por `stdio`

## Preparar o servidor

Na raiz do repositório:

```shell
npm install
npm test
npm run build
```

O processo MCP é iniciado com `npm start`.

## Configurar um cliente

Clientes MCP têm formatos de configuração diferentes. Em todos eles, configure
um servidor `stdio` cujo comando execute `node` e cujo argumento seja o caminho
absoluto para `dist/index.js`.

```json
{
  "mcpServers": {
    "token-saver": {
      "command": "node",
      "args": ["/caminho/absoluto/token-saver/dist/index.js"]
    }
  }
}
```

## Ferramentas disponíveis

### `classify_task`

Recebe o pedido e sinais opcionais do repositório. Retorna modo, confiança,
motivos, pontuações e uma estratégia de exploração.

### `recommend_model`

Recebe o pedido e o catálogo real de modelos do cliente. Retorna o modelo mais
adequado, esforço de raciocínio, limite de saída e gatilhos de escalonamento.

O catálogo deve vir do cliente; isso impede recomendações de modelos inexistentes
ou indisponíveis para aquela conta.

### `plan_context`

Recebe candidatos já encontrados pelo cliente e seleciona arquivos, símbolos e
trechos dentro do orçamento. O servidor não varre o filesystem automaticamente.

## Troca automática

Para executar `auto`, o cliente precisa fornecer um adaptador de sessão capaz de
listar modelos, informar o modelo atual e trocar o modelo. Sem essa capacidade,
use `guarded` ou `manual` e trate a resposta como recomendação.
