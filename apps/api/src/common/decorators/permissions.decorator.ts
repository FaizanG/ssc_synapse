import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "ssc:permissions";
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
