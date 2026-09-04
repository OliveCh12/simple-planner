"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BranchNode {
  id: string;
  content: ReactNode;
  children?: BranchNode[];
}

interface ItemBranchTreeProps {
  nodes: BranchNode[];
  className?: string;
  /** Draw L-shaped guides. Off for the trunk of the current item. */
  guides?: boolean;
}

/** Nested list with L-shaped branch guides, like a file tree. */
export function ItemBranchTree({ nodes, className, guides = true }: ItemBranchTreeProps) {
  if (nodes.length === 0) return null;
  return (
    <ul className={cn("flex flex-col", className)}>
      {nodes.map((node, index) => (
        <BranchItem
          key={node.id}
          node={node}
          isLast={index === nodes.length - 1}
          guides={guides}
        />
      ))}
    </ul>
  );
}

function BranchItem({
  node,
  isLast,
  guides,
}: {
  node: BranchNode;
  isLast: boolean;
  guides: boolean;
}) {
  const nested = node.children ?? [];
  return (
    <li className="relative">
      {guides && (
        <>
          <span
            aria-hidden
            className={cn("absolute top-0 left-[11px] w-px bg-border", isLast ? "h-3.5" : "bottom-0")}
          />
          <span aria-hidden className="absolute top-3.5 left-[11px] h-px w-2.5 bg-border" />
        </>
      )}
      <div className={cn("flex min-h-7 items-center", guides && "pl-6")}>{node.content}</div>
      {nested.length > 0 && (
        <div className={guides ? "pl-4" : undefined}>
          <ItemBranchTree nodes={nested} />
        </div>
      )}
    </li>
  );
}
