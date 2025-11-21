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
- **Location**: `src/components/TradingChart.tsx:139-145`
- **Solution**: Built WebSocket URL with query parameters using URLSearchParams

```typescript
// URL builder with multiple parameters
const params = new URLSearchParams();
if (currencyPair) params.append('currency_pair', currencyPair);
if (tenorLabel) params.append('tenor', tenorLabel);

const wsUrl = params.toString()
  ? `${wsEndpoint}?${params.toString()}`
  : wsEndpoint;

// Example: ws://127.0.0.1:8080?currency_pair=EURUSD&tenor=SPOT
```

### 5. Tenor Selector Value Mismatch
- **Problem**: TenorSelector uses numeric values (0, 1, 2...) but WebSocket expects string labels (SPOT, D1, W1...)
- **Initial State**: Default tenor set to 'SPOT' but selector expects '0'
- **Symptom**: Tenor selector appeared blank on initial load
- **Location**: `src/pages/Index.tsx:13`
- **Solution**:
  - Changed default state to '0' (numeric)
  - Created TENOR_LABELS mapping object to convert numeric to string
  - Pass converted label to TradingChart via tenorLabel prop

```typescript
// Mapping in Index.tsx
const TENOR_LABELS: { [key: string]: string } = {
  '0': 'SPOT', '1': 'D1', '2': 'W1', '3': 'W2', '4': 'W3',
  '5': 'M1', '6': 'M2', '7': 'M3', ...
};

// Default state
const [tenor, setTenor] = useState('0'); // '0' = SPOT

// Conversion when passing to TradingChart
tenorLabel={TENOR_LABELS[tenor]}
```

## File Structure & Key Components

```
forex-flux-charts/
├── vite.config.ts                # Port configuration (5173)
├── CLAUDE.md                     # This file - project documentation
├── src/
│   ├── types/
│   │   └── websocket.ts          # WebSocket message type definitions
│   ├── components/
│   │   ├── TradingChart.tsx      # Main chart component (handles WebSocket)
│   │   ├── ChartHeader.tsx       # Header with pair/price display
│   │   ├── CurrencyPairSelector.tsx  # Dropdown for pair selection
│   │   ├── TenorSelector.tsx     # Dropdown for tenor selection (SPOT, D1, W1, etc.)
│   │   ├── PriceTypeSelector.tsx     # Bid/Mid/Ask toggle
│   │   └── TimeframeSelector.tsx     # Timeframe selection
│   └── pages/
│       └── Index.tsx             # Main page orchestrating all components
```

## Critical Code Locations

### 1. WebSocket Connection
**File**: `src/components/TradingChart.tsx:121-200`

Key operations:
- Clears chart data on pair/tenor change (line 129-136)
- Builds URL with query params using URLSearchParams (line 139-145)
- Connects with: `ws://127.0.0.1:8080?currency_pair=EURUSD&tenor=SPOT`
- Parses incoming messages (line 150-173)
- Converts milliseconds to seconds (line 156)
- Extracts OHLC based on priceType (line 162)
- Stores complete candle data (line 159)
- Dependency array includes tenorLabel for reconnection (line 200)

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

### 3. Tenor Conversion Mechanism
**File**: `src/pages/Index.tsx:19-27`

**IMPORTANT**: The TenorSelector component uses numeric values internally (0, 1, 2...) but the WebSocket requires string labels (SPOT, D1, W1...).

The conversion happens in Index.tsx:
```typescript
// State uses numeric value
const [tenor, setTenor] = useState('0'); // '0' = SPOT

// Mapping object converts numeric to label
const TENOR_LABELS: { [key: string]: string } = {
  '0': 'SPOT', '1': 'D1', '2': 'W1', '3': 'W2', '4': 'W3',
  '5': 'M1', '6': 'M2', '7': 'M3', '8': 'M4', '9': 'M5',
  '10': 'M6', '11': 'M7', '12': 'M8', '13': 'M9', '14': 'M10',
  '15': 'M11', '16': 'M12', '17': 'M15', '18': 'M18',
  '19': 'Y1', '20': 'Y2', '21': 'Y3', '22': 'Y4', '23': 'Y5',
  '24': 'Y6', '25': 'Y7', '26': 'Y8', '27': 'Y9', '28': 'Y10',
};

// Conversion when passing to TradingChart
<TradingChart tenorLabel={TENOR_LABELS[tenor]} />
```

**Why this approach?**
- UI component (TenorSelector) uses numeric values for internal state management
- Backend WebSocket expects string labels for the API
- Index.tsx acts as the translation layer between UI and API

### 4. Currency Pair Management
**File**: `src/pages/Index.tsx:10-12`

Two separate states:
- `selectedCurrencyPair`: What user selects from dropdown
- `displayCurrencyPair`: What WebSocket actually sends back

This separation allows validation that WebSocket is sending correct data.

### 5. Port Configuration
**File**: `vite.config.ts:10`

```typescript
server: {
  host: "::",
  port: 5173,  // Changed from 8080 to avoid WebSocket conflict
}
```

### 6. Price Type Switching
**File**: `src/components/TradingChart.tsx:202-220`

Effect that updates chart when price type changes:
- Doesn't reconnect WebSocket
- Uses stored candle data
- Instant switching between bid/mid/ask

### 7. TenorSelector Component
**File**: `src/components/TenorSelector.tsx`

Contains all 29 tenor values with numeric keys:
- '0' = SPOT
- '1' = D1 (1 day)
- '2'-'4' = W1-W3 (weeks)
- '5'-'16' = M1-M12 (months)
- '17'-'18' = M15, M18 (15, 18 months)
- '19'-'28' = Y1-Y10 (years)

