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
| `advisory` | mostra ou registra a recomendação |
| `guarded` | alerta quando a escolha é desproporcional |
| `enforced` | troca automaticamente quando o cliente oferece esse controle |

O MCP sempre retorna `shouldSwitch`, mas não afirma que realizou a troca.

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
