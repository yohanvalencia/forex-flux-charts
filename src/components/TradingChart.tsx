import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, CandlestickData, ColorType, CandlestickSeries } from 'lightweight-charts';
import { WebSocketCandleMessage, PriceType } from '@/types/websocket';

interface TradingChartProps {
  timeframe: string;
  apiEndpoint?: string;
  wsEndpoint?: string;
  priceType?: PriceType;
  currencyPair?: string;
  tenorLabel?: string;
  onCurrencyPairUpdate?: (pair: string) => void;
}

export const TradingChart = ({
  timeframe,
  apiEndpoint,
  wsEndpoint,
  priceType = 'mid',
  currencyPair,
  tenorLabel,
  onCurrencyPairUpdate
}: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const candleDataRef = useRef<Map<number, WebSocketCandleMessage>>(new Map());

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'hsl(216, 14%, 7%)' },
        textColor: 'hsl(215, 20.2%, 65.1%)',
      },
      grid: {
        vertLines: { color: 'hsl(217, 19%, 12%)' },
        horzLines: { color: 'hsl(217, 19%, 12%)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 600,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'hsl(217, 19%, 15%)',
      },
      rightPriceScale: {
        borderColor: 'hsl(217, 19%, 15%)',
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: 'hsl(134, 61%, 41%)',
      downColor: 'hsl(0, 72%, 51%)',
      borderVisible: false,
      wickUpColor: 'hsl(134, 61%, 41%)',
      wickDownColor: 'hsl(0, 72%, 51%)',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Fetch historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!apiEndpoint || !seriesRef.current) {
        // Mock data for demo
        setIsLoading(false);
        generateMockData();
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`${apiEndpoint}?timeframe=${timeframe}`);
        const data = await response.json();
        
        const formattedData: CandlestickData[] = data.map((candle: any) => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));

        seriesRef.current.setData(formattedData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching historical data:', error);
        setIsLoading(false);
        generateMockData();
      }
    };

    fetchHistoricalData();
  }, [timeframe, apiEndpoint]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!wsEndpoint || !seriesRef.current) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    // Clear stored candle data when currency pair changes
    candleDataRef.current.clear();
    if (seriesRef.current) {
      seriesRef.current.setData([]);
    }

    // Build WebSocket URL with query parameters
    const params = new URLSearchParams();
    if (currencyPair) params.append('currency_pair', currencyPair);
    if (tenorLabel) params.append('tenor', tenorLabel);

    const wsUrl = params.toString()
      ? `${wsEndpoint}?${params.toString()}`
      : wsEndpoint;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected to', wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketCandleMessage = JSON.parse(event.data);

        // Update currency pair if callback provided
        if (onCurrencyPairUpdate && message.currency_pair) {
          onCurrencyPairUpdate(message.currency_pair);
        }

        // Convert timestamp from milliseconds to seconds
        const timeInSeconds = Math.floor(message.start / 1000);

        // Store the complete message for potential price type switching
        candleDataRef.current.set(timeInSeconds, message);

        // Extract OHLC data based on selected price type
        const ohlc = message[priceType];

        const candleData: CandlestickData = {
          time: timeInSeconds as any,
          open: ohlc.open,
          high: ohlc.high,
          low: ohlc.low,
          close: ohlc.close,
        };

        seriesRef.current?.update(candleData);
      } catch (error) {
        console.error('Error processing WebSocket message:', error, event.data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsEndpoint, currencyPair, tenorLabel, priceType, onCurrencyPairUpdate]);

  // Update chart when price type changes
  useEffect(() => {
    if (!seriesRef.current || candleDataRef.current.size === 0) return;

    // Reload all stored candles with new price type
    const sortedCandles = Array.from(candleDataRef.current.entries())
      .sort(([timeA], [timeB]) => timeA - timeB)
      .map(([time, message]) => {
        const ohlc = message[priceType];
        return {
          time: time as any,
          open: ohlc.open,
          high: ohlc.high,
          low: ohlc.low,
          close: ohlc.close,
        };
      });

    seriesRef.current.setData(sortedCandles);
  }, [priceType]);

  // Generate mock data for demo
  const generateMockData = () => {
    if (!seriesRef.current) return;

    const data: CandlestickData[] = [];
    const now = Math.floor(Date.now() / 1000);
    const timeframeSeconds = getTimeframeSeconds(timeframe);
    let basePrice = 1.0850;

    for (let i = 100; i >= 0; i--) {
      const time = now - (i * timeframeSeconds);
      const open = basePrice;
      const close = basePrice + (Math.random() - 0.5) * 0.002;
      const high = Math.max(open, close) + Math.random() * 0.001;
      const low = Math.min(open, close) - Math.random() * 0.001;

      data.push({
        time: time as any,
        open,
        high,
        low,
        close,
      });

      basePrice = close;
    }

    seriesRef.current.setData(data);
  };

  const getTimeframeSeconds = (tf: string): number => {
    switch (tf) {
      case '1M': return 60;
      case '5M': return 300;
      case '15M': return 900;
      case '1D': return 86400;
      default: return 60;
    }
  };

  return (
    <div className="w-full">
      {isLoading && (
        <div className="absolute top-4 left-4 text-chart-text text-sm">
          Loading chart data...
        </div>
      )}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
};
