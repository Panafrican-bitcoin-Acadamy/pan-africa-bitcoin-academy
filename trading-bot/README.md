# Paper trading bot (template)

**Educational use only.** This does not connect to live markets by default. Real trading risks total loss, fees, slippage, API failures, and regulatory obligations. Test on paper / sandbox first; never share API secrets.

## What this folder contains

- `strategy_prompt_template.md` — what to write when you describe a strategy (for you or an LLM assistant).
- `paper_bot.py` — minimal loop: fake prices or CSV, your rules, logged “orders”.
- `config.example.env` — copy to `.env` and adjust (no secrets committed).

## Architecture (what a real bot includes)

1. **Data** — OHLCV, order book, or ticks (exchange REST/WebSocket or files for backtest).
2. **Strategy** — deterministic rules or signals (indicators, thresholds, filters).
3. **Risk** — max position size, max daily loss, kill switch, cooldown after errors.
4. **Execution** — place/cancel orders, idempotency, handle partial fills (later: use exchange SDK).
5. **State & logs** — positions, PnL, audit trail (CSV/DB).

## Quick start (simulation)

```bash
cd trading-bot
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy config.example.env .env
python paper_bot.py
```

## Next steps toward “real” trading

- Pick one exchange and read their API + rate limits + ToS.
- Use **testnet / paper** API if available.
- Add `ccxt` or the official SDK; keep keys in `.env` only.
- Backtest on historical data before any live size.
