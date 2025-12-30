import { useState, useCallback, useEffect } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastCount = 0;

const toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function emitChange() {
  toastListeners.forEach((listener) => listener(toasts));
}

export function toast({ title, description, variant = "default" }: Omit<Toast, "id">) {
  const id = String(toastCount++);
  const newToast = { id, title, description, variant };
  toasts = [...toasts, newToast];
  emitChange();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitChange();
  }, 5000);

  return id;
}

export function useToast() {
  const [localToasts, setLocalToasts] = useState<Toast[]>(toasts);

  useEffect(() => {
    toastListeners.push(setLocalToasts);
    return () => {
      const index = toastListeners.indexOf(setLocalToasts);
      if (index > -1) toastListeners.splice(index, 1);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    emitChange();
  }, []);

  return {
    toasts: localToasts,
    toast,
    dismiss,
  };
}