Uses shadcn/ui Select component with scrollable dropdown.

## Current Features

- ✅ Real-time WebSocket candlestick updates
- ✅ Currency pair selection (EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, NZDUSD, USDCHF)
- ✅ Tenor selection (29 options: SPOT, D1, W1-W3, M1-M12, M15, M18, Y1-Y10)
- ✅ Bid/Mid/Ask price type switching
- ✅ Timeframe selection (1M, 5M, 15M, 1D)
- ✅ Auto-reconnection on currency pair or tenor change
- ✅ Chart data clearing on pair/tenor switch
- ✅ Dynamic currency pair display from WebSocket data
- ✅ Stores all candle data for instant price type switching
- ✅ Numeric-to-label conversion for tenor values (UI uses numbers, API uses strings)

## WebSocket Integration Details

### Connection URL Format
```
ws://127.0.0.1:8080?currency_pair=EURUSD&tenor=SPOT
```

**Query Parameters:**
- `currency_pair`: Currency pair code (e.g., EURUSD, GBPUSD)
- `tenor`: Tenor string label (e.g., SPOT, D1, W1, M1, Y1)

**Examples:**
```
ws://127.0.0.1:8080?currency_pair=EURUSD&tenor=SPOT
ws://127.0.0.1:8080?currency_pair=GBPUSD&tenor=D1
ws://127.0.0.1:8080?currency_pair=USDJPY&tenor=M3
ws://127.0.0.1:8080?currency_pair=AUDUSD&tenor=Y1
```

### Expected Message Format
- **Frequency**: Real-time as candles complete
- **Timestamp**: Milliseconds (will be converted to seconds)
- **Price Data**: Separate bid/ask/mid OHLC objects

### Connection Behavior
1. User selects currency pair and tenor from dropdowns
2. Index.tsx converts tenor numeric value to string label via TENOR_LABELS
3. Component builds WebSocket URL with both query parameters
4. Clears existing chart data
5. Connects to WebSocket
6. Receives messages and updates chart in real-time
7. Currency pair in header updates from received data

### Reconnection Triggers
- Currency pair change
- Tenor change
- WebSocket error/disconnect
- Component remount

## Common Issues & Troubleshooting

### Chart Not Showing Data
1. Check WebSocket is running on port 8080
2. Verify WebSocket URL format includes both query parameters: `?currency_pair=EURUSD&tenor=SPOT`
3. Check browser console for connection errors
4. Verify message format matches expected structure
5. Ensure WebSocket server accepts and uses tenor parameter

### Tenor Selector Showing Blank
- **Cause**: Default tenor value doesn't match TenorSelector options
- **Fix**: Ensure default state is `'0'` not `'SPOT'` in Index.tsx
- **Location**: `src/pages/Index.tsx:13`
- **Correct**: `const [tenor, setTenor] = useState('0');`

### WebSocket Receiving Wrong Tenor Value
- **Symptom**: WebSocket receives numeric value (0, 1, 2) instead of label (SPOT, D1, W1)
- **Cause**: Not passing `tenorLabel` prop or TENOR_LABELS mapping missing
- **Fix**: Ensure `tenorLabel={TENOR_LABELS[tenor]}` is passed to TradingChart
- **Location**: `src/pages/Index.tsx:73`

### Port Already in Use
- Vite runs on port 5173 (not 8080)
- WebSocket should run on port 8080
- If conflict, update `vite.config.ts` or WebSocket server port

### Wrong Currency Pair Displayed
- Check "Selected Pair" vs "Receiving Data" in configuration panel
- WebSocket may be sending different pair than requested
- Verify query parameters are being sent correctly

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
- Save user preferences (pair, timeframe, price type, tenor) to localStorage
- Multiple chart layouts
- Alert/notification system
- Custom tenor input for non-standard values
- Chart comparison (multiple pairs on same chart)
- Export chart data to CSV/JSON

## Important Implementation Notes for Future Development

### 1. Adding New Query Parameters
When adding new WebSocket query parameters, follow this pattern:
```typescript
// In TradingChart.tsx
const params = new URLSearchParams();
if (currencyPair) params.append('currency_pair', currencyPair);
if (tenorLabel) params.append('tenor', tenorLabel);
if (newParam) params.append('new_param', newParam); // Add here

const wsUrl = params.toString()
  ? `${wsEndpoint}?${params.toString()}`
  : wsEndpoint;
```

### 2. Numeric-to-String Conversions
If adding new selectors that need value conversion:
- Store numeric values in component state for UI
- Create mapping object (like TENOR_LABELS)
- Convert in Index.tsx before passing to TradingChart
- Pass converted label as separate prop

### 3. WebSocket Reconnection
Current reconnection triggers:
- `currencyPair` change
- `tenorLabel` change
- `priceType` change (but doesn't trigger reconnection, only data refresh)

Add new triggers to dependency array in `TradingChart.tsx:200`

### 4. Chart Data Management
- All incoming candle data is stored in `candleDataRef` Map
- Key = timestamp in seconds
- Value = complete WebSocketCandleMessage
- This allows switching price types without reconnecting
- Clear data when currency pair or tenor changes to avoid mixing data

### 5. Type Safety
When adding new features:
- Update `WebSocketCandleMessage` interface in `src/types/websocket.ts`
- Update `TradingChartProps` interface if adding new props
- Ensure TypeScript checks pass before committing

### 6. State Management Pattern
Current pattern in Index.tsx:
```typescript
// UI state (what user selected)
const [selectedValue, setSelectedValue] = useState('default');

// Display state (what WebSocket sent back)
const [displayValue, setDisplayValue] = useState('default');
```

This dual-state pattern allows validation and debugging.
