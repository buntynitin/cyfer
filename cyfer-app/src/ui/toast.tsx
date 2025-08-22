import { toast as sonnerToast } from "sonner";

export function useAppToast() {
  return (options: { title: string; status?: "success" | "error" | "warning" | "info"; duration?: number }) => {
    const { title, status = "info", duration = 1600 } = options;
    const base = { duration } as const;
    switch (status) {
      case "success":
        sonnerToast.success(title, base);
        break;
      case "error":
        sonnerToast.error(title, base);
        break;
      case "warning":
        sonnerToast.warning(title, base);
        break;
      default:
        sonnerToast.message(title, base);
    }
  };
} 