---
title: Playground
aside: false
outline: false
---

# Playground

Interactive viewer for IATA SSIM **Schedule Data Set** files (Chapter 7, `.ssim`). Upload a file or paste contents below — `iata-ssim` parses it in your browser and shows the structured result.

<Playground />

::: tip Privacy
Everything runs locally in your browser — the file contents never leave this page.
:::

## What you can do here

- **Overview** — high-level summary: header, carrier metadata, record counts, warnings
- **Flight legs** — sortable/searchable table of all parsed Type 3 records
- **JSON tree** — the full parsed structure as an expandable JSON tree (optional `raw` field for byte-by-byte inspection)
- **Warnings** — issues the parser noticed in lenient mode (unexpected record order, unknown record types, etc.)

For programmatic use, see [Parsing SDS](/sds/parsing) or the [API reference](/api/).
