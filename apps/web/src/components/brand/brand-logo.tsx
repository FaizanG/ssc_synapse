import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  decorative?: boolean;
  priority?: boolean;
};

export function BrandLogo({
  className,
  compact = false,
  decorative = false,
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src={compact ? "/brand/ssc-mark.png" : "/brand/siddique-sons-logo.png"}
      alt={decorative ? "" : "Siddique Sons Caterers"}
      width={compact ? 512 : 731}
      height={compact ? 512 : 372}
      priority={priority}
      className={cn("object-contain", className)}
    />
  );
}
