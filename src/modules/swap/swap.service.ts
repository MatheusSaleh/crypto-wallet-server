import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SwapQuoteDto } from './dto/swap-quote.dto';
import axios from 'axios'
import { SwapExecuteDto } from './dto/swap-execute.dto';


@Injectable()
export class SwapService {

    constructor(private prisma: PrismaService) {}

    private tokenMap = {
        BTC: "bitcoin",
        ETH: "ethereum",
        BRL: "brl"
    }

    async getQuote(data: SwapQuoteDto) {

        const { fromToken, toToken, amount } = data;

        if (fromToken === toToken) {
            throw new BadRequestException("Tokens devem ser diferentes");
        }

        const from = this.tokenMap[fromToken];
        const to = this.tokenMap[toToken];

        const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price`,
            {
                params: {
                    ids: from, 
                    vs_currencies: to
                }
            }
        );

        const price = response.data[from][to]

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

            const newFromBalance = fromBalance.amount - amount;
            const newToBalance = toBalance.amount + quote.amount;

            // Debita Origem
            await tx.balance.update({
                where: { id: fromBalance.id },
                data: { amount: newFromBalance }
            })

            // Credita destino
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
                    amount: quote.amount,
                    previousBalance: toBalance.amount,
                    newBalance: newToBalance
                }
            })

            //Registra Taxa
            await tx.ledgerEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "SWAP_FEE",
                    token: toToken,
                    amount: -quote.fee,
                    previousBalance: newToBalance,
                    newBalance: newToBalance - quote.fee
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
