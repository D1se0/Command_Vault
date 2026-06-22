import { motion } from "framer-motion";
import toast from "react-hot-toast";
import type { CommandEntry, CommandVersion } from "../lib/api";
import { CommandVersionsAPI, CommandsAPI } from "../lib/api";
import { TerminalBlock } from "./TerminalBlock";
import { RiskBadge } from "./RiskBadge";
import { Icons } from "./icons";

export function CommandCard(props: {
    command: CommandEntry;
    versions: CommandVersion[] | undefined;
    previewVersion: CommandVersion | null | undefined;
    onEdit: () => void;
    onDelete: () => void;
    onLoadVersions: () => void;
    onSetPreviewVersion: (v: CommandVersion | null) => void;
    onToggleFavorite: () => void;
    showSectionBadge?: boolean;
}) {
    const c = props.command;
    const activeCommand = props.previewVersion?.command ?? c.command;
    const activeLanguage = props.previewVersion?.language ?? c.language;

    async function copy() {
        await navigator.clipboard.writeText(activeCommand);
        toast.success("Comando copiado");
        try {
            await CommandsAPI.markUsed(c.id);
        } catch {
            /* non-critical */
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="glass2"
            style={{ padding: 14 }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 850, fontSize: 16 }}>{c.title}</div>
                        <RiskBadge level={c.risk_level} />
                        {props.showSectionBadge && c.section_title && (
                            <span className="muted2 mono" style={{ fontSize: 11 }}>
                                {c.section_title}
                            </span>
                        )}
                        {c.usage_count > 0 && (
                            <span className="muted2 mono" style={{ fontSize: 11 }}>
                                usado {c.usage_count}×
                            </span>
                        )}
                    </div>

                    <div className="muted" style={{ marginTop: 6, fontSize: 13, whiteSpace: "pre-wrap" }}>
                        {c.description || <span className="muted2">Sin explicación.</span>}
                    </div>

                    <div className="muted2 mono" style={{ marginTop: 10, fontSize: 12 }}>
                        lang: {c.language} · orden: {c.position} · actualizado: {new Date(c.updated_at).toLocaleString()}
                    </div>

                    {c.tags && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                            {c.tags.split(",").filter(Boolean).map((t) => (
                                <span
                                    key={t}
                                    className="mono muted2"
                                    style={{
                                        fontSize: 11,
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        border: "1px solid var(--border)"
                                    }}
                                >
                                    #{t}
                                </span>
                            ))}
                        </div>
                    )}

                    {c.reference_url && (
                        <a
                            href={c.reference_url}
                            target="_blank"
                            rel="noreferrer"
                            className="muted2 icon-title"
                            style={{ fontSize: 12, marginTop: 8 }}
                        >
                            {Icons.externalLink}
                            <span>Referencia externa</span>
                        </a>
                    )}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <button
                        className="btn"
                        title={c.is_favorite ? "Quitar de favoritos" : "Marcar como favorito"}
                        onClick={props.onToggleFavorite}
                        style={{
                            color: c.is_favorite ? "#e0af68" : undefined,
                            background: c.is_favorite ? "rgba(224,175,104,0.12)" : undefined
                        }}
                    >
                        <span style={{ display: "inline-flex", fill: c.is_favorite ? "currentColor" : "none" }}>
                            {Icons.star}
                        </span>
                    </button>
                    <button className="btn" onClick={props.onEdit} title="Editar">
                        {Icons.editAlt}
                    </button>
                    <button className="btn" onClick={props.onDelete} title="Eliminar">
                        {Icons.delete}
                    </button>
                    <button className="btn" onClick={props.onLoadVersions} title="Historial de versiones">
                        {Icons.history}
                    </button>
                    <button className="btn" onClick={copy} title="Copiar comando">
                        {Icons.copy}
                    </button>
                </div>
            </div>

            <div style={{ height: 12 }} />
            <TerminalBlock language={activeLanguage} code={activeCommand} />

            {props.versions && props.versions.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                    <button
                        className="btn"
                        disabled={!props.previewVersion}
                        onClick={async () => {
                            if (!props.previewVersion) return;
                            await CommandVersionsAPI.pin(c.id, props.previewVersion.id);
                            toast.success("Versión fijada");
                            props.onLoadVersions();
                        }}
                    >
                        {Icons.pin}
                        <span style={{ marginLeft: 6 }}>Fijar versión</span>
                    </button>

                    <button
                        className="btn"
                        disabled={!props.previewVersion}
                        onClick={async () => {
                            if (!props.previewVersion) return;
                            await CommandVersionsAPI.remove(props.previewVersion.id);
                            toast.success("Versión eliminada");
                            props.onLoadVersions();
                        }}
                    >
                        {Icons.delete}
                        <span style={{ marginLeft: 6 }}>Eliminar versión</span>
                    </button>

                    <select
                        className="select mono"
                        style={{ flex: 1, minWidth: 160 }}
                        value={props.previewVersion?.id ?? ""}
                        onChange={(e) => {
                            const v = props.versions?.find((x) => x.id === e.target.value);
                            props.onSetPreviewVersion(v ?? null);
                        }}
                    >
                        <option value="">Versión actual</option>
                        {props.versions.map((v) => (
                            <option key={v.id} value={v.id}>
                                v{v.version}{v.is_pinned ? " ⭐ fijada" : ""}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </motion.div>
    );
}
