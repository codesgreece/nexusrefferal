import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-linear-to-b from-violet-500 to-violet-700 text-white shadow-[0_10px_30px_-12px_rgb(127_77_255/0.8)] hover:from-violet-400 hover:to-violet-600 hover:shadow-[0_14px_38px_-12px_rgb(127_77_255/0.95)]",
        secondary:
          "border border-white/10 bg-white/5 text-ink hover:border-violet-500/45 hover:bg-white/8",
        ghost: "text-muted hover:bg-white/6 hover:text-ink",
        outline:
          "border border-violet-500/35 bg-violet-500/5 text-violet-200 hover:border-violet-400/60 hover:bg-violet-500/12 hover:text-violet-100",
        danger:
          "border border-danger/35 bg-danger/12 text-danger hover:border-danger/60 hover:bg-danger/20",
        positive:
          "border border-positive/35 bg-positive/12 text-positive hover:border-positive/60 hover:bg-positive/20",
        subtle: "bg-surface-3 text-ink hover:bg-hairline-strong",
        link: "text-violet-300 underline-offset-4 hover:text-violet-200 hover:underline",
      },
      size: {
        xs: "h-7 px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-9 px-3.5",
        md: "h-11 px-5",
        lg: "h-12 px-7 text-[0.95rem]",
        icon: "size-9",
        "icon-sm": "size-8 [&_svg]:size-3.5",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...(asChild ? {} : { type })}
      {...props}
    />
  );
}

export { buttonVariants };
