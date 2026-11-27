# Alpha Terminal — Live Ship Audit (2026-11-27)

Live HTTP invoke of `lotto-machine-wr6t.onrender.com` via `hedge-fund-v2` client contracts.

## Verdict

**Not hedge-fund ready.** Core sensors for GEX, dark pool, option walls, and master signals are blind or empty during RTH. UI previously swallowed many of these failures.

## Signal processing path

1. `LiveMonitor` buffer
2. `AlertDB` (observed: FRED capture WATCH noise)
3. Morning brief fallback
4. Kill chain as confidence modifier only (`SOFT_VETO`, confluence `SINGLE`)

Frontend mostly polls. WebSocket `/api/v1/ws/signals` handshakes (101) but is not wired into the Signals page.

## Blind spots (runtime)

| Sensor | Evidence |
|--------|----------|
| Master signals | `master_count=0` |
| Gate | blocked 20 / allowed 0 |
| GEX / walls | Must come from **AXLFI dark-pool API** (`/axlfi/option-walls/*`), not CBOE. CBOE was a wrong assumption. |
| Dark pool | AXLFI v2 `/api/darkpools/*` (Pro-gated for bare HTTP; walls public). Legacy `axlfi-app-backend` is dead HTML shell. |
| Master signals | DarkPoolTrend from AXLFI 5d `position_usd` trend — was empty because StockgridClient still hit dead routes. |
| Walls | intraday `wall_status=unknown`, walls at 0 |
| AXLFI | dashboard 503; signals `[]` |
| Oracle | POST 200 but `UNAVAILABLE` / `UNKNOWN` |
| signal-intel | timeout >90s |
| Paper accuracy | 2/2 but duplicate Mar-10 rows, manually recovered |

## Edge that still works

- COT crowded short (-93,966) coherent
- DP historical edge-stats ~89.8% WR on 342 samples
- `/brief/master` assembles macro layers (slow cold start ~34s)
- Volume profile ACCUMULATION / distribution character

## 72h technical plan

1. **H0–H8** Restore CBOE/Stockgrid/walls; prove ≥1 master SPY/QQQ signal in RTH
2. **H8–H24** Fix gate starvation; outcome scorecard; stop silent UI catches (partially done in this PR)
3. **H24–H48** Always-on infra (leave free Render sleep); auth; cache brief/signals
4. **H48–H72** RTH audit log; unique paper trail; WS on Signals; labeled demo

## This PR

- `DataBlindBanner` on every `PageShell` page — empty ≠ healthy
- Signals history/scorecard errors no longer swallowed
- SignalsCenter surfaces `master_count=0` as a sensor warning
