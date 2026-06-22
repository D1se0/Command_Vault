import axios from "axios";

export type Workspace = {
    id: string;
    name: string;
    created_at: string;
    section_count?: number;
    command_count?: number;
};

export type Section = {
    id: string;
    workspace_id: string;
    title: string;
    icon: string;
    position: number;
    created_at: string;
    command_count?: number;
};

export type RiskLevel = "info" | "low" | "medium" | "high" | "critical";

export type CommandEntry = {
    id: string;
    section_id: string;
    title: string;
    description: string;
    language: string;
    command: string;
    position: number;
    tags: string;
    is_favorite: 0 | 1;
    usage_count: number;
    risk_level: RiskLevel;
    reference_url: string;
    created_at: string;
    updated_at: string;
    section_title?: string;
    section_icon?: string;
    workspace_id?: string;
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

export const api = axios.create({ baseURL: "", withCredentials: true });

// Redirect to a "locked" state on 401 by emitting a custom event the App listens to.
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error?.response?.status === 401) {
            window.dispatchEvent(new CustomEvent("cv:unauthorized"));
        }
        return Promise.reject(error);
    }
);

export const WorkspacesAPI = {
    list: async () => (await api.get<Workspace[]>("/api/workspaces")).data,
    create: async (name: string) => (await api.post<Workspace>("/api/workspaces", { name })).data,
    update: async (id: string, name: string) => (await api.put<Workspace>(`/api/workspaces/${id}`, { name })).data,
    remove: async (id: string) => (await api.delete(`/api/workspaces/${id}`)).data
};

export const SectionsAPI = {
    list: async (workspaceId: string) =>
        (await api.get<Section[]>("/api/sections", { params: { workspaceId } })).data,
    create: async (payload: { workspace_id: string; title: string; icon?: string; position?: number; }) =>
        (await api.post<Section>("/api/sections", payload)).data,
    update: async (id: string, payload: { title: string; icon: string; position: number; }) =>
        (await api.put<Section>(`/api/sections/${id}`, payload)).data,
    reorder: async (order: { id: string; position: number }[]) =>
        (await api.post("/api/sections/reorder", { order })).data,
    remove: async (id: string) => (await api.delete(`/api/sections/${id}`)).data
};

export type CommandPayload = {
    section_id?: string;
    title: string;
    description?: string;
    language?: string;
    command: string;
    position?: number;
    tags?: string;
    risk_level?: RiskLevel;
    reference_url?: string;
};

export const CommandsAPI = {
    list: async (sectionId: string) =>
        (await api.get<CommandEntry[]>("/api/commands", { params: { sectionId } })).data,
    searchGlobal: async (q: string, workspaceId?: string) =>
        (await api.get<CommandEntry[]>("/api/commands/search/global", { params: { q, workspaceId } })).data,
    favorites: async (workspaceId?: string) =>
        (await api.get<CommandEntry[]>("/api/commands/favorites", { params: { workspaceId } })).data,
    create: async (payload: CommandPayload) =>
        (await api.post<CommandEntry>("/api/commands", payload)).data,
    update: async (id: string, payload: CommandPayload) =>
        (await api.put<CommandEntry>(`/api/commands/${id}`, payload)).data,
    reorder: async (order: { id: string; position: number }[]) =>
        (await api.post("/api/commands/reorder", { order })).data,
    toggleFavorite: async (id: string, favorite: boolean) =>
        (await api.post<CommandEntry>(`/api/commands/${id}/favorite`, { favorite })).data,
    markUsed: async (id: string) => api.post(`/api/commands/${id}/use`),
    remove: async (id: string) => (await api.delete(`/api/commands/${id}`)).data
};

export const CommandVersionsAPI = {
    list: async (commandId: string) =>
        (await api.get<CommandVersion[]>(`/api/commands/${commandId}/versions`)).data,
    pin: async (commandId: string, versionId: string) =>
        api.post(`/api/commands/${commandId}/pin/${versionId}`),
    unpin: async (commandId: string) =>
        api.post(`/api/commands/${commandId}/unpin`),
    remove: async (versionId: string) =>
        api.delete(`/api/commands/versions/${versionId}`)
};

export const DataAPI = {
    exportAll: async () => {
        const res = await api.get("/api/data/export", { responseType: "blob" });
        return res.data as Blob;
    },
    exportSectionMarkdown: async (sectionId: string) => {
        const res = await api.get(`/api/data/export/section/${sectionId}/markdown`, { responseType: "blob" });
        return res.data as Blob;
    },
    importAll: async (payload: any, targetWorkspaceName?: string) =>
        (await api.post("/api/data/import", { ...payload, target_workspace_name: targetWorkspaceName })).data
};

export type AuthStatus = {
    auth_enabled: boolean;
    authenticated: boolean;
    has_password: boolean;
};

export const AuthAPI = {
    status: async () => (await api.get<AuthStatus>("/api/auth/status")).data,
    login: async (password: string) => (await api.post("/api/auth/login", { password })).data,
    logout: async () => (await api.post("/api/auth/logout")).data,
    configure: async (payload: { enable: boolean; new_password?: string; current_password?: string }) =>
        (await api.post("/api/auth/configure", payload)).data
};
