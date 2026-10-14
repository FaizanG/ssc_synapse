import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from "class-validator";

export class LoginDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @Length(8, 200)
  password!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]{2,80}$/)
  businessSlug?: string;
}
