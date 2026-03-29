# Strategy & bot specification (prompt / design doc)

Copy this, fill every section, then use it yourself or paste it to an AI **only** to generate code you review and test on paper.

## 1. Market & instrument

- Exchange (name):
- Market type: spot / perpetuals / other
- Symbol(s) (e.g. `BTC/USDT`):
- Base quote currency:
- Minimum order size / tick size (if known):

## 2. Timeframe & data

- Candle timeframe (e.g. 5m, 1h) or tick-based:
- How much history needed for indicators:
- Data source: exchange API / CSV files / other

## 3. Strategy rules (must be precise)

Describe **exactly** when to enter, exit, and when to do nothing.

- **Long entry** (all conditions, AND/OR):
- **Long exit** (take profit, stop loss, time stop, signal reversal):
- **Short** (only if you trade shorts; same detail):
- **Position sizing**: fixed USD, % of equity, risk per trade (R multiple):
- **Max open positions**:
- **Cooldown** after a loss or after N trades per day:

## 4. Risk management (non-negotiable)

- Max loss per day (% or USD):
- Max position per symbol (% of account):
- Max leverage (if any):
- **Kill switch**: stop bot if drawdown > X% or N consecutive errors

## 5. Execution assumptions

- Order type: market / limit / post-only
- Slippage model for backtest (e.g. 0.05%):
- Fees (maker/taker %):
- Whether to trade 24/7 or only certain hours (timezone):

## 6. Failure modes

- What if API returns error / timeout?
- What if balance is insufficient?
- What if price gaps past stop?

## 7. Success metrics (for evaluation)

- Metric: e.g. Sharpe, max drawdown, win rate, profit factor
- Minimum backtest length:
- Walk-forward or out-of-sample plan:

## 8. Tech constraints

- Language: Python / TypeScript / other
- Hosting: local / VPS / cloud
- Secrets: stored only in `.env`, never in git

---

**LLM instruction line you can append:**  
“Generate Python code that implements only sections 3–5 as pure functions with unit-testable logic; use dependency injection for price feeds and order execution; default to paper mode; no hardcoded API keys.”
