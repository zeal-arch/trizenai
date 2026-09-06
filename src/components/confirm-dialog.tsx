"use client";

import { AlertTriangle, Trash2, CheckCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  onConfirm: () => void;
  loading?: boolean;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconColor: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    confirmButton: "bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600",
    titleColor: "text-red-900 dark:text-red-100",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    confirmButton: "bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-500 dark:hover:bg-orange-600",
    titleColor: "text-orange-900 dark:text-orange-100",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    confirmButton: "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600",
    titleColor: "text-blue-900 dark:text-blue-100",
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    confirmButton: "bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600",
    titleColor: "text-green-900 dark:text-green-100",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    onConfirm();
    // Don't close immediately - let the parent component handle closing after the async operation
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-border bg-white dark:bg-gray-dark shadow-xl">
        <div className="flex items-start gap-4 pt-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${config.iconBg}`}>
            <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <DialogHeader className="p-0">
              <DialogTitle className={`text-left text-lg font-semibold ${config.titleColor}`}>
                {title}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmButton}`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  buttonText?: string;
  variant?: "success" | "error" | "info" | "warning";
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  buttonText = "OK",
  variant = "info",
}: AlertDialogProps) {
  const config = variantConfig[variant === "error" ? "danger" : variant === "warning" ? "warning" : variant];
  const IconComponent = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-border bg-white dark:bg-gray-dark shadow-xl">
        <div className="flex items-start gap-4 pt-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${config.iconBg}`}>
            <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <DialogHeader className="p-0">
              <DialogTitle className={`text-left text-lg font-semibold ${config.titleColor}`}>
                {title}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <DialogFooter className="pt-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors ${config.confirmButton}`}
          >
            {buttonText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
