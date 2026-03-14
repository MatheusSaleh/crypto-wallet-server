import { ApiProperty } from "@nestjs/swagger";

export class WalletBalanceResponseDto {

    @ApiProperty()
    token: string;

    @ApiProperty()
    balance: number;

    constructor(token: string, balance: number) {
        this.token = token;
        this.balance = balance;
    }
}