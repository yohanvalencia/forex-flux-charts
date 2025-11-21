export interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface WebSocketCandleMessage {
  id: string;
  pair: {
    base: number;
    quote: number;
  };
  currency_pair: string;
  interval: number;
  start: number; // timestamp in milliseconds
  tenor: number;
  ask: OHLCData;
  bid: OHLCData;
  mid: OHLCData;
}

export type PriceType = 'bid' | 'ask' | 'mid';
