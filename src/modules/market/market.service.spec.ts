import axios from 'axios';
import { ServiceUnavailableException } from '@nestjs/common';
import { MarketService } from './market.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function mockCoinGecko() {
  mockedAxios.get.mockImplementation((url: string) => {
    if (url.endsWith('/simple/price')) {
      return Promise.resolve({
        data: { bitcoin: { brl: 500000, brl_24h_change: 2.5 } },
      });
    }
    return Promise.resolve({
      data: {
        rates: {
          brl: { value: 500000 },
          usd: { value: 100000 },
          eur: { value: 90000 },
        },
      },
    });
  });
}

describe('MarketService', () => {
  let service: MarketService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MarketService();
  });

  it('converte cripto e moedas fiduciárias para BRL', async () => {
    mockCoinGecko();

    const ticker = await service.getTicker();

    expect(ticker.find((t) => t.symbol === 'BTC')).toMatchObject({
      type: 'crypto',
      priceBrl: 500000,
      change24h: 2.5,
    });
    // 500000 BRL/BTC ÷ 100000 USD/BTC = 5 BRL por USD
    expect(ticker.find((t) => t.symbol === 'USD')?.priceBrl).toBeCloseTo(5);
    expect(ticker.find((t) => t.symbol === 'EUR')?.priceBrl).toBeCloseTo(5.5556, 3);
  });

  it('usa o cache dentro do TTL', async () => {
    mockCoinGecko();

    await service.getTicker();
    await service.getTicker();

    expect(mockedAxios.get).toHaveBeenCalledTimes(2); // 1 rodada = 2 requisições
  });

  it('devolve o último valor se a CoinGecko falhar', async () => {
    mockCoinGecko();
    const first = await service.getTicker();

    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000);
    mockedAxios.get.mockRejectedValue(new Error('429'));

    await expect(service.getTicker()).resolves.toEqual(first);
    jest.restoreAllMocks();
  });

  it('lança 503 sem cache e com a CoinGecko fora', async () => {
    mockedAxios.get.mockRejectedValue(new Error('429'));
    await expect(service.getTicker()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
