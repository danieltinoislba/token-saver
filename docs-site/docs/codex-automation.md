---
sidebar_position: 7
---

# Automação no Codex

O Token Saver mantém o núcleo como MCP portátil e oferece uma camada opcional
para Codex.

## Fluxo automático

`run_routed_task` classifica a task, descobre arquivos relevantes sem ler o
repositório inteiro, planeja o contexto, consulta os modelos e cria uma nova
task com modelo e esforço apropriados.

## Plugin Token Saver Codex

O plugin instala o MCP e um hook de proteção. O hook bloqueia leituras amplas
via shell, como `Get-Content src/*.ts`, e orienta o agente a planejar o contexto
primeiro. Leituras pontuais continuam permitidas.

## Limite importante

O MCP não troca o modelo de um chat Desktop já iniciado. A troca automática
acontece no runner, porque ele controla a criação da nova task pelo App Server.
