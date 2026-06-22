import { RISK_LEVELS } from "./CommandEditor";
import type { RiskLevel } from "../lib/api";

export function RiskBadge(props: { level: RiskLevel }) {
    const meta = RISK_LEVELS.find((r) => r.id === props.level) ?? RISK_LEVELS[0];

    return (
        <span
            className="mono"
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 9px",
                borderRadius: 999,
                color: meta.color,
                border: `1px solid ${meta.color}55`,
                background: `${meta.color}14`,
                textTransform: "uppercase",
                letterSpacing: 0.4
            }}
        >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: meta.color, display: "inline-block" }} />
            {meta.label}
        </span>
    );
}
