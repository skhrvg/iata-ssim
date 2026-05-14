# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0]

### Added

- Initial release.
- `parseScheduleDataSet` — full parser for IATA SSIM Chapter 7 (Schedule Data Set, `.ssim` files).
- `parseScheduleDataSetLine` — single-line parser for fixed-width 200-byte records.
- `parseScheduleDataSetRecords` — async generator for streaming large files.
- `validateScheduleDataSet` + per-record validators — full spec rules from § 7.5.1–7.5.5.
- Shared SSIM-wide data-element utilities at the package root: `parseIataDate`, `parseIataTime`, `parseUtcOffsetMinutes`, `parseDaysOfOperation`, `parseJointOperationAirlines`.
- Two entry points: `iata-ssim` (full surface + utilities) and `iata-ssim/sds` (Chapter 7 only).
- Validated against the IATA SSIM March 2011 and March 2012 editions, and against 14 real-world `.ssim` files (~48 500 flight legs across 10 vendors).

[0.1.0]: https://github.com/skhrvg/iata-ssim/releases/tag/v0.1.0
