import { Radio } from 'lucide-react'

interface Props {
  isConnected?: boolean
  latencyMs?: number | null
}

export function DataSourceBadge({ isConnected = true, latencyMs }: Props) {
  return (
    <div className="inline-flex items-center gap-2 bg-zinc-50 border border-zinc-200/90 text-zinc-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-xs select-none">
      <span className="relative flex h-2 w-2">
        {isConnected ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
        )}
      </span>
      <span className="flex items-center gap-1.5 text-zinc-700 text-[11px] font-medium tracking-tight">
        <Radio className="w-3 h-3 text-zinc-400" />
        <span>APSRTC Live Telemetry</span>
      </span>
      {latencyMs != null && (
        <>
          <span className="text-zinc-300">·</span>
          <span className="text-[10px] text-zinc-500 font-mono">{latencyMs}ms</span>
        </>
      )}
    </div>
  )
}
