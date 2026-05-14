# Overview

Quick orientation to `iata-ssim` and its documentation.

## What this library does

`iata-ssim` parses [IATA Standard Schedules Information Manual](https://www.iata.org/en/publications/manuals/standard-schedules-information/) data formats. The current implementation covers **Chapter 7 — Schedule Data Set** (the `.ssim` file format airlines use to publish complete schedules). Sister modules for SSM, ASM and SCR (Chapters 4–6) are [coming soon](./roadmap).

## Where to start

| Page | What it covers |
|------|----------------|
| [**Getting Started**](./getting-started) | The 30-second example. Node and browser usage. |
| [**Installation**](./installation) | Package managers, CDN `<script>` tag, common usage patterns. |
| [**Validation**](./validation) | What the spec validator checks; lenient vs strict; reference to the 2012 manual. |
| [**Roadmap**](./roadmap) | What's implemented today (SDS) vs coming soon (SSM / ASM / SCR). |

## Where to go next

- [**Schedule Data Set**](/sds/) — the deep dive for Chapter 7: record types, byte-by-byte field reference, error handling.
- [**API Reference**](/api/) — full function signatures and TypeScript types.
- [**Playground**](/playground) — drop a `.ssim` file in your browser and inspect the parsed result.
