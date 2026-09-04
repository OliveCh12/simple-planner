"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { planDocumentForAi, serializeForAi } from "@/lib/copy-for-ai";
import { getRepository } from "@/lib/repository/create";

interface CopyForAiProps {
  document: unknown;
  label?: string;
  iconOnly?: boolean;
}

export function CopyForAi({ document, label = "Copy for AI", iconOnly = false }: CopyForAiProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(serializeForAi(document));
      setCopied(true);
      toast.success("Copied JSON for AI");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy.");
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={iconOnly ? "icon-sm" : "sm"}
          aria-label={label}
          onClick={() => void copy()}
        >
          {copied ? <Check /> : <Copy />}
          {!iconOnly && label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy for AI</TooltipContent>
    </Tooltip>
  );
}

export function CopyPlanForAi({ planId }: { planId: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      const repository = getRepository();
      const plan = await repository.plans.get(planId);
      if (!plan) return;
      const [items, people, categories] = await Promise.all([
        repository.items.listByPlan(planId),
        repository.people.list(),
        repository.categories.list(),
      ]);
      await navigator.clipboard.writeText(serializeForAi(planDocumentForAi({ plan, items, people, categories })));
      setCopied(true);
      toast.success("Copied JSON for AI");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy.");
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Copy for AI"
          className="relative z-10 text-muted-foreground"
          onClick={(event) => void copy(event)}
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy for AI</TooltipContent>
    </Tooltip>
  );
}
