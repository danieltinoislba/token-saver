---
sidebar_position: 2
---

# Roteamento de modelos

O núcleo trabalha com níveis universais, não com nomes de fornecedores:

- `economy`: tarefas localizadas, comandos e explicações diretas;
- `balanced`: implementação comum e investigação moderada;
- `powerful`: arquitetura e problemas difíceis;
- `specialized`: capacidade específica que não participa do ranking geral.

## Políticas

| Política | Comportamento esperado do adaptador |
| --- | --- |
| `auto` | troca automaticamente quando o cliente controla a sessão |
| `guarded` | pede confirmação antes de trocar |
| `manual` | apenas informa a recomendação |

`advisory` e `enforced` continuam aceitos como aliases de `manual` e `auto`.
O MCP retorna `shouldSwitch`, `switchMode` e `requiresConfirmation`; o adaptador
é responsável por executar a decisão.

## Seleção

Primeiro são removidos modelos que não atendem às capacidades obrigatórias.
Depois o roteador procura o nível mais próximo do necessário. Em um empate,
prefere o menor custo declarado pelo cliente.

Se nenhum modelo for compatível, o resultado contém `recommendedModel: null` em
vez de inventar uma alternativa.

## Escalonamento

Uma tarefa começa no menor nível considerado suficiente. Gatilhos específicos,
como testes ainda falhando ou descoberta de vários serviços envolvidos, permitem
subir de nível de forma explícita.

## Adaptador Codex

O adaptador Codex implementa um contrato de sessão com três operações:

```text
listModels() → catálogo disponível
getSelectedModelId() → modelo atual
switchModel(id) → troca da sessão
```

Com `auto`, o adaptador chama `switchModel` antes da execução principal. O MCP
não altera diretamente a sessão do Codex; essa separação permite testar o núcleo
e manter compatibilidade com clientes que não oferecem troca programática.
