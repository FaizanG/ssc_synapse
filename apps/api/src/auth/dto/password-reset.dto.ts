import { IsEmail, IsString, Length, MaxLength } from "class-validator";

export class RequestPasswordResetDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @Length(32, 300)
  token!: string;

  @IsString()
  @Length(12, 200)
  password!: string;
}
