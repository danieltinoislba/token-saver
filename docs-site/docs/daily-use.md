---
sidebar_position: 3
---

# Uso diário

Depois de instalar o MCP, há dois jeitos de usá-lo.

## Pedir planejamento

Para uma task normal, peça ao agente:

```text
Use o Token Saver para investigar o erro de login.
```

Ele deve classificar a task, descobrir poucos arquivos relevantes e planejar o
contexto antes de ler conteúdo em massa.

## Executar com roteamento automático

Para deixar o Token Saver escolher modelo, esforço e contexto:

```text
Use run_routed_task do Token Saver para implementar autenticação por API key.
```

Essa ferramenta cria uma **nova task do Codex**. Ela pode editar arquivos, por
isso só deve ser chamada quando o usuário autorizou a execução.

## Regra simples

Se a task menciona um repositório grande, logs ou muitos arquivos, comece com
`discover_context`. Se ela altera código e pode ser trabalhosa, prefira
`run_routed_task`.
