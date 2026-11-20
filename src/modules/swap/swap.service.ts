import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SwapQuoteDto } from './dto/swap-quote.dto';
import axios from 'axios'
import { SwapExecuteDto } from './dto/swap-execute.dto';


@Injectable()
export class SwapService {

    constructor(private prisma: PrismaService) {}

    // Ids da CoinGecko para os criptoativos. BRL é a moeda de referência.
    private coinGeckoIds: Record<string, string> = {
        BTC: "bitcoin",
        ETH: "ethereum",
    }

    private isSupported(token: string) {
        return token === "BRL" || token in this.coinGeckoIds;
    }

    // Retorna quantos "toToken" vale 1 "fromToken", cotando ambos em BRL.
    private async getPrice(fromToken: string, toToken: string): Promise<number> {
        const ids = [fromToken, toToken]
            .filter(token => token !== "BRL")
            .map(token => this.coinGeckoIds[token]);

        const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price`,
            {
                params: {
                    ids: ids.join(","),
                    vs_currencies: "brl"
                }
            }
        );

        const priceInBrl = (token: string): number => {
            if (token === "BRL") return 1;
            const value = response.data?.[this.coinGeckoIds[token]]?.brl;
            if (typeof value !== "number") {
                throw new BadRequestException(`Cotação indisponível para ${token}`);
            }
            return value;
        };

        return priceInBrl(fromToken) / priceInBrl(toToken);
    }

    async getQuote(data: SwapQuoteDto) {

        const { fromToken, toToken, amount } = data;

        if (fromToken === toToken) {
            throw new BadRequestException("Tokens devem ser diferentes");
        }

        if (!this.isSupported(fromToken) || !this.isSupported(toToken)) {
            throw new BadRequestException("Token não suportado");
        }

        const price = await this.getPrice(fromToken, toToken);

        const destinationAmount = amount * price;

        const fee = destinationAmount * 0.015;

        const finalAmount = destinationAmount - fee

        return {
            price, 
            amount: finalAmount,
            fee
        }
    }


    async executeSwap(userId: string, data: SwapExecuteDto) {

        const quote = await this.getQuote(data);

        const { fromToken, toToken, amount } = data;

        return this.prisma.$transaction(async (tx) => {

            const wallet = await tx.wallet.findUnique({
                where: { userId },
                include: { balances: true }
            })

            if (wallet === null){
                throw new BadRequestException("Carteira não encontrada para esse usuário")
            }

            const fromBalance = wallet.balances.find(
                b => b.token === fromToken
            )

            const toBalance = wallet.balances.find(
                b => b.token === toToken
            )

            if(!fromBalance || !toBalance){
                throw new BadRequestException("Token Inválido");
            }

            if (fromBalance.amount < amount){
                throw new BadRequestException("Saldo Inválido");
            }

            // quote.amount já é líquido (bruto - taxa). No ledger registramos
            // a entrada bruta e depois a taxa, para que a soma bata com o saldo final.
            const grossAmount = quote.amount + quote.fee;

            const newFromBalance = fromBalance.amount - amount;
            const balanceAfterSwapIn = toBalance.amount + grossAmount;
            const newToBalance = balanceAfterSwapIn - quote.fee;

            // Debita Origem
            await tx.balance.update({
                where: { id: fromBalance.id },
                data: { amount: newFromBalance }
            })

            // Credita destino (valor líquido)
            await tx.balance.update({
                where: { id: toBalance.id },
                data: { amount: newToBalance}
            })

            // Registra Saída
            await tx.ledgerEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "SWAP_OUT",
                    token: fromToken,
                    amount: -amount,
                    previousBalance: fromBalance.amount,
                    newBalance: newFromBalance
                }
            })

            //Registra Entrada
            await tx.ledgerEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "SWAP_IN",
                    token: toToken,
                    amount: grossAmount,
                    previousBalance: toBalance.amount,
                    newBalance: balanceAfterSwapIn
                }
            })

            //Registra Taxa
            await tx.ledgerEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "SWAP_FEE",
                    token: toToken,
                    amount: -quote.fee,
                    previousBalance: balanceAfterSwapIn,
                    newBalance: newToBalance
                }
            })

            // Registra a operação no histórico resumido
            await tx.transaction.create({
                data: {
                    userId,
                    type: "SWAP",
                    fromToken,
                    toToken,
                    amount,
                    fee: quote.fee
                }
            })

            return {
                fromToken,
                toToken,
                amount,
                received: quote.amount,
                fee: quote.fee
            }
        })
    }
}
