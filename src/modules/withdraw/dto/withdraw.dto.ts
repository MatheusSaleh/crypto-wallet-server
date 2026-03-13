import { IsNumber, IsString } from "class-validator";

export class WithdrawDto {

    @IsString()
    token: string;

    @IsNumber()
    amount: number;
}