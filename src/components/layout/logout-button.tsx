"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { logoutAction } from "@/app/actions/auth";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Signs the user out and navigates away.
 *
 * Deliberately not a `<form action={…}>`: the control also appears inside a
 * Radix dropdown, which unmounts its content the moment the item is activated
 * and so can cancel an in-flight form submission. Calling the action directly
 * and then navigating behaves the same everywhere it is rendered.
 */
export function LogoutButton({
  variant = "sidebar",
  className,
}: {
  variant?: "sidebar" | "menu";
  className?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const signOut = async () => {
    if (pending) return;
    setPending(true);
    const result = await logoutAction();
    if (!result.ok) {
      toast.error(t(result.error));
      setPending(false);
      return;
    }
    router.replace("/login");
    // Clears the cached authenticated layouts so the shell cannot linger.
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className={cn(
        "flex w-full items-center gap-3 text-left transition-colors disabled:opacity-60",
        variant === "sidebar"
          ? "rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-danger/10 hover:text-danger"
          : "cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/12",
        className,
      )}
    >
      <LogOut className={variant === "sidebar" ? "size-4.5" : "size-4"} />
      {pending ? t("common.loading") : t("common.logout")}
    </button>
  );
}
