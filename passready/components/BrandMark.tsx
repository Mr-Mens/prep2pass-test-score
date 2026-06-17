import { PRODUCT } from "@/lib/constants";

type Props = {
  variant?: "default" | "dark" | "compact";
  className?: string;
};

export function BrandMark({ variant = "default", className = "" }: Props) {
  const titleClass =
    variant === "dark"
      ? "font-heading text-sm font-semibold tracking-tight text-white sm:text-base"
      : variant === "compact"
        ? "font-heading text-sm font-semibold tracking-tight text-brand-950"
        : "font-heading text-lg font-semibold tracking-tight text-brand-950 sm:text-xl";

  return (
    <div className={className}>
      <p className={titleClass}>{PRODUCT.name}</p>
    </div>
  );
}
