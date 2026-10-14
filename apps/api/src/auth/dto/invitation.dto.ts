import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from "class-validator";

export class CreateInvitationDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @Length(2, 160)
  fullName!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUUID("4", { each: true })
  roleIds!: string[];
}

export class AcceptInvitationDto {
  @IsString()
  @Length(32, 300)
  token!: string;

  @IsString()
  @Length(12, 200)
  password!: string;
}
