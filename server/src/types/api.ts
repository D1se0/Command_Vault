export type Workspace = {
    id: string;
    name: string;
    created_at: string;
};

export type Section = {
    id: string;
    workspace_id: string;
    title: string;
    icon: string; // key into client Icons map
    position: number;
    created_at: string;
};

export type RiskLevel = "info" | "low" | "medium" | "high" | "critical";

export type CommandEntry = {
    id: string;
    section_id: string;
    title: string;
    description: string;
    language: string; // bash, powershell, python, csharp, js, html...
    command: string;
    position: number;
    tags: string;
    is_favorite: 0 | 1;
    usage_count: number;
    risk_level: RiskLevel;
    reference_url: string;
    created_at: string;
    updated_at: string;
};

export type CommandVersion = {
    id: string;
    command_id: string;
    version: number;
    title: string;
    description: string;
    language: string;
    command: string;
    tags: string;
    is_pinned: 0 | 1;
    created_at: string;
};
