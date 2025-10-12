import React from "react";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

type Props = {
  onClick?: () => void;
  ariaLabel?: string;
};

const RoadmapCardNew = ({ 
  onClick, 
  ariaLabel = "Add new item" 
}: Props) => {
  return (
    <Card className="overflow-hidden p-4 bg-card/20 border-dashed border-2 h-full hover:shadow-lg transition-shadow cursor-pointer">
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        className="w-full h-full flex justify-center items-center 
                   hover:bg-accent hover:text-accent-foreground 
                   transition-colors duration-200 rounded-md 
                   focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                   cursor-pointer"
      >
        <Plus className="h-8 w-8" />
      </button>
    </Card>
  );
};

export default RoadmapCardNew;