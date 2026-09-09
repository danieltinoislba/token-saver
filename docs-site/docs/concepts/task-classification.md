---
sidebar_position: 1
---

# Classificação de tarefas

O classificador inicial usa regras e pontuação, sem chamada a LLM. Isso mantém a
decisão barata, rápida, reproduzível e fácil de auditar.

| Modo | Uso esperado | Estratégia inicial |
| --- | --- | --- |
| `bug_simple` | erro localizado ou operação simples | poucos arquivos e raciocínio baixo |
| `bug_complex` | concorrência, intermitência ou múltiplos serviços | investigação ampla e raciocínio alto |
| `architecture` | migração ou decisão sistêmica | contexto maior e análise arquitetural |
| `implementation` | feature ou refatoração comum | orçamento intermediário |
| `unknown` | evidência insuficiente | inspeção mínima antes de reclassificar |

## Por que existe `unknown`

Forçar uma classificação com pouca evidência pode remover contexto importante ou
escolher um modelo inadequado. `unknown` limita a primeira exploração e permite
reclassificar quando surgirem sinais concretos.

## Sinais do repositório

Além do texto do pedido, o cliente pode informar arquivos alterados, erros
recentes, serviços envolvidos e se a falha é reproduzível. Nenhum desses campos
é obrigatório.
