import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const typographyVariants = cva("", {
  variants: {
    variant: {
      "heading-xl-bold": "text-[56px] font-ibm font-bold leading-[64px] tracking-[-0.02%]",
      "heading-xl-semibold": "text-[56px] font-ibm font-semibold leading-[64px] tracking-[-0.02em]",
      "heading-l-bold": "text-[56px] font-bold leading-[64px] tracking-[-0.02em]",
      "heading-l-semibold": "text-[56px] font-semibold leading-[64px] tracking-[-0.02em]",
      "heading-m-bold": "text-[56px] font-bold leading-[64px] tracking-[-0.02em]",
      "heading-m-semibold": "text-[56px] font-semibold leading-[64px] tracking-[-0.02em]",
      "heading-s-bold": "text-[22px] font-ibm font-bold leading-[30px] tracking-[-0.01%]",
      "heading-s-semibold": "text-[22px] font-ibm font-semibold leading-[30px] tracking-[-0.01%]",
      "body-xl-bold": "text-[18px] font-preterand font-bold leading-[28px] tracking-[-0.01%]",
      "body-xl-semibold": "text-[18px] font-preterand font-semibold leading-[28px] tracking-[-0.01%]",
      "body-xl-medium": "text-[18px] font-preterand font-medium leading-[28px] tracking-[-0.01%]",
      "body-l-bold": "text-[16] font-preterand font-bold leading-[26px] tracking-[0%]",
      "body-l-semibold": "text-[16] font-preterand font-semibold leading-[26px] tracking-[0%]",
      "body-l-medium": "text-[16] font-preterand font-medium leading-[26px] tracking-[0%]",
      "body-m-bold": "text-[14px] font-preterand font-bold leading-[22px] tracking-[-0.01%]",
      "body-m-semibold": "text-[14px] font-preterand font-semibold leading-[22px] tracking-[-0.01%]",
      "body-m-medium": "text-[14px] font-preterand font-medium leading-[22px] tracking-[-0.01%]",
      "body-s-bold": "text-[12px] font-preterand font-bold leading-[18px] tracking-[0%]",
      "body-s-semibold": "text-[12px] font-preterand font-semibold leading-[18px] tracking-[0%]",
      "body-s-medium": "text-[12px] font-preterand font-medium leading-[18px] tracking-[0%]"
    },
  },
});

type TypographyVariant = NonNullable<VariantProps<typeof typographyVariants>["variant"]>;

const defaultTag: Record<TypographyVariant, keyof React.JSX.IntrinsicElements> = {
  "heading-xl-bold": "h1",
  "heading-xl-semibold": "h1",
  "heading-l-bold": "h2",
  "heading-l-semibold": "h2",
  "heading-m-bold": "h3",
  "heading-m-semibold": "h3",
  "heading-s-bold": "h4",
  "heading-s-semibold": "h4",
  "body-xl-bold": "p",
  "body-xl-semibold": "p",
  "body-xl-medium": "p",
  "body-l-bold": "p",
  "body-l-semibold": "p",
  "body-l-medium": "p",
  "body-m-bold": "p",
  "body-m-semibold": "p",
  "body-m-medium": "p",
  "body-s-bold": "p",
  "body-s-semibold": "p",
  "body-s-medium": "p",
};

const defaultColor: Record<TypographyVariant, string> = {
  "heading-xl-bold": "#1E1E1E",
  "heading-xl-semibold": "text-neutral-900",
  "heading-l-bold": "text-neutral-900",
  "heading-l-semibold": "text-neutral-900",
  "heading-m-bold": "text-neutral-900",
  "heading-m-semibold": "text-neutral-900",
  "heading-s-bold": "text-neutral-900",
  "heading-s-semibold": "text-neutral-900",
  "body-xl-bold": "text-neutral-900",
  "body-xl-semibold": "text-neutral-900",
  "body-xl-medium": "text-neutral-900",
  "body-l-bold": "text-neutral-900",
  "body-l-semibold": "text-neutral-900",
  "body-l-medium": "text-neutral-900",
  "body-m-bold": "text-neutral-900",
  "body-m-semibold": "text-neutral-900",
  "body-m-medium": "text-neutral-900",
  "body-s-bold": "text-neutral-900",
  "body-s-semibold": "text-neutral-900",
  "body-s-medium": "text-neutral-900",
};

interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
  VariantProps<typeof typographyVariants> {
  as?: keyof React.JSX.IntrinsicElements;
  variant: TypographyVariant;
  color?: string;
}

export function Typography({ variant, as, color, className, style, children, ...props }: TypographyProps) {
  const Tag = (as ?? defaultTag[variant]) as React.ElementType;
  const colorStyle = color ? { color } : { color: defaultColor[variant] };
  return (
    <Tag className={cn(typographyVariants({ variant }), className)} style={{ ...colorStyle, ...style }} {...props}>
      {children}
    </Tag>
  );
}
