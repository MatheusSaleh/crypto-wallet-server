import { IsString } from "class-validator";

export class DepositDto {

    @IsString()
    userId: string;

    @IsString()
    token: string;

    @IsString()
    amount: string;

    @IsString()
    idempotencyKey: string;
    
}