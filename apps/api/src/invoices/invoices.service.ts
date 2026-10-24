import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { AuditService } from "../audit/audit.service.js";
import type { ActorContext } from "../common/types/actor-context.js";
import { PrismaService } from "../database/prisma.service.js";
import {
  InvoiceStatus,
  InvoiceType,
  Prisma,
} from "../generated/prisma/client.js";
import {
  CreateInvoiceDto,
  IssueInvoiceDto,
  UpdateInvoiceDto,
} from "./dto/invoice.dto.js";
import { calculateInvoiceTotals } from "./invoice-calculator.js";

const invoiceInclude = {
  lineItems: { orderBy: { lineNumber: "asc" as const } },
  createdBy: { select: { id: true, fullName: true } },
} satisfies Prisma.InvoiceInclude;

type InvoiceRecord = Prisma.InvoiceGetPayload<{
  include: typeof invoiceInclude;
}>;

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async list(actor: ActorContext) {
    const records = await this.prisma.invoice.findMany({
      where: { businessId: actor.businessId },
      include: invoiceInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return records.map((record) => this.serialize(record));
  }

  async findOne(actor: ActorContext, id: string) {
    return this.serialize(await this.requireInvoice(actor.businessId, id));
  }

  async create(actor: ActorContext, dto: CreateInvoiceDto) {
    this.assertCustomerName(dto.customerName);
    this.assertDates(dto.issueDate, dto.dueDate);
    const totals = this.calculate(dto);
    const record = await this.prisma.invoice.create({
      data: {
        business: { connect: { id: actor.businessId } },
        createdBy: { connect: { id: actor.userId } },
        customerName: dto.customerName.trim(),
        customerPhone: this.optionalText(dto.customerPhone),
        customerEmail: this.optionalText(dto.customerEmail),
        billingAddress: this.optionalText(dto.billingAddress),
        eventType: this.optionalText(dto.eventType),
        eventDate: this.dateOnly(dto.eventDate),
        venue: this.optionalText(dto.venue),
        guestCount: dto.guestCount,
        menuPackage: this.optionalText(dto.menuPackage),
        type: dto.type ?? InvoiceType.MANUAL,
        currency: dto.currency ?? "PKR",
        issueDate: this.dateOnly(dto.issueDate),
        dueDate: this.dateOnly(dto.dueDate),
        serviceChargeRate: dto.serviceChargeRate ?? "0",
        serviceChargeAmount: totals.serviceChargeAmount,
        taxRate: dto.taxRate ?? "0",
        taxAmount: totals.taxAmount,
        subtotalAmount: totals.subtotalAmount,
        totalAmount: totals.totalAmount,
        balanceAmount: totals.totalAmount,
        paymentTerms: this.optionalText(dto.paymentTerms),
        notes: this.optionalText(dto.notes),
        lineItems: {
          create: dto.items.map((item, index) => ({
            businessId: actor.businessId,
            lineNumber: index + 1,
            description: item.description.trim(),
            category: this.optionalText(item.category),
            quantity: item.quantity,
            unit: this.optionalText(item.unit),
            unitPrice: item.unitPrice,
            lineTotal: totals.lineTotals[index]!,
          })),
        },
      },
      include: invoiceInclude,
    });
    await this.recordAudit(actor, "invoice.created", record);
    return this.serialize(record);
  }

  async update(actor: ActorContext, id: string, dto: UpdateInvoiceDto) {
    const current = await this.requireInvoice(actor.businessId, id);
    if (current.status !== InvoiceStatus.DRAFT) {
      throw new ConflictException({
        code: "INVOICE_IMMUTABLE",
        message: "Issued invoices cannot be edited.",
      });
    }
    if (dto.customerName !== undefined)
      this.assertCustomerName(dto.customerName);

    const issueDate = dto.issueDate ?? this.isoDate(current.issueDate);
    const dueDate = dto.dueDate ?? this.isoDate(current.dueDate);
    this.assertDates(issueDate, dueDate);

    const calculationInput = {
      items:
        dto.items ??
        current.lineItems.map((item) => ({
          description: item.description,
          category: item.category ?? undefined,
          quantity: item.quantity.toString(),
          unit: item.unit ?? undefined,
          unitPrice: item.unitPrice.toString(),
        })),
      serviceChargeRate:
        dto.serviceChargeRate ?? current.serviceChargeRate.toString(),
      taxRate: dto.taxRate ?? current.taxRate.toString(),
    };
    const totals = this.calculate(calculationInput);

    const data: Prisma.InvoiceUpdateInput = {
      updatedBy: { connect: { id: actor.userId } },
      customerName:
        dto.customerName === undefined ? undefined : dto.customerName.trim(),
      customerPhone: this.updatedText(dto.customerPhone),
      customerEmail: this.updatedText(dto.customerEmail),
      billingAddress: this.updatedText(dto.billingAddress),
      eventType: this.updatedText(dto.eventType),
      eventDate:
        dto.eventDate === undefined ? undefined : this.dateOnly(dto.eventDate),
      venue: this.updatedText(dto.venue),
      guestCount: dto.guestCount,
      menuPackage: this.updatedText(dto.menuPackage),
      type: dto.type,
      currency: dto.currency,
      issueDate:
        dto.issueDate === undefined ? undefined : this.dateOnly(dto.issueDate),
      dueDate:
        dto.dueDate === undefined ? undefined : this.dateOnly(dto.dueDate),
      serviceChargeRate: calculationInput.serviceChargeRate,
      serviceChargeAmount: totals.serviceChargeAmount,
      taxRate: calculationInput.taxRate,
      taxAmount: totals.taxAmount,
      subtotalAmount: totals.subtotalAmount,
      totalAmount: totals.totalAmount,
      balanceAmount: totals.totalAmount.minus(current.paidAmount),
      paymentTerms: this.updatedText(dto.paymentTerms),
      notes: this.updatedText(dto.notes),
      version: { increment: 1 },
      lineItems: dto.items
        ? {
            deleteMany: {},
            create: dto.items.map((item, index) => ({
              businessId: actor.businessId,
              lineNumber: index + 1,
              description: item.description.trim(),
              category: this.optionalText(item.category),
              quantity: item.quantity,
              unit: this.optionalText(item.unit),
              unitPrice: item.unitPrice,
              lineTotal: totals.lineTotals[index]!,
            })),
          }
        : undefined,
    };

    const record = await this.prisma.invoice.update({
      where: { id },
      data,
      include: invoiceInclude,
    });
    await this.recordAudit(actor, "invoice.updated", record);
    return this.serialize(record);
  }

  async issue(actor: ActorContext, id: string, dto: IssueInvoiceDto) {
    const issued = await this.prisma.$transaction(
      async (transaction) => {
        const current = await transaction.invoice.findFirst({
          where: { id, businessId: actor.businessId },
          include: invoiceInclude,
        });
        if (!current) this.notFound();
        if (current.status === InvoiceStatus.ISSUED) return current;
        if (current.status !== InvoiceStatus.DRAFT) {
          throw new ConflictException({
            code: "INVOICE_CANNOT_BE_ISSUED",
            message: "Only a draft invoice can be issued.",
          });
        }

        const business = await transaction.business.findUniqueOrThrow({
          where: { id: actor.businessId },
          select: {
            settings: {
              select: {
                invoicePrefix: true,
                financialYearStartMonth: true,
              },
            },
          },
        });
        const issueDate = this.dateOnly(dto.issueDate) ?? new Date();
        const defaultDueDate = new Date(issueDate);
        defaultDueDate.setUTCDate(defaultDueDate.getUTCDate() + 7);
        const dueDate =
          this.dateOnly(dto.dueDate) ?? current.dueDate ?? defaultDueDate;
        this.assertDates(this.isoDate(issueDate), this.isoDate(dueDate));

        const startMonth = business.settings?.financialYearStartMonth ?? 7;
        const fiscalPeriod = this.fiscalPeriod(issueDate, startMonth);
        const prefix = business.settings?.invoicePrefix ?? "INV";
        const sequence = await transaction.documentSequence.upsert({
          where: {
            businessId_documentType_fiscalPeriod: {
              businessId: actor.businessId,
              documentType: "INVOICE",
              fiscalPeriod,
            },
          },
          create: {
            businessId: actor.businessId,
            documentType: "INVOICE",
            fiscalPeriod,
            prefix,
            nextNumber: 2,
          },
          update: { prefix, nextNumber: { increment: 1 } },
        });
        const allocatedNumber = sequence.nextNumber - 1;
        const invoiceNumber = `${prefix}-${fiscalPeriod}-${String(allocatedNumber).padStart(4, "0")}`;

        const updated = await transaction.invoice.updateMany({
          where: {
            id,
            businessId: actor.businessId,
            status: InvoiceStatus.DRAFT,
          },
          data: {
            invoiceNumber,
            status: InvoiceStatus.ISSUED,
            issueDate,
            dueDate,
            issuedAt: new Date(),
            updatedById: actor.userId,
            version: { increment: 1 },
          },
        });
        if (updated.count !== 1) {
          throw new ConflictException({
            code: "INVOICE_ISSUE_CONFLICT",
            message:
              "The invoice changed while it was being issued. Try again.",
          });
        }
        return transaction.invoice.findUniqueOrThrow({
          where: { id },
          include: invoiceInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await this.recordAudit(actor, "invoice.issued", issued);
    return this.serialize(issued);
  }

  private calculate(input: {
    items: Array<{ quantity: string; unitPrice: string }>;
    serviceChargeRate?: string;
    taxRate?: string;
  }) {
    try {
      return calculateInvoiceTotals(
        input.items,
        input.serviceChargeRate,
        input.taxRate,
      );
    } catch (error) {
      throw new BadRequestException({
        code: "INVOICE_CALCULATION_INVALID",
        message:
          error instanceof Error
            ? error.message
            : "The invoice contains invalid amounts.",
      });
    }
  }

  private async requireInvoice(businessId: string, id: string) {
    const record = await this.prisma.invoice.findFirst({
      where: { id, businessId },
      include: invoiceInclude,
    });
    if (!record) this.notFound();
    return record;
  }

  private notFound(): never {
    throw new NotFoundException({
      code: "INVOICE_NOT_FOUND",
      message: "The invoice could not be found.",
    });
  }

  private assertCustomerName(value: string) {
    if (!value.trim()) {
      throw new BadRequestException({
        code: "CUSTOMER_NAME_REQUIRED",
        message: "Customer name is required.",
      });
    }
  }

  private assertDates(issueDate?: string, dueDate?: string) {
    if (issueDate && dueDate && dueDate < issueDate) {
      throw new BadRequestException({
        code: "INVOICE_DUE_DATE_INVALID",
        message: "Due date cannot be before the issue date.",
      });
    }
  }

  private fiscalPeriod(date: Date, startMonth: number) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const startYear = month >= startMonth ? year : year - 1;
    return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
  }

  private dateOnly(value?: string) {
    return value ? new Date(`${value}T00:00:00.000Z`) : undefined;
  }

  private isoDate(value?: Date | null) {
    return value?.toISOString().slice(0, 10);
  }

  private optionalText(value?: string) {
    return value?.trim() || null;
  }

  private updatedText(value?: string) {
    return value === undefined ? undefined : this.optionalText(value);
  }

  private async recordAudit(
    actor: ActorContext,
    action: string,
    record: InvoiceRecord,
  ) {
    await this.audit.record({
      businessId: actor.businessId,
      actorId: actor.userId,
      sessionId: actor.sessionId,
      action,
      entityType: "invoice",
      entityId: record.id,
      afterSummary: {
        invoiceNumber: record.invoiceNumber,
        status: record.status,
        customerName: record.customerName,
        currency: record.currency,
        totalAmount: record.totalAmount.toFixed(2),
        version: record.version,
      },
    });
  }

  private serialize(record: InvoiceRecord) {
    return {
      id: record.id,
      invoiceNumber: record.invoiceNumber,
      type: record.type,
      status: record.status,
      customerName: record.customerName,
      customerPhone: record.customerPhone,
      customerEmail: record.customerEmail,
      billingAddress: record.billingAddress,
      eventType: record.eventType,
      eventDate: this.isoDate(record.eventDate),
      venue: record.venue,
      guestCount: record.guestCount,
      menuPackage: record.menuPackage,
      currency: record.currency,
      issueDate: this.isoDate(record.issueDate),
      dueDate: this.isoDate(record.dueDate),
      serviceChargeRate: record.serviceChargeRate.toString(),
      serviceChargeAmount: record.serviceChargeAmount.toFixed(2),
      taxRate: record.taxRate.toString(),
      taxAmount: record.taxAmount.toFixed(2),
      subtotalAmount: record.subtotalAmount.toFixed(2),
      totalAmount: record.totalAmount.toFixed(2),
      paidAmount: record.paidAmount.toFixed(2),
      balanceAmount: record.balanceAmount.toFixed(2),
      paymentTerms: record.paymentTerms,
      notes: record.notes,
      version: record.version,
      issuedAt: record.issuedAt?.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      createdBy: record.createdBy,
      items: record.lineItems.map((item) => ({
        id: item.id,
        lineNumber: item.lineNumber,
        description: item.description,
        category: item.category,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unitPrice: item.unitPrice.toFixed(2),
        lineTotal: item.lineTotal.toFixed(2),
      })),
    };
  }
}
