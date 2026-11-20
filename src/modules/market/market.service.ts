import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';

export interface TickerItem {
  symbol: string;
  name: string;
  type: 'crypto' | 'fiat';
  /** Preço de 1 unidade em BRL */
  priceBrl: number;
  /** Variação percentual em 24h (só disponível para cripto) */
  change24h: number | null;
}

const COINGECKO = 'https://api.coingecko.com/api/v3';

const CRYPTOS: { id: string; symbol: string; name: string }[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'tether', symbol: 'USDT', name: 'Tether' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'tron', symbol: 'TRX', name: 'TRON' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
];

// Códigos conforme o endpoint /exchange_rates da CoinGecko
const FIATS: { code: string; symbol: string; name: string }[] = [
  { code: 'usd', symbol: 'USD', name: 'Dólar americano' },
  { code: 'eur', symbol: 'EUR', name: 'Euro' },
  { code: 'gbp', symbol: 'GBP', name: 'Libra esterlina' },
  { code: 'jpy', symbol: 'JPY', name: 'Iene japonês' },
  { code: 'chf', symbol: 'CHF', name: 'Franco suíço' },
  { code: 'cad', symbol: 'CAD', name: 'Dólar canadense' },
  { code: 'aud', symbol: 'AUD', name: 'Dólar australiano' },
  { code: 'cny', symbol: 'CNY', name: 'Yuan chinês' },
  { code: 'ars', symbol: 'ARS', name: 'Peso argentino' },
  { code: 'mxn', symbol: 'MXN', name: 'Peso mexicano' },
  { code: 'clp', symbol: 'CLP', name: 'Peso chileno' },
  { code: 'inr', symbol: 'INR', name: 'Rúpia indiana' },
];

/** Por quanto tempo reaproveitar a última resposta da CoinGecko */
const CACHE_TTL_MS = 60_000;

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  private cache: { data: TickerItem[]; fetchedAt: number } | null = null;
  private inFlight: Promise<TickerItem[]> | null = null;

  async getTicker(): Promise<TickerItem[]> {
    if (this.cache && Date.now() - this.cache.fetchedAt < CACHE_TTL_MS) {
      return this.cache.data;
    }

    // Evita várias chamadas simultâneas à CoinGecko quando o cache expira
    this.inFlight ??= this.fetchTicker().finally(() => {
      this.inFlight = null;
    });

    try {
      const data = await this.inFlight;
      this.cache = { data, fetchedAt: Date.now() };
      return data;
    } catch (error) {
      this.logger.warn(`Falha ao atualizar cotações: ${(error as Error).message}`);
      // Se a CoinGecko falhar (ex.: limite de requisições), devolve o último valor conhecido
      if (this.cache) return this.cache.data;
      throw new ServiceUnavailableException('Cotações indisponíveis no momento');
    }
  }

  private async fetchTicker(): Promise<TickerItem[]> {
    const [pricesRes, ratesRes] = await Promise.all([
      axios.get(`${COINGECKO}/simple/price`, {
        params: {
          ids: CRYPTOS.map((c) => c.id).join(','),
          vs_currencies: 'brl',
          include_24hr_change: true,
        },
        timeout: 10_000,
      }),
      axios.get(`${COINGECKO}/exchange_rates`, { timeout: 10_000 }),
    ]);

    const cryptos: TickerItem[] = CRYPTOS.flatMap((c) => {
      const entry = pricesRes.data?.[c.id];
      if (typeof entry?.brl !== 'number') return [];
      return [
        {
          symbol: c.symbol,
          name: c.name,
          type: 'crypto' as const,
          priceBrl: entry.brl,
          change24h: typeof entry.brl_24h_change === 'number' ? entry.brl_24h_change : null,
        },
      ];
    });

    // exchange_rates traz quanto 1 BTC vale em cada moeda.
    // 1 unidade da moeda X em BRL = (BRL por BTC) / (X por BTC)
    const rates = ratesRes.data?.rates ?? {};
    const brlPerBtc = rates.brl?.value;

    const fiats: TickerItem[] =
      typeof brlPerBtc === 'number'
        ? FIATS.flatMap((f) => {
            const perBtc = rates[f.code]?.value;
            if (typeof perBtc !== 'number' || perBtc === 0) return [];
            return [
              {
                symbol: f.symbol,
                name: f.name,
                type: 'fiat' as const,
                priceBrl: brlPerBtc / perBtc,
                change24h: null,
              },
            ];
          })
        : [];

    if (cryptos.length === 0 && fiats.length === 0) {
      throw new Error('Resposta vazia da CoinGecko');
    }

    // Intercala moedas e criptos para o letreiro ficar variado
    const mixed: TickerItem[] = [];
    for (let i = 0; i < Math.max(cryptos.length, fiats.length); i++) {
      if (fiats[i]) mixed.push(fiats[i]);
      if (cryptos[i]) mixed.push(cryptos[i]);
    }
    return mixed;
  }
}
