import { z } from "zod";

const absoluteOrRootRelativeUrl = z.string().refine(
  (value) => {
    if (value.startsWith("/")) return true;
    return z.url().safeParse(value).success;
  },
  { message: "Expected an absolute URL or a root-relative path" },
);

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_API_URL: absoluteOrRootRelativeUrl,
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("SSC Synapse"),
  NEXT_PUBLIC_APP_URL: z.url(),
});

export const publicEnvironment = publicEnvironmentSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
