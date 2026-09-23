import { formatINR } from "../lib/engine";

interface CapMeterProps {
  raised: number;
  pending?: number;
  cap: number;
  capped?: boolean;
  compact?: boolean;
}

export function CapMeter({ raised, pending = 0, cap, capped = false, compact = false }: CapMeterProps) {
  const raisedPct = cap > 0 ? Math.min(100, (raised / cap) * 100) : 0;
  const pendingPct = cap > 0 ? Math.min(100 - raisedPct, (pending / cap) * 100) : 0;
  const headroom = Math.max(0, cap - raised - pending);

  return (
    <div>
      <div className={`flex items-center justify-between ${compact ? "text-xs" : "text-sm"} mb-1.5`}>
        <span className="font-medium text-neutral-700">
          {formatINR(raised)}
          {pending > 0 && <span className="text-gold-600"> + {formatINR(pending)}</span>}
          <span className="text-neutral-400"> / {formatINR(cap)}</span>
        </span>
        {capped ? (
          <span className="text-danger-600 font-semibold">Capped</span>
        ) : (
          <span className="text-neutral-500">{headroom > 0 ? `${formatINR(headroom)} left` : ""}</span>
        )}
      </div>
      <div className="h-2.5 w-full rounded-full bg-neutral-200 overflow-hidden flex">
        <div
          className={`h-full ${capped ? "bg-danger-400" : "bg-gold-400"} transition-all duration-300`}
          style={{ width: `${raisedPct}%` }}
        />
        {pendingPct > 0 && (
          <div
            className="h-full bg-gold-200 transition-all duration-300 [background-image:repeating-linear-gradient(135deg,rgba(122,94,26,0.35)_0,rgba(122,94,26,0.35)_2px,transparent_2px,transparent_6px)]"
            style={{ width: `${pendingPct}%` }}
          />
        )}
      </div>
    </div>
  );
}
