# Forex Flux Charts - Project Summary

## Project Overview

A real-time forex trading chart application built with:
- **Frontend**: React + TypeScript + Vite
- **UI Framework**: shadcn/ui components
- **Charting Library**: lightweight-charts (TradingView-style)
- **Real-time Data**: WebSocket connection to `ws://127.0.0.1:8080`

## Initial Challenges & Failures

### 1. Port Conflict (First Major Issue)
- **Problem**: Vite dev server was configured to run on port 8080
- **Conflict**: WebSocket server also runs on 127.0.0.1:8080
- **Location**: `vite.config.ts:10`
- **Solution**: Changed Vite port from 8080 to 5173
- **Fix Applied**: Updated `vite.config.ts` server.port configuration

```typescript
// Before
server: {
  host: "::",
  port: 8080,  // ❌ Conflicts with WebSocket
}

// After
server: {
  host: "::",
  port: 5173,  // ✅ No conflict
}
```

### 2. WebSocket Message Format Mismatch
- **Problem**: Existing chart expected simple OHLC format, but WebSocket sends complex structure
- **Expected Format**: `{time, open, high, low, close}`
- **Actual Format**:
  ```json
  {
    "id": "8f305a1b-6dbb-4552-ad42-143e842efd99",
    "pair": {"base": 109, "quote": 151},
    "currency_pair": "NZDUSD",
    "interval": 1,
    "start": 1763743783000,
    "tenor": 17,
    "ask": {
      "open": 0.5905948308662027,
      "high": 0.5913033779105665,
      "low": 0.5887185581111677,
      "close": 0.5891547663432032
    },
    "bid": {
      "open": 0.5902713104644645,
      "high": 0.5909798575088283,
      "low": 0.5883950377094295,
      "close": 0.588831245941465
    },
    "mid": {
      "open": 0.5904330706653336,
      "high": 0.5911416177096974,
      "low": 0.5885567979102986,
      "close": 0.5889930061423341
    }
  }
  ```
- **Location**: `src/components/TradingChart.tsx:132-158`
- **Solution**: Created parser to extract OHLC from bid/ask/mid and convert timestamps

```typescript
// Parser implementation
const message: WebSocketCandleMessage = JSON.parse(event.data);
const ohlc = message[priceType]; // Extract based on bid/ask/mid
const candleData: CandlestickData = {
  time: timeInSeconds as any,
  open: ohlc.open,
  high: ohlc.high,
  low: ohlc.low,
  close: ohlc.close,
};
```

### 3. Timestamp Format Issue
- **Problem**: WebSocket sends timestamps in milliseconds, lightweight-charts needs seconds
- **Location**: `src/components/TradingChart.tsx:142`
- **Error Would Occur**: Chart wouldn't display or would show incorrect time axis
- **Solution**: Convert milliseconds to seconds

```typescript
// Conversion
const timeInSeconds = Math.floor(message.start / 1000);
```

### 4. Missing Currency Pair Query Parameter
- **Problem**: No way to specify which currency pair to request from WebSocket
- **Initial State**: WebSocket connected to bare URL `ws://127.0.0.1:8080`
- **Required**: Need to specify which pair to receive
- **Location**: `src/components/TradingChart.tsx:135-137`
- **Solution**: Built WebSocket URL with query parameter

```typescript
// URL builder
const wsUrl = currencyPair
  ? `${wsEndpoint}?currency_pair=${currencyPair}`
  : wsEndpoint;

// Example: ws://127.0.0.1:8080?currency_pair=EURUSD
```

## File Structure & Key Components

```
forex-flux-charts/
├── vite.config.ts                # Port configuration (5173)
├── src/
│   ├── types/
│   │   └── websocket.ts          # WebSocket message type definitions
│   ├── components/
│   │   ├── TradingChart.tsx      # Main chart component (handles WebSocket)
│   │   ├── ChartHeader.tsx       # Header with pair/price display
│   │   ├── CurrencyPairSelector.tsx  # Dropdown for pair selection
│   │   ├── PriceTypeSelector.tsx     # Bid/Mid/Ask toggle
│   │   └── TimeframeSelector.tsx     # Timeframe selection
│   └── pages/
│       └── Index.tsx             # Main page orchestrating all components
```

