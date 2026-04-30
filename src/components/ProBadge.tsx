import { Crown } from "lucide-react";

interface ProBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

const ProBadge = ({ size = "sm", className = "" }: ProBadgeProps) => {
  const sizeClasses = size === "sm"
    ? "text-[9px] px-1.5 py-0.5 gap-0.5"
    : "text-[11px] px-2 py-1 gap-1";

  return (
    <span className={`inline-flex items-center font-bold rounded-full bg-accent text-accent-foreground ${sizeClasses} ${className}`}>
      <Crown size={size === "sm" ? 8 : 10} />
      PRO
    </span>
  );
};

export default ProBadge;
