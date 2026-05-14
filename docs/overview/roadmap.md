# Roadmap

The [IATA Standard Schedules Information Manual](https://www.iata.org/en/publications/manuals/standard-schedules-information/) defines several distinct data formats across nine chapters. `iata-ssim` is structured to host parsers for each of them as separate sub-modules under the same umbrella package.

## Status

| Chapter | Format                                  | Sub-path                | Status |
|---------|-----------------------------------------|-------------------------|--------|
| 7       | **Schedule Data Set (SDS)** — `.ssim`   | `iata-ssim/sds`         | ✅ Implemented |
| 4       | **SSM** — Standard Schedules Message    | `iata-ssim/ssm` *(planned)* | 🟡 Coming soon |
| 5       | **ASM** — Ad Hoc Schedules Message      | `iata-ssim/asm` *(planned)* | 🟡 Coming soon |
| 6       | **SCR** — Slot Clearance Request        | `iata-ssim/scr` *(planned)* | 🟡 Coming soon |
| 2       | Data Elements (DEI codes)               | shared utils            | 🟢 Reusable utilities already in place |
| 1, 3, 8, 9 | Definitions, print layouts, rescinded chapters | —              | ⚪ Out of scope |

## What is implemented today — Chapter 7 (SDS)

The Schedule Data Set is a fixed-width 200-byte file format airlines use to publish complete schedules. The parser supports:

- All five spec record types (Type 1 Header, Type 2 Carrier, Type 3 Flight Leg, Type 4 Segment Data, Type 5 Trailer).
- Both March 2011 and March 2012 editions of the manual (`secureFlightIndicator` reassignment in Type 2 byte 169 is handled).
- Strict and lenient parsing modes.
- Full per-record + cross-record spec validation with byte-precise issue locations (line and column).
- De-facto industry conventions like all-zero filler lines and UTF-8 BOM stripping.

See [SDS → Overview](/sds/) for usage details and [Getting Started](./getting-started) for installation and a first example.

## What is coming next

### SSM — Standard Schedules Message (Chapter 4)

Telex-style messages used for routine schedule changes — additions, cancellations, replacements. Line-based text format with action codes (`NEW`, `CNL`, `RPL`, `EQT`, `TIM`, …) rather than fixed-width records.

### ASM — Ad Hoc Schedules Message (Chapter 5)

Per-flight ad-hoc operational changes, also telex-style. Similar shape to SSM but with different action codes (`RRT` for re-route, `NEW` for new ad-hoc, …) and segment annotations.

### SCR — Slot Clearance Request (Chapter 6)

Airport coordination messages: slot requests/responses between airlines and slot coordinators. Uses action codes like `U`, `H`, `L`, `K`, `X`, etc.

All three sub-modules will share the existing `iata-ssim/utils` data-element helpers (`parseIataDate`, `parseIataTime`, `parseUtcOffsetMinutes`, …) so dates, times and IATA codes parse identically across formats. The published API for each new sub-module will mirror the SDS shape: `parse<Format>` + `validate<Format>` + per-record TypeScript types.

## How to help

- **Send a newer manual edition.** This library was validated against March 2011 and March 2012. Newer editions almost certainly add new DEI codes and may revise byte assignments in Type 2/3. If you have a copy of any later edition, please open an issue with the relevant chapter — even a screenshot helps.
- **Share real-world fixtures.** Anonymized `.ssim` exports from production schedules expose edge cases that synthetic tests miss. See [samples-validator/samples/](https://github.com/skhrvg/iata-ssim/tree/main/samples-validator/samples) for the drop folder.
- **Comment on SSM/ASM/SCR priorities.** Which non-SDS format you most need — and which use cases you have — will shape implementation order.
