import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletBalanceResponseDto } from './dto/wallet-balance-response.dto';

@Injectable()
export class WalletService {

    constructor(private prisma: PrismaService) { }

    async getBalance(userId: string): Promise<WalletBalanceResponseDto[]> {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            include: {
                balances: true
            }
        })

        if (!wallet) {
            throw new NotFoundException('Wallet não encontrado para o usuário.');
        }

        

        return wallet.balances.map(balance => new WalletBalanceResponseDto(balance.token, balance.amount));
    }
}
