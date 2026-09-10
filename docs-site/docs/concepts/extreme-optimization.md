---
sidebar_position: 4
---

# Otimização extrema

O Token Saver quer reduzir o consumo total de uma task, não apenas deixar a
resposta final menor. A estratégia combina ideias validadas pela comunidade em
uma camada portátil, com cada economia medida separadamente.

## As camadas

1. **Preflight:** classifica a task e define limites de contexto, saída, calls,
   tempo e custo.
2. **Descoberta seletiva:** pesquisa primeiro; lê snippets, símbolos e arquivos
   somente quando necessário. Inspira-se em ferramentas como th0th e nos fluxos
   de tool search.
3. **Context gate:** normaliza, deduplica e corta ruído de logs, testes, diffs e
   respostas de APIs. Material grande vira preview mais um handle recuperável,
   como nos padrões de RTK e ContextGate.
4. **Budget allocator:** cobra somente os tokens efetivamente transmitidos. Um
   arquivo grande pode entrar como resumo quando seu conteúdo não cabe.
5. **Execução adaptativa:** usa o menor modelo e esforço suficientes, escalando
   apenas diante de evidência.
6. **Saída compacta:** remove preâmbulos e repetição sem alterar código, paths,
   comandos, erros ou avisos. O Caveman é uma referência para esta camada.
7. **Memória sob demanda:** guarda decisões e fatos reutilizáveis, mas recupera
   somente o que for relevante e ainda estiver válido.
8. **Telemetria e qualidade:** compara economia, sucesso e regressões contra uma
   execução equivalente sem otimização.

## Worker Mesh

Subagents são úteis quando isolam uma grande leitura ou resultado em uma janela
separada. Eles não economizam automaticamente: delegar só vale quando o contexto
evitado no agente principal supera o prompt, a execução e o resumo do worker.

O desenho inicial usa quatro papéis efêmeros:

- **Context Scout:** busca e lê material volumoso, sem editar;
- **Context Compressor:** cria uma cápsula curta e referenciável;
- **Task Worker:** executa uma subtarefa atômica com ferramentas limitadas;
- **Verifier:** confere apenas alegações críticas ou de baixa confiança.

Workers recebem objetivo, critérios de aceite, referências de contexto,
allowlist de ferramentas e limites rígidos. Não recebem o histórico inteiro e
não podem criar outros workers. O retorno contém resumo curto, achados,
referências de evidência, artefatos e consumo medido; logs completos ficam fora
do contexto principal.

## Quando delegar

O roteador deve manter a task local quando ela é curta, fortemente dependente do
histórico ou exige diálogo frequente. Um worker passa a ser candidato quando:

- há milhares de tokens de arquivos, logs, documentação ou schemas para filtrar;
- a subtarefa é independente e verificável;
- o resultado cabe em uma fração pequena do material analisado;
- um modelo menor consegue executá-la;
- a economia estimada cobre o overhead com margem de segurança.

## Roadmap

### Fase 1 — medir e limitar

- orçamento baseado no payload realmente transmitido;
- telemetria de input, output, cache, custo, calls, tentativas e sucesso;
- limites por ferramenta, timeout e circuit breaker;
- benchmark de `tokens por task aceita`.

### Fase 2 — reduzir contexto de entrada

- busca por conteúdo, símbolos, imports, diff e stack trace;
- lazy-loading de tools e namespaces MCP;
- preview mais handle para outputs grandes;
- deduplicação e cache por hash de conteúdo.

### Fase 3 — compactar sem perder evidência

- prune determinístico antes de usar um modelo;
- resumos estruturados com referências recuperáveis;
- perfis de saída `normal`, `concise` e `ultra`, com válvula de segurança;
- memória seletiva com invalidação por versão.

### Fase 4 — Worker Mesh

- `plan_delegation` para estimar custo e ganho;
- `run_isolated_task` com budget compartilhado;
- Return Gate para limitar o que volta ao agente principal;
- Context Scout como primeiro worker;
- paralelismo somente para subtarefas independentes.

## Métricas honestas

O dashboard deve separar ganho de isolamento e economia total:

- tokens do agente principal e dos workers;
- tokens de contexto evitados no agente principal;
- overhead de delegação e compactação;
- tokens de cache lidos e gravados;
- bytes lidos versus tokens devolvidos;
- retries, escalonamentos e loops bloqueados;
- custo, latência, qualidade e taxa de sucesso;
- economia líquida contra um baseline equivalente.

Se o contexto principal cair, mas o total da árvore subir, isso é ganho de
isolamento — não economia de tokens.

## Referências do ecossistema

- [Caveman](https://github.com/JuliusBrussee/caveman)
- [RTK](https://github.com/rtk-ai/rtk)
- [th0th](https://github.com/S1LV4/th0th)
- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents)
- [OpenAI tool search](https://developers.openai.com/api/docs/guides/tools-tool-search)
- [OpenAI compaction](https://developers.openai.com/api/docs/guides/compaction)
- [MCP sampling](https://modelcontextprotocol.io/specification/draft/client/sampling)

