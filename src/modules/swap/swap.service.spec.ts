import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { SwapService } from './swap.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SwapService', () => {
  let service: SwapService;

  const tx = {
    wallet: { findUnique: jest.fn() },
    balance: { update: jest.fn() },
    ledgerEntry: { create: jest.fn() },
    transaction: { create: jest.fn() },
  };

  const prisma = {
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SwapService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<SwapService>(SwapService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuote', () => {
    it('cota cripto → BRL aplicando taxa de 1,5%', async () => {
      mockedAxios.get.mockResolvedValue({ data: { bitcoin: { brl: 100000 } } });

      const quote = await service.getQuote({ fromToken: 'BTC', toToken: 'BRL', amount: 1 });

      expect(quote.price).toBe(100000);
      expect(quote.fee).toBeCloseTo(1500);
      expect(quote.amount).toBeCloseTo(98500);
    });

    it('cota BRL → cripto e cripto → cripto via preço em BRL', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { bitcoin: { brl: 100000 }, ethereum: { brl: 10000 } },
      });

      const brlToBtc = await service.getQuote({ fromToken: 'BRL', toToken: 'BTC', amount: 1000 });
      expect(brlToBtc.price).toBeCloseTo(0.00001);

      const ethToBtc = await service.getQuote({ fromToken: 'ETH', toToken: 'BTC', amount: 1 });
      expect(ethToBtc.price).toBeCloseTo(0.1);
    });

    it('rejeita tokens iguais ou não suportados', async () => {
      await expect(
        service.getQuote({ fromToken: 'BTC', toToken: 'BTC', amount: 1 }),
      ).rejects.toThrow('Tokens devem ser diferentes');

      await expect(
        service.getQuote({ fromToken: 'DOGE', toToken: 'BRL', amount: 1 }),
      ).rejects.toThrow('Token não suportado');
    });
  });

  describe('executeSwap', () => {
    it('mantém o ledger consistente com o saldo final', async () => {
      mockedAxios.get.mockResolvedValue({ data: { bitcoin: { brl: 100000 } } });
      tx.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        balances: [
          { id: 'b-btc', token: 'BTC', amount: 2 },
          { id: 'b-brl', token: 'BRL', amount: 500 },
        ],
      });

      const result = await service.executeSwap('user-1', {
        fromToken: 'BTC',
        toToken: 'BRL',
        amount: 1,
      });

      // Saldo BRL final = 500 + 98500 (líquido)
      expect(tx.balance.update).toHaveBeenCalledWith({
        where: { id: 'b-brl' },
        data: { amount: 99000 },
      });
      expect(result.received).toBeCloseTo(98500);

      const entries = tx.ledgerEntry.create.mock.calls.map(([arg]) => arg.data);
      const swapIn = entries.find((e) => e.type === 'SWAP_IN');
      const fee = entries.find((e) => e.type === 'SWAP_FEE');

      // Entrada bruta seguida da taxa; o newBalance da taxa é o saldo real
      expect(swapIn.amount).toBeCloseTo(100000);
      expect(swapIn.newBalance).toBeCloseTo(100500);
      expect(fee.previousBalance).toBeCloseTo(swapIn.newBalance);
      expect(fee.newBalance).toBeCloseTo(99000);

      expect(tx.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'SWAP',
          fromToken: 'BTC',
          toToken: 'BRL',
          amount: 1,
        }),
      });
    });

    it('rejeita saldo insuficiente', async () => {
      mockedAxios.get.mockResolvedValue({ data: { bitcoin: { brl: 100000 } } });
      tx.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        balances: [
          { id: 'b-btc', token: 'BTC', amount: 0.5 },
          { id: 'b-brl', token: 'BRL', amount: 0 },
        ],
      });

      await expect(
        service.executeSwap('user-1', { fromToken: 'BTC', toToken: 'BRL', amount: 1 }),
      ).rejects.toThrow('Saldo Inválido');
      expect(tx.balance.update).not.toHaveBeenCalled();
    });
  });
});
