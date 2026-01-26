'use client';

import { useState } from 'react';

export function BtcSatsConverter() {
  const [btcInput, setBtcInput] = useState<string>('');
  const [satsInput, setSatsInput] = useState<string>('');

  // Format number with commas
  const formatWithCommas = (value: string): string => {
    // Remove all non-digit characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    
    // Split by decimal point
    const parts = cleaned.split('.');
    
    // Format the integer part with commas
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    // Rejoin with decimal point if there was one
    return parts.length > 1 ? parts.join('.') : parts[0];
  };

  // Parse number removing commas
  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(/,/g, ''));
  };

  const handleBtcChange = (value: string) => {
    // Format with commas as user types
    const formatted = formatWithCommas(value);
    setBtcInput(formatted);
    
    if (value === '' || value === '.') {
      setSatsInput('');
      return;
    }
    
    const btc = parseNumber(value);
    if (!isNaN(btc) && btc >= 0) {
      const sats = Math.round(btc * 100000000);
      setSatsInput(sats.toLocaleString());
    } else {
      setSatsInput('');
    }
  };

  const handleSatsChange = (value: string) => {
    // Format with commas as user types
    const formatted = formatWithCommas(value);
    setSatsInput(formatted);
    
    if (value === '') {
      setBtcInput('');
      return;
    }
    
    // Remove commas for parsing
    const sats = parseInt(value.replace(/,/g, ''), 10);
    if (!isNaN(sats) && sats >= 0) {
      const btc = sats / 100000000;
      // Format BTC to show up to 8 decimal places, then format with commas
      const btcValue = btc.toFixed(8).replace(/\.?0+$/, '');
      // Format the integer part with commas if it's a large number
      const btcParts = btcValue.split('.');
      if (btcParts[0]) {
        btcParts[0] = btcParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
      setBtcInput(btcParts.join('.'));
    } else {
      setBtcInput('');
    }
  };

  const clearInputs = () => {
    setBtcInput('');
    setSatsInput('');
  };

  return (
    <div className="mt-6 rounded-lg border border-cyan-400/25 bg-zinc-950/70 p-6 shadow-inner">
      <h4 className="mb-4 text-base font-semibold text-cyan-200">Bitcoin ↔ Satoshi Converter</h4>
      <p className="mb-4 text-sm text-zinc-400">
        Convert between Bitcoin (BTC) and Satoshis (sats). Remember: 1 BTC = 100,000,000 sats
      </p>
      
      <div className="space-y-4">
        {/* BTC to Sats */}
        <div className="rounded-lg border border-cyan-400/20 bg-zinc-900/50 p-4">
          <label htmlFor="btc-input" className="block mb-2 text-sm font-medium text-cyan-300">
            Bitcoin (BTC) → Satoshis (sats)
          </label>
          <div className="flex gap-2">
            <input
              id="btc-input"
              type="text"
              inputMode="decimal"
              value={btcInput}
              onChange={(e) => handleBtcChange(e.target.value)}
              placeholder="Enter BTC amount"
              className="flex-1 rounded-md border border-cyan-400/30 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
            <span className="flex items-center px-3 text-sm font-mono text-cyan-300">BTC</span>
          </div>
          {satsInput && (
            <div className="mt-3 rounded-md bg-cyan-500/10 px-3 py-2">
              <p className="text-sm text-zinc-400">
                <span className="font-semibold text-cyan-300">Result:</span>{' '}
                <span className="font-mono text-cyan-200">{satsInput} sats</span>
              </p>
            </div>
          )}
        </div>

        {/* Sats to BTC */}
        <div className="rounded-lg border border-cyan-400/20 bg-zinc-900/50 p-4">
          <label htmlFor="sats-input" className="block mb-2 text-sm font-medium text-cyan-300">
            Satoshis (sats) → Bitcoin (BTC)
          </label>
          <div className="flex gap-2">
            <input
              id="sats-input"
              type="text"
              inputMode="numeric"
              value={satsInput}
              onChange={(e) => handleSatsChange(e.target.value)}
              placeholder="Enter sats amount"
              className="flex-1 rounded-md border border-cyan-400/30 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
            <span className="flex items-center px-3 text-sm font-mono text-cyan-300">sats</span>
          </div>
          {btcInput && (
            <div className="mt-3 rounded-md bg-cyan-500/10 px-3 py-2">
              <p className="text-sm text-zinc-400">
                <span className="font-semibold text-cyan-300">Result:</span>{' '}
                <span className="font-mono text-cyan-200">{btcInput} BTC</span>
              </p>
            </div>
          )}
        </div>

        {/* Clear Button */}
        {(btcInput || satsInput) && (
          <button
            onClick={clearInputs}
            className="w-full rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-zinc-200"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-4 rounded-md border border-cyan-400/20 bg-cyan-500/5 px-4 py-3">
        <p className="text-xs text-cyan-300">
          <span className="font-semibold">Formula:</span> 1 BTC = 100,000,000 sats
          <br />
          <span className="text-cyan-400">To convert BTC to sats:</span> Multiply by 100,000,000
          <br />
          <span className="text-cyan-400">To convert sats to BTC:</span> Divide by 100,000,000
        </p>
      </div>
    </div>
  );
}

