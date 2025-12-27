import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-md border p-4 shadow-lg min-w-[300px] bg-background ${
            toast.variant === "destructive"
              ? "border-destructive text-destructive"
              : "border-border"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              {toast.title && (
                <p className="font-semibold text-sm">{toast.title}</p>
              )}
              {toast.description && (
                <p className="text-sm text-muted-foreground">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
