import { useState } from "react";
import type { CommandEntry, RiskLevel } from "../lib/api";

import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const LANGS = [
    { id: "bash", label: "Bash" },
    { id: "powershell", label: "PowerShell" },
    { id: "python", label: "Python" },
    { id: "csharp", label: "C#" },
    { id: "javascript", label: "JavaScript" },
    { id: "typescript", label: "TypeScript" },
    { id: "java", label: "Java" },
    { id: "php", label: "PHP" },
    { id: "html", label: "HTML" },
    { id: "xml", label: "XML" },
    { id: "json", label: "JSON" },
    { id: "sql", label: "SQL" },
    { id: "yaml", label: "YAML" },
    { id: "ruby", label: "Ruby" },
    { id: "go", label: "Go" },
    { id: "text", label: "Texto plano" }
];

export const RISK_LEVELS: { id: RiskLevel; label: string; color: string }[] = [
    { id: "info", label: "Info", color: "#7aa2f7" },
    { id: "low", label: "Bajo", color: "#9ece6a" },
    { id: "medium", label: "Medio", color: "#e0af68" },
    { id: "high", label: "Alto", color: "#ff9e64" },
    { id: "critical", label: "Crítico", color: "#f7768e" }
];

export type CommandDraft = Pick<
    CommandEntry,
    "title" | "description" | "language" | "command" | "position" | "tags" | "risk_level" | "reference_url"
>;

export function CommandEditor(props: {
    initial?: Partial<CommandDraft>;
    onSubmit: (draft: CommandDraft) => void;
    submitLabel: string;
}) {
    const [draft, setDraft] = useState<CommandDraft>(() => ({
        title: props.initial?.title ?? "",
        description: props.initial?.description ?? "",
        language: props.initial?.language ?? "bash",
        command: props.initial?.command ?? "",
        tags: props.initial?.tags ?? "",
        position: props.initial?.position ?? 0,
        risk_level: props.initial?.risk_level ?? "info",
        reference_url: props.initial?.reference_url ?? ""
    }));

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                props.onSubmit({
                    ...draft,
                    title: draft.title.trim(),
                    language: draft.language.trim(),
                    command: draft.command.trim(),
                    tags: draft.tags?.trim() || "",
                    reference_url: draft.reference_url?.trim() || ""
                });
            }}
            style={{ display: "grid", gap: 10 }}
        >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 90px", gap: 10 }}>
                <div>
                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Título</div>
                    <input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                </div>

                <div>
                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Lenguaje</div>
                    <select className="select" value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })}>
                        {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                    </select>
                </div>

                <div>
                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Orden</div>
                    <input
                        className="input"
                        type="number"
                        value={draft.position}
                        onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) })}
                    />
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>
                        Tags (separados por coma)
                    </div>
                    <input
                        className="input mono"
                        placeholder="linux, privesc, sudo"
                        value={draft.tags}
                        onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                    />
                </div>

                <div>
                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>
                        Nivel de riesgo
                    </div>
                    <select
                        className="select"
                        value={draft.risk_level}
                        onChange={(e) => setDraft({ ...draft, risk_level: e.target.value as RiskLevel })}
                    >
                        {RISK_LEVELS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>
                    URL de referencia (opcional)
                </div>
                <input
                    className="input mono"
                    placeholder="https://owasp.org/..."
                    value={draft.reference_url}
                    onChange={(e) => setDraft({ ...draft, reference_url: e.target.value })}
                />
            </div>

            <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Explicación</div>
            <textarea
                className="textarea"
                style={{ overflow: "auto" }}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />

            <div>
                <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>
                    Comando / Snippet
                </div>

                <div
                    className="glass2 codeScope"
                    style={{
                        position: "relative",
                        height: 240,
                        maxHeight: 240,
                        borderRadius: 12,
                        overflow: "auto",
                        fontFamily: "var(--mono)",
                        fontSize: 13,
                        lineHeight: 1.6
                    }}
                >
                    {/* Vista con colores */}
                    <SyntaxHighlighter
                        language={draft.language}
                        style={oneDark}
                        customStyle={{
                            margin: 0,
                            background: "transparent",
                            padding: 12,
                            pointerEvents: "none",
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                            overflow: "visible"
                        }}
                        codeTagProps={{
                            style: {
                                background: "transparent",
                                fontFamily: "inherit",
                                fontSize: "inherit",
                                lineHeight: "inherit",
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                                wordBreak: "break-word"
                            }
                        }}
                        preTagProps={{
                            style: {
                                background: "transparent"
                            }
                        }}
                    >
                        {draft.command || " "}
                    </SyntaxHighlighter>

                    {/* Textarea real */}
                    <textarea
                        value={draft.command}
                        onChange={(e) =>
                            setDraft({ ...draft, command: e.target.value })
                        }
                        spellCheck={false}
                        placeholder={"# pega un comando o snippet multilínea\n"}
                        className="textarea mono"
                        style={{
                            position: "absolute",
                            inset: 0,
                            resize: "none",
                            background: "transparent",
                            color: "transparent",
                            caretColor: "#fff",
                            border: "none",
                            outline: "none",
                            padding: 12,
                            fontFamily: "inherit",
                            fontSize: "inherit",
                            lineHeight: "inherit",
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                            overflow: "auto"
                        }}
                    />
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button className="btn" type="submit">{props.submitLabel}</button>
            </div>
        </form>
    );
}
