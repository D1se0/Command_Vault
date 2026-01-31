import axios from "axios";

export type Workspace = { id: string; name: string; created_at: string; };
export type Section = { id: string; workspace_id: string; title: string; icon: string; position: number; created_at: string; };
export type CommandEntry = {
    id: string; section_id: string; title: string; description: string;
    language: string; command: string; position: number; created_at: string; updated_at: string;
};

export const api = axios.create({ baseURL: "" });

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
    remove: async (id: string) => (await api.delete(`/api/sections/${id}`)).data
};

export const CommandsAPI = {
    list: async (sectionId: string) =>
        (await api.get<CommandEntry[]>("/api/commands", { params: { sectionId } })).data,
    create: async (payload: { section_id: string; title: string; description?: string; language?: string; command: string; position?: number; }) =>
        (await api.post<CommandEntry>("/api/commands", payload)).data,
    update: async (id: string, payload: { title: string; description: string; language: string; command: string; position: number; }) =>
        (await api.put<CommandEntry>(`/api/commands/${id}`, payload)).data,
    remove: async (id: string) => (await api.delete(`/api/commands/${id}`)).data
};
