import { useState } from "react";
import type { CommandEntry } from "../lib/api";

import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { Icons } from "./icons";

const LANGS = [
    { id: "bash", label: "Bash" },
    { id: "powershell", label: "PowerShell" },
    { id: "python", label: "Python" },
    { id: "csharp", label: "C#" },
    { id: "javascript", label: "JavaScript" },
    { id: "typescript", label: "TypeScript" },
    { id: "java", label: "Java" },
    { id: "html", label: "HTML" },
    { id: "sql", label: "SQL" }
];

export type CommandDraft = Pick<CommandEntry, "title" | "description" | "language" | "command" | "position">;

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
        position: props.initial?.position ?? 0
    }));

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                props.onSubmit({
                    ...draft,
                    title: draft.title.trim(),
                    language: draft.language.trim(),
                    command: draft.command.trim()
                });
            }}
            style={{ display: "grid", gap: 10 }}
        >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 110px", gap: 10 }}>
                <div>
                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Title</div>
                    <input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                </div>

                <div>
                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Language</div>
                    <select className="select" value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })}>
                        {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                    </select>
                </div>

                <div>
                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Order</div>
                    <input
                        className="input"
                        type="number"
                        value={draft.position}
                        onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) })}
                    />
                </div>
            </div>

            <div>
                <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Explanation</div>
                <textarea className="textarea" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>

            <div>
                <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>
                    Command / Snippet
                </div>

                <div
                    className="glass2 codeScope"
                    style={{
                        position: "relative",
                        minHeight: 160,
                        borderRadius: 12,
                        overflow: "hidden",
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
                            wordBreak: "break-word"
                        }}
                        codeTagProps={{
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
                        placeholder={"# paste a command or multi-line snippet\n"}
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
                            lineHeight: "inherit"
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
