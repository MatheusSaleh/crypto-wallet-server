import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/RegisterDto';
import { LoginDto } from './dto/LoginDto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const hash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hash,
        wallet: {
          create: {
            balances: {
              create: [
                { token: 'BRL', amount: 0 },
                { token: 'BTC', amount: 0 },
                { token: 'ETH', amount: 0 },
              ],
            },
          },
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
    };
  }

  async login(data: LoginDto) {

    const user = await this.prisma.user.findUnique({
        where: { email: data.email }
    })

    if (!user) {
        throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch){
        throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id }

    const accessToken = this.jwtService.sign(payload)

    return {
        accessToken
    }
  }
}
