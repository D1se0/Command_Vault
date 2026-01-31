import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Icons } from "./icons";

const LANG_MAP: Record<string, string> = {
    bash: "bash",
    sh: "bash",
    zsh: "bash",
    powershell: "powershell",
    ps1: "powershell",
    python: "python",
    csharp: "csharp",
    cs: "csharp",
    javascript: "javascript",
    js: "javascript",
    typescript: "typescript",
    ts: "typescript",
    java: "java",
    html: "markup",
    css: "css",
    sql: "sql"
};

export function TerminalBlock(props: { language: string; code: string }) {
    const lang = LANG_MAP[props.language.toLowerCase()] ?? props.language.toLowerCase();

    return (
        <div className="glass2" style={{ overflow: "hidden" }}>
            <div
                className="mono"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)"
                }}
            >
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                    {Icons.terminal}
                    <span>Terminal</span>
                </div>
                <span className="muted2">{lang}</span>
            </div>

            {/* 👇 Scope: todo lo que salga del SyntaxHighlighter irá dentro de este contenedor */}
            <div className="codeScope">
                <SyntaxHighlighter
                    language={lang}
                    style={oneDark}
                    customStyle={{
                        background: "transparent",
                        margin: 0,
                        padding: 12,
                        fontFamily: "var(--mono)",
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "rgba(235,240,245,0.95)"
                    }}
                    codeTagProps={{ style: { background: "transparent" } }}
                >
                    {props.code}
                </SyntaxHighlighter>
            </div>

            {/* ✅ OVERRIDE fuerte y aislado */}
            <style>{`
              /* Comentarios grises */
              .codeScope span.token[style*="font-style: italic"][style*="color: rgb(92"] {
                color: rgba(190, 200, 215, 0.85) !important;
                text-shadow: 0 0 0.35px rgba(0,0,0,0.4);
              }
        `}</style>
        </div>
    );
}
