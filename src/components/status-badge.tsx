import { Badge } from "./ui";
import { statusColor, statusLabel } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={statusColor(status)}>{statusLabel(status)}</Badge>;
}
