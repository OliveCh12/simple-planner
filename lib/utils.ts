import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function containerClasses() {
  return "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
}
