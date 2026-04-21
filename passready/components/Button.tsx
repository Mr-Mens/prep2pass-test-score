import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "conversion" | "primary" | "secondary" | "ghost";

/** Shared tactile language; amplitude differs by variant. */
const tactileMotion =
  "transition-[box-shadow,background-color,opacity,color,transform,border-color] duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:translate-y-0";

const variantClasses: Record<ButtonVariant, string> = {
  /** Top-funnel payment intent: stronger depth, lift, and presence than `primary`. */
  conversion: [
    "min-h-[52px] rounded-2xl border border-teal-900/18 bg-accent text-white",
    "shadow-[0_2px_10px_rgba(15,118,110,0.42),0_12px_32px_rgba(15,118,110,0.2)]",
    "hover:-translate-y-[2px] hover:bg-teal-800 hover:shadow-[0_6px_22px_rgba(13,99,91,0.48),0_18px_44px_rgba(15,118,110,0.28)]",
    "active:translate-y-px active:shadow-md active:opacity-[0.97]",
    "px-6 py-4 text-base sm:text-lg",
    "focus-visible:!outline-none focus-visible:ring-4 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  ].join(" "),
  /** Default product primary: confident teal, calmer than conversion. */
  primary: [
    "min-h-[48px] rounded-xl border border-teal-900/12 bg-accent text-white",
    "shadow-sm hover:-translate-y-px hover:bg-teal-800 hover:shadow-md",
    "active:translate-y-px active:shadow-sm active:opacity-[0.98]",
    "px-6 py-3 text-sm sm:py-3.5 sm:text-sm",
    "focus-visible:!outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  ].join(" "),
  secondary: [
    "min-h-[48px] rounded-xl border border-brand-200/90 bg-white text-brand-950 shadow-sm",
    "hover:-translate-y-px hover:bg-brand-50 hover:shadow-md",
    "active:translate-y-px active:shadow-sm active:opacity-95",
    "px-5 py-3 text-sm",
    "focus-visible:!outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  ].join(" "),
  ghost: [
    "min-h-[48px] rounded-xl border border-transparent bg-transparent text-brand-800",
    "hover:border-brand-200/70 hover:bg-brand-50/90 hover:shadow-sm",
    "active:translate-y-px active:opacity-90",
    "px-4 py-3 text-sm",
    "focus-visible:!outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  ].join(" "),
};

type Common = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

type ButtonAsButton = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = Common & {
  href: string;
} & Omit<React.ComponentProps<typeof Link>, "className" | "children" | "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base = [
  "inline-flex min-w-[44px] shrink-0 items-center justify-center gap-2 font-semibold",
  tactileMotion,
].join(" ");

export function Button(props: ButtonProps) {
  const { variant = "primary", className = "", children } = props;
  const styles = `${base} ${variantClasses[variant]} ${className}`.trim();

  if ("href" in props && props.href) {
    /** Omit props we consume so `className` from callers is not spread after `className={styles}` and wipe variant styles. */
    const { href, variant: _v, className: _c, children: _ch, ...forward } = props as ButtonAsLink;
    return (
      <Link href={href} className={styles} {...forward}>
        {children}
      </Link>
    );
  }

  const { type = "button", variant: _v2, className: _c2, children: _ch2, ...forward } = props as ButtonAsButton;
  return (
    <button type={type} className={styles} {...forward}>
      {children}
    </button>
  );
}
