import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";

import { InvoiceType } from "../../generated/prisma/client.js";

const moneyPattern = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/;
const quantityPattern = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;
const percentagePattern = /^(?:100(?:\.0{1,2})?|\d{1,2}(?:\.\d{1,2})?)$/;

export class InvoiceLineItemDto {
  @IsString()
  @MaxLength(300)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsString()
  @Matches(quantityPattern, {
    message: "quantity must be a positive decimal with at most 2 decimals",
  })
  quantity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  unit?: string;

  @IsString()
  @Matches(moneyPattern, {
    message: "unitPrice must be a non-negative amount with at most 2 decimals",
  })
  unitPrice!: string;
}

export class CreateInvoiceDto {
  @IsString()
  @MaxLength(180)
  customerName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  customerEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  billingAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  eventType?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  eventDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  venue?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  guestCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  menuPackage?: string;

  @IsOptional()
  @IsEnum(InvoiceType)
  type?: InvoiceType;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  issueDate?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  dueDate?: string;

  @IsOptional()
  @IsString()
  @Matches(percentagePattern)
  serviceChargeRate?: string;

  @IsOptional()
  @IsString()
  @Matches(percentagePattern)
  taxRate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  items!: InvoiceLineItemDto[];
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}

export class IssueInvoiceDto {
  @IsOptional()
  @IsDateString({ strict: true })
  issueDate?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  dueDate?: string;
}
