import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, onTimeout?:()=>any): Promise<T> {
  const timeout = new Promise<T>((_, reject) =>
    setTimeout(() => {
      onTimeout && onTimeout();
      return reject(new Error("Promise timed out"))
    }, timeoutMs)
  );

  return Promise.race([promise, timeout]);
}