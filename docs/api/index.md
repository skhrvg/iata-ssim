# API Overview

```ts
import {
  // Schedule Data Set (Chapter 7) parsers
  parseScheduleDataSet,
  parseScheduleDataSetLine,
  parseScheduleDataSetRecords,

  // Errors & constants
  ScheduleDataSetParseError,
  RecordType,

  // Schedule Data Set types
  type ScheduleDataSet,
  type ScheduleDataSetRecord,
  type CarrierBlock,
  type HeaderRecord,
  type CarrierRecord,
  type FlightLegRecord,
  type SegmentDataRecord,
  type TrailerRecord,
  type ParseOptions,
  type ScheduleDataSetWarning,

  // Shared IATA data-element utilities
  parseIataDate,
  parseIataTime,
  parseUtcOffsetMinutes,
  parseDaysOfOperation,
  parseJointOperationAirlines,
  type IataTime,
} from 'iata-ssim/sds'
```

Or import only the Chapter 7 module explicitly:

```ts
import { parseScheduleDataSet } from 'iata-ssim/sds'
```

See [Functions](./functions.md) for behavior and [Types](./types.md) for shapes.