## Critical Code Locations

### 1. WebSocket Connection
**File**: `src/components/TradingChart.tsx:121-192`

Key operations:
- Builds URL with currency_pair query param (line 135-137)
- Clears chart data on pair change (line 129-132)
- Parses incoming messages (line 132-158)
- Converts milliseconds to seconds (line 142)
- Extracts OHLC based on priceType (line 148)
- Stores complete candle data (line 145)

### 2. Type Definitions
**File**: `src/types/websocket.ts`

```typescript
export interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface WebSocketCandleMessage {
  id: string;
  pair: { base: number; quote: number };
  currency_pair: string;
  interval: number;
  start: number; // timestamp in milliseconds
  tenor: number;
  ask: OHLCData;
  bid: OHLCData;
  mid: OHLCData;
}

export type PriceType = 'bid' | 'ask' | 'mid';
```

### 3. Currency Pair Management
**File**: `src/pages/Index.tsx:10-11`

Two separate states:
- `selectedCurrencyPair`: What user selects from dropdown
- `displayCurrencyPair`: What WebSocket actually sends back

This separation allows validation that WebSocket is sending correct data.

### 4. Port Configuration
**File**: `vite.config.ts:10`

```typescript
server: {
  host: "::",
  port: 5173,  // Changed from 8080 to avoid WebSocket conflict
}
```

### 5. Price Type Switching
**File**: `src/components/TradingChart.tsx:182-200`

Effect that updates chart when price type changes:
- Doesn't reconnect WebSocket
- Uses stored candle data
- Instant switching between bid/mid/ask

## Current Features

- ✅ Real-time WebSocket candlestick updates
- ✅ Currency pair selection (EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, NZDUSD, USDCHF)
- ✅ Bid/Mid/Ask price type switching
- ✅ Timeframe selection (1M, 5M, 15M, 1D)
- ✅ Auto-reconnection on currency pair change
- ✅ Chart data clearing on pair switch
- ✅ Dynamic currency pair display from WebSocket data
- ✅ Stores all candle data for instant price type switching

## WebSocket Integration Details

### Connection URL Format
```
ws://127.0.0.1:8080?currency_pair=EURUSD
```

### Expected Message Format
- **Frequency**: Real-time as candles complete
- **Timestamp**: Milliseconds (will be converted to seconds)
- **Price Data**: Separate bid/ask/mid OHLC objects

### Connection Behavior
1. User selects currency pair from dropdown
2. Component builds WebSocket URL with query parameter
3. Clears existing chart data
4. Connects to WebSocket
5. Receives messages and updates chart in real-time
6. Currency pair in header updates from received data

### Reconnection Triggers
- Currency pair change
- WebSocket error/disconnect
- Component remount

## Common Issues & Troubleshooting

### Chart Not Showing Data
1. Check WebSocket is running on port 8080
2. Verify WebSocket URL format includes `?currency_pair=XXX`
3. Check browser console for connection errors
4. Verify message format matches expected structure

### Port Already in Use
- Vite runs on port 5173 (not 8080)
- WebSocket should run on port 8080
- If conflict, update `vite.config.ts` or WebSocket server port

### Wrong Currency Pair Displayed
- Check "Selected Pair" vs "Receiving Data" in configuration panel
- WebSocket may be sending different pair than requested
- Verify query parameter is being sent correctly

## Development Commands

```bash
# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Technical Stack Details

- **React**: 18.3.1
- **TypeScript**: 5.8.3
- **Vite**: 5.4.19
- **lightweight-charts**: 5.0.9
- **shadcn/ui**: Various Radix UI components
- **Tailwind CSS**: 3.4.17

## Future Enhancements

Potential improvements:
- Add historical data loading on connection
- Implement reconnection with exponential backoff
- Add volume data display
- Support for more indicators
- Save user preferences (pair, timeframe, price type)
- Multiple chart layouts
- Alert/notification system
