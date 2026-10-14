export type ApiErrorResponse = {
  code: string;
  message: string;
  details?: string[];
  correlationId?: string;
  timestamp: string;
};

export type SessionActor = {
  user: { id: string; email: string; fullName: string };
  business: { id: string; slug: string; name: string };
  membership: {
    id: string;
    roles: Array<{ id: string; key: string; name: string }>;
  };
  permissions: string[];
};
