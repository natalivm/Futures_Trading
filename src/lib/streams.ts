export type Timeframe = '5m' | '60m';

export interface Stream {
  id: string;
  tab: string;
  label: string;
  detail: string;
  timeframe: Timeframe;
  streamId: string;
}

export const streams: Stream[] = [
  {
    id: 'v4h',
    tab: '4H · 5m',
    label: 'Day trading · ~4 hours',
    detail: '5-minute candles · ~1s delay',
    timeframe: '5m',
    streamId: 'pAahSmsxftlXlCeZ1706326282437',
  },
  {
    id: 'v1d',
    tab: '1D · 5m',
    label: 'Day trading · ~1 day',
    detail: '5-minute candles · ~1s delay',
    timeframe: '5m',
    streamId: 'ffICLRmcJ5y0aRpF1706326240415',
  },
  {
    id: 'v1w',
    tab: '1W · 60m',
    label: 'Context · ~1 week',
    detail: '60-minute candles · latency unspecified',
    timeframe: '60m',
    streamId: 'F1i9kZJQrsVPoLMM1705009549772',
  },
];

export function streamURL(streamId: string) {
  return `https://hwsrv-1123847.hostwindsdns.com:5443/WebRTCAppEE/play.html?id=${streamId}`;
}
