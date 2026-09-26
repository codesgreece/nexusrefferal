"use client";

import * as React from "react";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n/provider";

export type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorEmail: string | null;
  previousValue: string | null;
  newValue: string | null;
  metadata: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

function prettyJson(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function Block({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-2">{label}</p>
      <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-white/8 bg-void/50 p-3 font-mono text-[0.7rem] leading-relaxed text-ink/85">
        {value}
      </pre>
    </div>
  );
}

export function AuditDetails({ entry }: { entry: AuditEntry }) {
  const { t, formatDate } = useI18n();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label={t("admin.audit.viewDetails")}
      >
        <Eye />
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={t(`audit.action.${entry.action}`)}
        description={`${entry.entityType}${entry.entityId ? ` · ${entry.entityId}` : ""}`}
        size="md"
      >
        <div className="space-y-4">
          <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
            {[
              [t("admin.audit.actor"), entry.actorEmail ?? t("common.system")],
              [t("admin.audit.when"), formatDate(entry.createdAt, true)],
              [t("admin.audit.ip"), entry.ip ?? "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-2">
                  {label}
                </dt>
                <dd className="mt-0.5 break-all text-sm text-ink/90">{value}</dd>
              </div>
            ))}
          </dl>

          <Block label={t("admin.audit.previous")} value={prettyJson(entry.previousValue)} />
          <Block label={t("admin.audit.next")} value={prettyJson(entry.newValue)} />
          <Block label={t("common.details")} value={prettyJson(entry.metadata)} />

          {entry.userAgent ? (
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-2">
                User agent
              </p>
              <p className="mt-0.5 break-all text-xs text-muted">{entry.userAgent}</p>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
