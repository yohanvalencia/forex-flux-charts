import { useState } from 'react';
import { TradingChart } from '@/components/TradingChart';
import { ChartHeader } from '@/components/ChartHeader';

const Index = () => {
  const [timeframe, setTimeframe] = useState('1M');

  // Replace these with your actual endpoints
  const API_ENDPOINT = undefined; // e.g., 'https://your-api.com/historical'
  const WS_ENDPOINT = undefined; // e.g., 'wss://your-api.com/realtime'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto">
        <ChartHeader
          symbol="EUR/USD"
          price="1.0850"
          change="+0.0023 (+0.21%)"
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />
        <div className="p-6">
          <div className="bg-card rounded-lg shadow-2xl overflow-hidden">
            <TradingChart
              timeframe={timeframe}
              apiEndpoint={API_ENDPOINT}
              wsEndpoint={WS_ENDPOINT}
            />
          </div>
          <div className="mt-6 p-4 bg-card rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Configuration</h3>
            <p className="text-sm text-muted-foreground">
              To connect real data, update the API_ENDPOINT and WS_ENDPOINT variables in Index.tsx with your endpoints.
            </p>
            <div className="mt-3 space-y-2 text-sm font-mono">
              <div className="text-chart-text">
                <span className="text-primary">API:</span> {API_ENDPOINT || 'Using mock data'}
              </div>
              <div className="text-chart-text">
                <span className="text-primary">WebSocket:</span> {WS_ENDPOINT || 'Not connected'}
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
