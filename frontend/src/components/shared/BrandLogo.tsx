import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import logo from "@/logo.webp";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  showWordmark?: boolean;
  linkToHome?: boolean;
};

const heights = {
  sm: "h-7",
  md: "h-9",
  lg: "h-11",
} as const;

export function BrandLogo({
  size = "md",
  className,
  showWordmark = false,
  linkToHome = false,
}: BrandLogoProps) {
  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={logo}
        alt="BreathESG"
        className={cn(heights[size], "w-auto max-w-[140px] object-contain object-left")}
      />
      {showWordmark && (
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">BreathESG</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Analyst Console
          </div>
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="rounded-md outline-none ring-ring/40 focus-visible:ring-2">
        {content}
      </Link>
    );
  }

  return content;
}
