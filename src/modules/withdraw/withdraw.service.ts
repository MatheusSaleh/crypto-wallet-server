import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WithdrawDto } from './dto/withdraw.dto';

@Injectable()
export class WithdrawService {

    constructor(private prisma: PrismaService){}

    async withdraw(userId: string, data: WithdrawDto) {

        const { token, amount } = data 

        return this.prisma.$transaction(async (tx) => {

            const wallet = await tx.wallet.findUnique({
                where: { userId },
                include: { balances: true }
            })

            if (!wallet){
                throw new BadRequestException("Wallet não encontrada!");
            }

            const balance = wallet.balances.find(
                b => b.token === token
            );

            if (!balance){
                throw new BadRequestException("Token não suportado");
            }

            if (balance.amount < amount){
                throw new BadRequestException("Saldo insuficiente");
            }

            const previousBalance = balance.amount;
            const newBalance = previousBalance - amount;

            await tx.balance.update({
                where: { id: balance.id},
                data: { amount: newBalance }
            })

            await tx.ledgerEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "WITHDRAWAL",
                    token, 
                    amount: -amount,
                    previousBalance,
                    newBalance
                }
            })
            
            await tx.transaction.create({
                data: {
                    userId,
                    type: "WITHDRAWAL",
                    fromToken: token,
                    amount
                }
            })

            return {
                status: "Saque registrado",
                token,
                amount
            }
        })
    }
}
