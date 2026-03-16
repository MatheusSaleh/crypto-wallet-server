import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DepositDto } from './dto/deposit.dto';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  async deposit(data: DepositDto) {
    const { userId, token, amount, idempotencyKey } = data;

    return this.prisma.$transaction(async (tx) => {
      const existingEvent = await tx.webhookEvent.findUnique({
        where: { idempotencyKey },
      });

      if (existingEvent) {
        throw new BadRequestException(
          'Evento de webhook já processado para esta chave de idempotência.',
        );
      }

      const wallet = await tx.wallet.findUnique({
        where: { userId },
        include: { balances: true },
      });

      if (!wallet) {
        throw new BadRequestException('Carteira não encontrada para o usuário.');
      }

      const balance = wallet.balances.find((b) => b.token === token);

      if (!balance) {
        throw new BadRequestException(
          'Token não encontrado na carteira do usuário.',
        );
      }

      const previousBalance = balance.amount;
      const newBalance = previousBalance + parseFloat(amount);

      await tx.balance.update({
        where: { id: balance.id },
        data: { amount: newBalance },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          token,
          amount: parseFloat(amount),
          previousBalance,
          newBalance,
        },
      });

      await tx.webhookEvent.create({
        data: {
          idempotencyKey,
        },
      });

      return {
        message: 'Depósito processado com sucesso.',
        token,
        amount: parseFloat(amount),
      };
    });
  }
}
