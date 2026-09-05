import { Plus } from "lucide-react";

interface NewPlanCardProps {
  onClick: () => void;
}

export function NewPlanCard({ onClick }: NewPlanCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm font-medium text-muted-foreground transition-colors outline-none hover:border-foreground/30 hover:bg-muted/40 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Plus className="size-5" />
      New calendar
    </button>
  );
}
