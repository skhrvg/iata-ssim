# Field Reference

All positions are **1-indexed inclusive**. Every record is exactly 200 bytes long.

Field offsets follow the official **IATA SSIM, Chapter 7, §§ 7.5.1–7.5.5** (validated against the March 2011 and March 2012 editions). Changes introduced effective **1 October 2012** are flagged inline.

## Type 1 — Header (§ 7.5.1)

| Cols     | Field                          | Property |
|----------|--------------------------------|----------|
| 1        | Record type (`1`)              | — |
| 2–35     | Title of Contents              | `title` |
| 36–40    | Spare                          | — |
| 41       | Number of Seasons              | `numberOfSeasons` |
| 42–191   | Spare                          | — |
| 192–194  | Data Set Serial Number         | `dataSetSerialNumber` |
| 195–200  | Record Serial Number           | `recordSerialNumber` |

## Type 2 — Carrier (§ 7.5.2)

| Cols     | Field                                | Property |
|----------|--------------------------------------|----------|
| 1        | Record type (`2`)                    | — |
| 2        | Time mode (`U`=UTC, `L`=local)       | `timeMode` |
| 3–5      | Airline designator                   | `airlineDesignator` |
| 6–10     | Spare                                | — |
| 11–13    | Season                               | `season` |
| 14       | Spare                                | — |
| 15–21    | Period of Schedule Validity from     | `validFrom` |
| 22–28    | Period of Schedule Validity to       | `validTo` |
| 29–35    | Creation date                        | `creationDate` |
| 36–64    | Title of Data                        | `titleOfData` |
| 65–71    | Release (Sell) Date                  | `releaseDate` |
| 72       | Schedule Status (`P`/`C`)            | `scheduleStatus` |
| 73–107   | Creator Reference                    | `creatorReference` |
| 108      | Duplicate Airline Designator Marker  | `duplicateAirlineDesignatorMarker` |
| 109–168  | General Information                  | `generalInformation` |
| 169      | Secure Flight Indicator *(eff. 1 Oct 2012)* | `secureFlightIndicator` |
| 170–188  | In-Flight Service Information        | `inFlightServiceInformation` |
| 189–190  | Electronic Ticketing Information     | `electronicTicketingInformation` |
| 191–194  | Creation Time (HHMM)                 | `creationTime` |
| 195–200  | Record Serial Number                 | `serialNumber` |

## Type 3 — Flight Leg (§ 7.5.3)

| Cols     | Field                                 | Property |
|----------|---------------------------------------|----------|
| 1        | Record type (`3`)                     | — |
| 2        | Operational suffix                    | `operationalSuffix` |
| 3–5      | Airline designator                    | `airlineDesignator` |
| 6–9      | Flight number (4N)                    | `flightNumber` |
| 10–11    | Itinerary variation identifier        | `itineraryVariationId` |
| 12–13    | Leg sequence number                   | `legSequenceNumber` |
| 14       | Service type                          | `serviceType` |
| 15–21    | Period of operation from              | `periodFrom` |
| 22–28    | Period of operation to                | `periodTo` |
| 29–35    | Days of operation                     | `daysOfOperation` / `daysOfOperationRaw` |
| 36       | Frequency rate                        | `frequencyRate` |
| 37–39    | Departure station                     | `departure.station` |
| 40–43    | STD passenger (HHMM, local)           | `departure.stdPassenger` |
| 44–47    | STD aircraft (HHMM, local)            | `departure.stdAircraft` |
| 48–52    | UTC variation departure               | `departure.utcOffsetMinutes` |
| 53–54    | Departure terminal                    | `departure.terminal` |
| 55–57    | Arrival station                       | `arrival.station` |
| 58–61    | STA aircraft                          | `arrival.staAircraft` |
| 62–65    | STA passenger                         | `arrival.staPassenger` |
| 66–70    | UTC variation arrival                 | `arrival.utcOffsetMinutes` |
| 71–72    | Arrival terminal                      | `arrival.terminal` |
| 73–75    | Aircraft type                         | `aircraftType` |
| 76–95    | PRBD                                  | `prbd` |
| 96–100   | PRBM                                  | `prbm` |
| 101–110  | Meal service note                     | `mealServiceNote` |
| 111–119  | Joint operation airline designators   | `jointOperationAirlines` |
| 120      | MCT status (departure)                | `mctDeparture` |
| 121      | MCT status (arrival)                  | `mctArrival` |
| 122      | Secure Flight Indicator               | `secureFlightIndicator` |
| 128      | Itinerary variation overflow          | `itineraryVariationOverflow` |
| 129–131  | Aircraft owner                        | `aircraftOwner` |
| 132–134  | Cockpit crew employer                 | `cockpitCrewEmployer` |
| 135–137  | Cabin crew employer                   | `cabinCrewEmployer` |
| 138–140  | Onward airline designator             | `onwardAirline` |
| 141–144  | Onward flight number                  | `onwardFlightNumber` |
| 145      | Aircraft rotation layover             | `aircraftRotationLayover` |
| 146      | Onward operational suffix             | `onwardOperationalSuffix` |
| 148      | Flight transit layover                | `flightTransitLayover` |
| 149      | Code share / wet-lease indicator      | `codeShareWetLease` |
| 150–160  | Traffic restriction code              | `trafficRestrictionCode` |
| 161      | TRC leg overflow indicator            | `trcOverflow` |
| 173–192  | Aircraft configuration / version      | `aircraftConfiguration` |
| 193–194  | Date variation                        | `dateVariation` |
| 195–200  | Record serial number                  | `serialNumber` |

## Type 4 — Segment Data (§ 7.5.4)

| Cols    | Field                            | Property |
|---------|----------------------------------|----------|
| 1       | Record type (`4`)                | — |
| 2       | Operational suffix               | `operationalSuffix` |
| 3–5     | Airline designator               | `airlineDesignator` |
| 6–9     | Flight number                    | `flightNumber` |
| 10–11   | Itinerary variation identifier   | `itineraryVariationId` |
| 12–13   | Leg sequence number              | `legSequenceNumber` |
| 14      | Service type                     | `serviceType` |
| 28      | IVI overflow                     | `itineraryVariationOverflow` |
| 29      | Board point indicator            | `boardPointIndicator` |
| 30      | Off point indicator              | `offPointIndicator` |
| 31–33   | DEI code                         | `dataElementIdentifier` |
| 34–36   | Board point                      | `boardPoint` |
| 37–39   | Off point                        | `offPoint` |
| 40–194  | DEI payload                      | `data` |
| 195–200 | Record serial number             | `serialNumber` |

## Type 5 — Trailer (§ 7.5.5)

| Cols    | Field                              | Property |
|---------|------------------------------------|----------|
| 1       | Record type (`5`)                  | — |
| 2       | Spare                              | — |
| 3–5     | Airline designator                 | `airlineDesignator` |
| 6–12    | Release (Sell) Date                | `releaseDate` |
| 13–187  | Spare                              | — |
| 188–193 | Serial Number Check Reference      | `serialNumberCheckReference` |
| 194     | Continuation/End Code (`C`/`E`)    | `continuationEndCode` |
| 195–200 | Record Serial Number               | `recordSerialNumber` |

The trailer carries **no record count** — that field was a misconception in earlier informal docs. `serialNumberCheckReference` must equal the previous record's serial number for the file to be considered consistent.
