export type ActorContext = {
  userId: string;
  businessId: string;
  membershipId: string;
  sessionId: string;
  permissions: string[];
};

declare global {
  namespace Express {
    interface Request {
      actor?: ActorContext;
      correlationId?: string;
    }
  }
}
