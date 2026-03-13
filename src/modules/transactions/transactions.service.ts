import { Injectable } from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async getTransactions(userId: string, pagination: PaginationDto) {
    const { page, limit } = pagination;


    const limitNumber = Number(limit);

    const skip = (page - 1) * limitNumber;


    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNumber,
    });

    return transactions.map(
      (t) =>
        new TransactionResponseDto(
          t.type,
          t.fromToken ?? undefined,
          t.toToken ?? undefined,
          t.amount,
          t.fee ?? undefined,
          t.createdAt,
        ),
    );
  }
}
