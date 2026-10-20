# Matrix BTM — TradingView indicator

`matrix_btm.pine` is a Pine Script v6 approximation of the Matrixchannel chart for TradingView. It is not the original code.

To use it: open the Pine editor, clear it, paste the whole file, then Save and Add to chart.

- **Cloud** — Auto profile: 9 / 26 / 52, +5 bars on 15m and below; 9 / 80 / 160, +3 bars on 30m and above. The hourly numbers were read off the original 1h @ES chart and checked against it (flat Span B and Kijun in the same places).
- **Moving average** (yellow dashed) — 22 EMA on 15m and below, 55 SMA on 30m and above.
- **Settings** — only the main choices are inputs. Every tuning number is fixed under "Fixed settings" near the top of the script, at its previous default.
