import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { ActorContext } from "../types/actor-context.js";

export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ActorContext => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { actor: ActorContext }>();
    return request.actor;
  },
);
