# Live Data Sources

DRISHTI uses free public sources first and marks every output with mode and confidence.

| Source | Use | Free status | Notes |
| --- | --- | --- | --- |
| PPAC India import/export AJAX | Crude import baseline | Free public endpoint | The parser is defensive because PPAC markup can change. |
| PPAC homepage | Petrol and diesel prices | Free public page | Used for citizen impact signals. |
| FRED `DCOILBRENTEU` | Brent daily price | Free CSV | Stable public CSV. |
| Frankfurter | USD/INR FX | Free API | Used to convert crude cost to INR. |
| Open-Meteo Marine | Wave and swell | Free API | Used for corridor weather stress. |
| Open-Meteo Weather | Wind and visibility | Free API | Used for operational corridor risk. |
| CISA KEV | Known exploited vulnerabilities | Free JSON | Used for port cyber overlay. |
| FIRST EPSS | Exploit probability | Free API | Used for cyber risk prioritization. |
| OSV | Open-source dependency vulnerability check | Free API | Demo query models port software supply chain checks. |
| EIA RSS | Energy news feed | Free RSS | Used when paid news keys are absent. |
| AISStream | Vessel AIS | Free registration/key | Optional. Without key, vessel positions are simulated and clearly labeled. |
| Deendayal Port | Berthing status links | Free public page | Evidence link for Indian port schedules. |
| Mumbai Port | Tanker/vessel information | Free public page | Evidence link for Indian tanker schedules. |

## Vessel cargo caveat

Free AIS generally exposes position, speed, heading, ship type, destination, and draught. Exact cargo like coal, LPG, petrol, or crude is often inferred from ship class, route, terminal, and port schedule. DRISHTI labels this as inferred unless an authenticated port or AIS provider supplies the cargo field.

## Failure policy

If a source fails:

1. Use the in-memory cache if fresh.
2. Mark the envelope as `cached`.
3. If there is no cache, use deterministic fallback data.
4. Mark fallback output as `fallback` or `simulated`.
5. Preserve a source warning for the UI and evidence pack.
