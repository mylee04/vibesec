import { Fingerprint, LockKeyhole, Radar, Route, Server } from "lucide-react"

const scanSignals = [
  { label: "Security headers", icon: LockKeyhole },
  { label: "Public files", icon: Server },
  { label: "CORS and cookies", icon: Route },
  { label: "Provider hints", icon: Fingerprint },
] as const

export const EmptyState = () => (
  <section className="empty-report">
    <div className="empty-copy">
      <Radar size={24} aria-hidden="true" />
      <h2>Launch-readiness report appears here.</h2>
      <p>
        Passive checks only. No exploit payloads, credential guessing, or brute-force discovery.
      </p>
    </div>
    <div className="signal-grid">
      {scanSignals.map(({ label, icon: Icon }) => (
        <div className="signal-tile" key={label}>
          <Icon size={18} aria-hidden="true" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  </section>
)
