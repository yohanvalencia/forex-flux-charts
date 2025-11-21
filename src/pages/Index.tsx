import { useState } from 'react';
import { TradingChart } from '@/components/TradingChart';
import { ChartHeader } from '@/components/ChartHeader';
import { CurrencyPairSelector } from '@/components/CurrencyPairSelector';
import { TenorSelector } from '@/components/TenorSelector';
import { PriceType } from '@/types/websocket';

const Index = () => {
  const [timeframe, setTimeframe] = useState('1M');
  const [priceType, setPriceType] = useState<PriceType>('mid');
  const [selectedCurrencyPair, setSelectedCurrencyPair] = useState('EURUSD');
  const [displayCurrencyPair, setDisplayCurrencyPair] = useState('EURUSD');
  const [tenor, setTenor] = useState('0'); // '0' = SPOT

  // Replace these with your actual endpoints
  const API_ENDPOINT = undefined; // e.g., 'https://your-api.com/historical'
  const WS_ENDPOINT = 'ws://127.0.0.1:8080';

  // Tenor mapping for display
  const TENOR_LABELS: { [key: string]: string } = {
    '0': 'SPOT', '1': 'D1', '2': 'W1', '3': 'W2', '4': 'W3',
    '5': 'M1', '6': 'M2', '7': 'M3', '8': 'M4', '9': 'M5',
    '10': 'M6', '11': 'M7', '12': 'M8', '13': 'M9', '14': 'M10',
    '15': 'M11', '16': 'M12', '17': 'M15', '18': 'M18',
    '19': 'Y1', '20': 'Y2', '21': 'Y3', '22': 'Y4', '23': 'Y5',
    '24': 'Y6', '25': 'Y7', '26': 'Y8', '27': 'Y9', '28': 'Y10',
  };

  // Format currency pair for display (EURUSD -> EUR/USD)
  const formatCurrencyPair = (pair: string) => {
    if (pair.length === 6) {
      return `${pair.slice(0, 3)}/${pair.slice(3)}`;
    }
    return pair;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto">
        <ChartHeader
          symbol={formatCurrencyPair(displayCurrencyPair)}
          price="1.0850"
          change="+0.0023 (+0.21%)"
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          priceType={priceType}
          onPriceTypeChange={setPriceType}
        />
        <div className="p-6">
          <div className="mb-4 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-foreground">Currency Pair:</label>
              <CurrencyPairSelector
                value={selectedCurrencyPair}
                onChange={setSelectedCurrencyPair}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-foreground">Tenor:</label>
              <TenorSelector
                value={tenor}
                onChange={setTenor}
              />
            </div>
          </div>
          <div className="bg-card rounded-lg shadow-2xl overflow-hidden">
            <TradingChart
              timeframe={timeframe}
              apiEndpoint={API_ENDPOINT}
              wsEndpoint={WS_ENDPOINT}
              priceType={priceType}
              currencyPair={selectedCurrencyPair}
              tenorLabel={TENOR_LABELS[tenor]}
              onCurrencyPairUpdate={setDisplayCurrencyPair}
            />
          </div>
          <div className="mt-6 p-4 bg-card rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Connected to WebSocket. The chart will update automatically with real-time candlestick data.
            </p>
            <div className="mt-3 space-y-2 text-sm font-mono">
              <div className="text-chart-text">
                <span className="text-primary">WebSocket URL:</span> {WS_ENDPOINT}?currency_pair={selectedCurrencyPair}&tenor={TENOR_LABELS[tenor]}
              </div>
              <div className="text-chart-text">
                <span className="text-primary">Selected Pair:</span> {selectedCurrencyPair}
              </div>
              <div className="text-chart-text">
                <span className="text-primary">Receiving Data:</span> {formatCurrencyPair(displayCurrencyPair)}
              </div>
              <div className="text-chart-text">
                <span className="text-primary">Tenor:</span> {TENOR_LABELS[tenor] || tenor}
              </div>
              <div className="text-chart-text">
                <span className="text-primary">Price Type:</span> {priceType.toUpperCase()}
              </div>
              <div className="text-chart-text">
                <span className="text-primary">Timeframe:</span> {timeframe}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
