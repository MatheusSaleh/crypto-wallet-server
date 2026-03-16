import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerResponseDto } from './dto/ledger-response.dto';

@Injectable()
export class LedgerService {

    constructor(private prisma: PrismaService){}

    async getLedger(userId: string, pagination: PaginationDto){

        const { page, limit } = pagination;

        const limitNumber = Number(limit);

        const wallet = await this.prisma.wallet.findUnique({
            where: { userId }
        })

        if (!wallet) {
            throw new NotFoundException("Wallet não encontrada!");
        }

        const skip = (page - 1) * limitNumber 

        const entries = await this.prisma.ledgerEntry.findMany({
            where: {
                walletId: wallet.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limitNumber
        })

        return entries.map(entry => 
            new LedgerResponseDto(
                entry.type,
                entry.token,
                entry.amount,
                entry.previousBalance,
                entry.newBalance,
                entry.createdAt
            )
        )
    }
}
