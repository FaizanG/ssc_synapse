import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentActor } from "../common/decorators/current-actor.decorator.js";
import { RequirePermissions } from "../common/decorators/permissions.decorator.js";
import type { ActorContext } from "../common/types/actor-context.js";
import {
  CreateInvoiceDto,
  IssueInvoiceDto,
  UpdateInvoiceDto,
} from "./dto/invoice.dto.js";
import { InvoicesService } from "./invoices.service.js";

@ApiTags("invoices")
@Controller("invoices")
@RequirePermissions("invoices.issue")
export class InvoicesController {
  constructor(
    @Inject(InvoicesService) private readonly invoices: InvoicesService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List invoices for the current business" })
  list(@CurrentActor() actor: ActorContext) {
    return this.invoices.list(actor);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an invoice and its line items" })
  findOne(
    @CurrentActor() actor: ActorContext,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.invoices.findOne(actor, id);
  }

  @Post()
  @ApiOperation({ summary: "Create a calculated invoice draft" })
  create(@CurrentActor() actor: ActorContext, @Body() dto: CreateInvoiceDto) {
    return this.invoices.create(actor, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update and recalculate an invoice draft" })
  update(
    @CurrentActor() actor: ActorContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoices.update(actor, id, dto);
  }

  @Post(":id/issue")
  @ApiOperation({ summary: "Issue and freeze an invoice" })
  issue(
    @CurrentActor() actor: ActorContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: IssueInvoiceDto,
  ) {
    return this.invoices.issue(actor, id, dto);
  }
}
