export type Workspace = {
    id: string;
    name: string;
    created_at: string;
};

export type Section = {
    id: string;
    workspace_id: string;
    title: string;
    icon: string; // Nerd Font unicode
    position: number;
    created_at: string;
};

export type CommandEntry = {
    id: string;
    section_id: string;
    title: string;
    description: string;
    language: string; // bash, powershell, python, csharp, js, html...
    command: string;
    position: number;
    created_at: string;
    updated_at: string;
};
