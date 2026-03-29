"""
Paper-trading skeleton: moving-average crossover on simulated or CSV prices.
No live exchange calls. Extend `execute_paper_order` when you add a real adapter.
"""

from __future__ import annotations

import csv
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List, Optional

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Candle:
    ts: int
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0


@dataclass
class Portfolio:
    cash_usd: float
    position_units: float = 0.0
    avg_entry: float = 0.0


@dataclass
class BotConfig:
    mode: str
    csv_path: Optional[str]
    initial_balance: float
    position_size_usd: float
    symbol: str
    fast_ma: int
    slow_ma: int


def load_config() -> BotConfig:
    return BotConfig(
        mode=os.getenv("MODE", "SIM").upper(),
        csv_path=os.getenv("CSV_PATH"),
        initial_balance=float(os.getenv("INITIAL_BALANCE_USD", "10000")),
        position_size_usd=float(os.getenv("POSITION_SIZE_USD", "100")),
        symbol=os.getenv("SYMBOL", "BTC-USD"),
        fast_ma=int(os.getenv("FAST_MA", "5")),
        slow_ma=int(os.getenv("SLOW_MA", "15")),
    )


def sma(values: List[float], period: int) -> Optional[float]:
    if len(values) < period:
        return None
    return sum(values[-period:]) / period


def sim_price_walk(steps: int, start: float = 43_000.0) -> List[Candle]:
    """Toy prices for demo only — not realistic market dynamics."""
    out: List[Candle] = []
    p = start
    for i in range(steps):
        drift = (i % 17 - 8) * 12
        p = max(1000.0, p + drift)
        o, c = p - 5, p + 5
        hi, lo = max(o, c) + 3, min(o, c) - 3
        ts = i * 60_000
        out.append(Candle(ts=ts, open=o, high=hi, low=lo, close=c))
    return out


def load_csv_candles(path: str) -> List[Candle]:
    p = Path(path)
    if not p.is_file():
        raise FileNotFoundError(f"CSV not found: {path}")
    rows: List[Candle] = []
    with p.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(
                Candle(
                    ts=int(r["time"]),
                    open=float(r["open"]),
                    high=float(r["high"]),
                    low=float(r["low"]),
                    close=float(r["close"]),
                    volume=float(r.get("volume") or 0),
                )
            )
    return rows


def execute_paper_order(
    *,
    side: str,
    price: float,
    portfolio: Portfolio,
    cfg: BotConfig,
    log: List[str],
) -> None:
    """Simulate instant fill at `close` — replace with exchange client later."""
    if side == "BUY" and portfolio.position_units <= 0:
        units = cfg.position_size_usd / price
        cost = units * price
        if cost > portfolio.cash_usd:
            log.append("SKIP BUY: insufficient cash")
            return
        portfolio.cash_usd -= cost
        portfolio.position_units = units
        portfolio.avg_entry = price
        log.append(f"BUY {units:.6f} {cfg.symbol} @ {price:.2f}")
    elif side == "SELL" and portfolio.position_units > 0:
        proceeds = portfolio.position_units * price
        portfolio.cash_usd += proceeds
        log.append(f"SELL {portfolio.position_units:.6f} {cfg.symbol} @ {price:.2f}")
        portfolio.position_units = 0.0
        portfolio.avg_entry = 0.0


def run_crossover(candles: Iterable[Candle], cfg: BotConfig) -> None:
    closes: List[float] = []
    portfolio = Portfolio(cash_usd=cfg.initial_balance)
    log: List[str] = []
    prev_fast: Optional[float] = None
    prev_slow: Optional[float] = None

    for c in candles:
        closes.append(c.close)
        fast = sma(closes, cfg.fast_ma)
        slow = sma(closes, cfg.slow_ma)
        if fast is None or slow is None:
            continue

        if prev_fast is not None and prev_slow is not None:
            cross_up = prev_fast <= prev_slow and fast > slow
            cross_down = prev_fast >= prev_slow and fast < slow
            if cross_up:
                execute_paper_order(
                    side="BUY", price=c.close, portfolio=portfolio, cfg=cfg, log=log
                )
            elif cross_down:
                execute_paper_order(
                    side="SELL", price=c.close, portfolio=portfolio, cfg=cfg, log=log
                )

        prev_fast, prev_slow = fast, slow

    final_price = closes[-1] if closes else 0.0
    equity = portfolio.cash_usd + portfolio.position_units * final_price
    stamp = datetime.now(timezone.utc).isoformat()
    print(f"[{stamp}] Symbol={cfg.symbol} Final equity USD={equity:.2f}")
    for line in log[-40:]:
        print(line)
    if len(log) > 40:
        print(f"... ({len(log) - 40} more lines truncated)")


def main() -> None:
    cfg = load_config()
    if cfg.slow_ma <= cfg.fast_ma:
        raise SystemExit("SLOW_MA must be greater than FAST_MA")

    if cfg.mode == "CSV":
        if not cfg.csv_path:
            raise SystemExit("MODE=CSV requires CSV_PATH")
        candles = load_csv_candles(cfg.csv_path)
    else:
        candles = sim_price_walk(120)

    run_crossover(candles, cfg)


if __name__ == "__main__":
    main()
