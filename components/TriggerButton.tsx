'use client';

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type TriggerButtonProps = {
  canPublish: boolean;
  minViewCount: number;
};

export const TriggerButton = ({
  canPublish,
  minViewCount
}: TriggerButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  const trigger = () => {
    startTransition(async () => {
      setStatus("Running daily agent...");
      try {
        const response = await fetch("/api/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            skipPosting: !canPublish,
            minViewCount
          })
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(
            `Failed with ${response.status}: ${message}`
          );
        }

        const payload = await response.json();
        if (!payload?.ok) {
          throw new Error(payload?.error ?? "Unknown error");
        }
        setStatus("Agent run complete.");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error);
        setStatus(`Run failed: ${message}`);
      }
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={trigger}
        disabled={isPending}
        style={{
          opacity: isPending ? 0.6 : 1,
          cursor: isPending ? "wait" : "pointer"
        }}
      >
        {isPending ? "Running..." : "Run Agent Now"}
      </button>
      {status ? (
        <div className="muted" style={{ marginTop: "0.75rem" }}>
          {status}
        </div>
      ) : null}
    </div>
  );
};
