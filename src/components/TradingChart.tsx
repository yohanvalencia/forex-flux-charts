import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, CandlestickData, ColorType, CandlestickSeries } from 'lightweight-charts';

interface TradingChartProps {
  timeframe: string;
  apiEndpoint?: string;
  wsEndpoint?: string;
}

export const TradingChart = ({ timeframe, apiEndpoint, wsEndpoint }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

    const ws = new WebSocket(`${wsEndpoint}?timeframe=${timeframe}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        const candleData: CandlestickData = {
          time: update.time,
          open: update.open,
          high: update.high,
          low: update.low,
          close: update.close,
        };
        seriesRef.current?.update(candleData);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
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
  }, [timeframe, wsEndpoint]);

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
