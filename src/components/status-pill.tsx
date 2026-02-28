export function StatusPill({
  status,
}: {
  status: "online" | "offline" | "running" | "stopped" | "unknown" | string;
}) {
  const styles =
    status === "online" || status === "running"
      ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/30"
      : status === "offline" || status === "stopped"
        ? "bg-rose-400/20 text-rose-300 border-rose-400/30"
        : "bg-amber-400/20 text-amber-200 border-amber-300/30";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
}
