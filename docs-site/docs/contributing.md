---
sidebar_position: 5
---

# Contribuindo

## Testes do MCP

Na raiz do projeto, execute `npm test`.

Toda nova regra de classificação ou roteamento deve incluir pelo menos um caso
positivo e um caso que proteja contra classificação excessiva.

## Documentação

Dentro de `docs-site`:

```shell
npm install
npm run typecheck
npm run build
```

As páginas ficam em `docs-site/docs`. Atualize `sidebars.ts` quando uma nova
página precisar aparecer na navegação.

## Princípios

- correção vale mais que economia isolada;
- recomendações devem ser explicáveis;
- o núcleo não depende de um fornecedor;
- modelos indisponíveis nunca são recomendados;
- mudanças de pesos devem ser sustentadas por avaliações.
