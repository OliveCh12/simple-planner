import React from "react";
import { containerClasses } from "@/lib/utils";

const page = () => {
  return (
    <div className={containerClasses()}>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-muted-foreground">
        Manage your application settings here.
      </p>
    </div>
  );
};
export default page;
