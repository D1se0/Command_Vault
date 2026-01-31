declare module "react-syntax-highlighter/dist/esm/prism" {
    import * as React from "react";

    const SyntaxHighlighter: React.ComponentType<any>;
    export default SyntaxHighlighter;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism" {
    export const oneDark: Record<string, unknown>;
    export const dracula: Record<string, unknown>;
}
