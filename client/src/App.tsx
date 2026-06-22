import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import {
    CommandsAPI,
    CommandVersionsAPI,
    CommandEntry,
    CommandVersion,
    SectionsAPI,
    Section,
    WorkspacesAPI,
    Workspace,
    AuthAPI,
    DataAPI
} from "./lib/api";
import { Modal } from "./components/Modal";
import { CommandEditor, CommandDraft } from "./components/CommandEditor";
import { CommandCard } from "./components/CommandCard";
import { Login } from "./components/Login";
import { SettingsPanel } from "./components/SettingsPanel";

import { Icons } from "./components/icons";
type IconKey = keyof typeof Icons;

function useEsc(handler: () => void) {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") handler(); };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [handler]);
}

type ViewMode = "section" | "search" | "favorites";

export default function App() {
    // ---- Auth gate ----
    const [authChecked, setAuthChecked] = useState(false);
    const [needsLogin, setNeedsLogin] = useState(false);

    // ---- Core data ----
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [commands, setCommands] = useState<CommandEntry[]>([]);

    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
    const [activeSectionId, setActiveSectionId] = useState<string>("");
    const [viewMode, setViewMode] = useState<ViewMode>("section");

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState<CommandEntry[]>([]);
    const [favoriteResults, setFavoriteResults] = useState<CommandEntry[]>([]);
    const [activeTags, setActiveTags] = useState<string[]>([]);
    const [riskFilter, setRiskFilter] = useState<string>("");

    const [versions, setVersions] = useState<Record<string, CommandVersion[]>>({});
    const [previewVersion, setPreviewVersion] = useState<Record<string, CommandVersion | null>>({});

    // Modals
    const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
    const [sectionModalOpen, setSectionModalOpen] = useState(false);
    const [commandModalOpen, setCommandModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);

    const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [editingCommand, setEditingCommand] = useState<CommandEntry | null>(null);

    const [sidebarOpen, setSidebarOpen] = useState(true);

    const activeWorkspace = useMemo(
        () => workspaces.find(w => w.id === activeWorkspaceId) ?? null,
        [workspaces, activeWorkspaceId]
    );
    const activeSection = useMemo(
        () => sections.find(s => s.id === activeSectionId) ?? null,
        [sections, activeSectionId]
    );

    const baseList: CommandEntry[] =
        viewMode === "search" ? searchResults :
        viewMode === "favorites" ? favoriteResults :
        commands;

    const availableTags = useMemo(() => {
        const set = new Set<string>();
        baseList.forEach((c) => {
            c.tags?.split(",").map(t => t.trim()).filter(Boolean).forEach(t => set.add(t));
        });
        return Array.from(set).sort();
    }, [baseList]);

    const filteredCommands = useMemo(() => {
        let result = baseList;

        if (viewMode === "section" && search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((c) =>
                c.title.toLowerCase().includes(q) ||
                c.description?.toLowerCase().includes(q) ||
                c.command.toLowerCase().includes(q) ||
                c.language.toLowerCase().includes(q) ||
                c.tags?.toLowerCase().includes(q)
            );
        }

        if (activeTags.length > 0) {
            result = result.filter((c) => {
                const tags = c.tags?.split(",").map(t => t.trim().toLowerCase()) ?? [];
                return activeTags.every(tag => tags.includes(tag));
            });
        }

        if (riskFilter) {
            result = result.filter((c) => c.risk_level === riskFilter);
        }

        return result;
    }, [baseList, search, activeTags, riskFilter, viewMode]);

    useEsc(() => {
        setWorkspaceModalOpen(false);
        setSectionModalOpen(false);
        setCommandModalOpen(false);
        setSettingsModalOpen(false);
    });

    // ---- Auth bootstrap ----
    useEffect(() => {
        (async () => {
            try {
                const status = await AuthAPI.status();
                setNeedsLogin(status.auth_enabled && !status.authenticated);
            } catch {
                setNeedsLogin(false);
            } finally {
                setAuthChecked(true);
            }
        })();

        function onUnauthorized() {
            setNeedsLogin(true);
        }
        window.addEventListener("cv:unauthorized", onUnauthorized);
        return () => window.removeEventListener("cv:unauthorized", onUnauthorized);
    }, []);

    async function refreshWorkspaces() {
        const ws = await WorkspacesAPI.list();
        setWorkspaces(ws);
        if (!activeWorkspaceId && ws[0]) setActiveWorkspaceId(ws[0].id);
    }

    async function refreshSections(workspaceId: string) {
        const s = await SectionsAPI.list(workspaceId);
        setSections(s);
        if (!activeSectionId && s[0]) setActiveSectionId(s[0].id);
        if (activeSectionId && !s.some(x => x.id === activeSectionId)) setActiveSectionId(s[0]?.id ?? "");
    }

    async function refreshCommands(sectionId: string) {
        if (!sectionId) { setCommands([]); return; }
        const c = await CommandsAPI.list(sectionId);
        setCommands(c);
    }

    useEffect(() => {
        if (!authChecked || needsLogin) return;
        (async () => {
            try {
                setLoading(true);
                await refreshWorkspaces();
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authChecked, needsLogin]);

    useEffect(() => {
        if (!activeWorkspaceId) return;
        refreshSections(activeWorkspaceId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWorkspaceId]);

    useEffect(() => {
        if (viewMode !== "section") return;
        refreshCommands(activeSectionId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSectionId, viewMode]);

    useEffect(() => {
        baseList.forEach((c) => { loadVersions(c.id); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [commands, searchResults, favoriteResults]);

    // ---- Global search (debounced) ----
    useEffect(() => {
        if (viewMode !== "search") return;
        const handle = setTimeout(async () => {
            try {
                const res = await CommandsAPI.searchGlobal(search, activeWorkspaceId);
                setSearchResults(res);
            } catch {
                /* ignore */
            }
        }, 220);
        return () => clearTimeout(handle);
    }, [search, viewMode, activeWorkspaceId]);

    async function openGlobalSearch() {
        setViewMode("search");
        setActiveTags([]);
        setRiskFilter("");
        try {
            const res = await CommandsAPI.searchGlobal(search, activeWorkspaceId);
            setSearchResults(res);
        } catch {
            /* ignore */
        }
    }

    async function openFavorites() {
        setViewMode("favorites");
        setActiveTags([]);
        setRiskFilter("");
        try {
            const res = await CommandsAPI.favorites(activeWorkspaceId);
            setFavoriteResults(res);
        } catch {
            /* ignore */
        }
    }

    function backToSection() {
        setViewMode("section");
        setSearch("");
        setActiveTags([]);
        setRiskFilter("");
    }

    // --------- CRUD handlers ---------

    async function createOrUpdateWorkspace(name: string) {
        try {
            if (editingWorkspace) {
                await WorkspacesAPI.update(editingWorkspace.id, name);
                toast.success("Workspace actualizado");
            } else {
                const created = await WorkspacesAPI.create(name);
                setActiveWorkspaceId(created.id);
                toast.success("Workspace creado");
            }
            setWorkspaceModalOpen(false);
            setEditingWorkspace(null);
            await refreshWorkspaces();
        } catch (e: any) {
            toast.error(`Error en workspace: ${e?.response?.data?.error ?? e?.message ?? "error desconocido"}`);
        }
    }

    async function deleteWorkspace(id: string) {
        if (!confirm("¿Eliminar workspace? También se eliminarán sus secciones y comandos.")) return;
        try {
            await WorkspacesAPI.remove(id);
            toast.success("Workspace eliminado");
            setActiveWorkspaceId("");
            setActiveSectionId("");
            await refreshWorkspaces();
        } catch (e: any) {
            toast.error(`Error al eliminar: ${e?.response?.data?.error ?? e?.message ?? "error desconocido"}`);
        }
    }

    async function createOrUpdateSection(payload: { title: string; icon: string; position: number }) {
        if (!activeWorkspaceId) return;
        try {
            if (editingSection) {
                await SectionsAPI.update(editingSection.id, payload);
                toast.success("Sección actualizada");
            } else {
                const created = await SectionsAPI.create({
                    workspace_id: activeWorkspaceId,
                    title: payload.title,
                    icon: payload.icon,
                    position: payload.position
                });
                setActiveSectionId(created.id);
                setViewMode("section");
                toast.success("Sección creada");
            }
            setSectionModalOpen(false);
            setEditingSection(null);
            await refreshSections(activeWorkspaceId);
        } catch (e: any) {
            toast.error(`Error en sección: ${e?.response?.data?.error ?? e?.message ?? "error desconocido"}`);
        }
    }

    async function moveSectionPosition(section: Section, direction: -1 | 1) {
        const ordered = [...sections].sort((a, b) => a.position - b.position);
        const idx = ordered.findIndex((s) => s.id === section.id);
        const swapIdx = idx + direction;
        if (swapIdx < 0 || swapIdx >= ordered.length) return;

        const a = ordered[idx];
        const b = ordered[swapIdx];

        try {
            await SectionsAPI.reorder([
                { id: a.id, position: b.position },
                { id: b.id, position: a.position }
            ]);
            await refreshSections(activeWorkspaceId);
        } catch {
            toast.error("No se pudo reordenar la sección");
        }
    }

    async function loadVersions(commandId: string) {
        const data = await CommandVersionsAPI.list(commandId);
        setVersions(v => ({ ...v, [commandId]: data }));
        const pinned = data.find(v => v.is_pinned);
        setPreviewVersion(p => ({ ...p, [commandId]: pinned ?? null }));
    }

    async function deleteSection(id: string) {
        if (!confirm("¿Eliminar sección? También se eliminarán sus comandos.")) return;
        try {
            await SectionsAPI.remove(id);
            toast.success("Sección eliminada");
            if (id === activeSectionId) setActiveSectionId("");
            await refreshSections(activeWorkspaceId);
        } catch (e: any) {
            toast.error(`Error al eliminar: ${e?.response?.data?.error ?? e?.message ?? "error desconocido"}`);
        }
    }

    async function exportSectionMarkdown(section: Section) {
        try {
            const blob = await DataAPI.exportSectionMarkdown(section.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${section.title.replace(/[^a-z0-9]+/gi, "-")}.md`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("Cheatsheet Markdown exportado");
        } catch {
            toast.error("No se pudo exportar la sección");
        }
    }

    async function createOrUpdateCommand(draft: CommandDraft) {
        if (!activeSectionId && !editingCommand) return;
        try {
            if (editingCommand) {
                await CommandsAPI.update(editingCommand.id, draft);
                toast.success("Comando actualizado");
            } else {
                await CommandsAPI.create({ section_id: activeSectionId, ...draft });
                toast.success("Comando guardado");
            }
            setCommandModalOpen(false);
            setEditingCommand(null);
            await refreshCurrentView();
        } catch (e: any) {
            toast.error(`Error en comando: ${e?.response?.data?.error ?? e?.message ?? "error desconocido"}`);
        }
    }

    async function refreshCurrentView() {
        if (viewMode === "section") await refreshCommands(activeSectionId);
        else if (viewMode === "favorites") await openFavorites();
        else if (viewMode === "search") await openGlobalSearch();
    }

    async function deleteCommand(id: string) {
        if (!confirm("¿Eliminar comando?")) return;
        try {
            await CommandsAPI.remove(id);
            toast.success("Comando eliminado");
            await refreshCurrentView();
        } catch (e: any) {
            toast.error(`Error al eliminar: ${e?.response?.data?.error ?? e?.message ?? "error desconocido"}`);
        }
    }

    async function toggleFavorite(c: CommandEntry) {
        try {
            await CommandsAPI.toggleFavorite(c.id, !c.is_favorite);
            await refreshCurrentView();
        } catch {
            toast.error("No se pudo actualizar el favorito");
        }
    }

    // --------- UI ---------

    if (!authChecked) {
        return (
            <div style={{ padding: 24 }}>
                <div className="glass" style={{ padding: 18, maxWidth: 520 }}>
                    <div className="icon-title">{Icons.vault}<span>Command Vault</span></div>
                    <div className="muted" style={{ marginTop: 8 }}>Comprobando sesión…</div>
                </div>
            </div>
        );
    }

    if (needsLogin) {
        return <Login onSuccess={() => setNeedsLogin(false)} />;
    }

    if (loading) {
        return (
            <div style={{ padding: 24 }}>
                <div className="glass" style={{ padding: 18, maxWidth: 520 }}>
                    <div className="icon-title">{Icons.vault}<span>Command Vault</span></div>
                    <div className="muted" style={{ marginTop: 8 }}>Cargando workspace…</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: "100vh", display: "grid", gridTemplateColumns: sidebarOpen ? "320px 1fr" : "0px 1fr", transition: "grid-template-columns 160ms ease" }}>
            <Toaster
                position="bottom-right"
                toastOptions={{
                    duration: 2600,
                    style: {
                        background: "rgba(20,20,22,0.75)",
                        color: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        backdropFilter: "blur(14px)",
                        WebkitBackdropFilter: "blur(14px)",
                        borderRadius: "14px",
                        fontFamily: "var(--sans)"
                    }
                }}
            />

            {/* Sidebar */}
            <div style={{ padding: sidebarOpen ? 14 : 0, overflow: "hidden" }}>
                <div className="glass" style={{ height: "calc(100vh - 28px)", padding: 14, display: "grid", gridTemplateRows: "auto auto auto 1fr auto", gap: 12, width: 292 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                                <div className="icon-title" style={{ fontSize: 18, fontWeight: 700 }}>
                                    {Icons.vault}
                                    <span>Command Vault</span>
                                </div>
                                <div className="muted2" style={{ marginTop: 4, fontSize: 12 }}>
                                    Workspace de pentesting & red team
                                </div>
                            </div>
                            <button className="btn" onClick={() => setSettingsModalOpen(true)} title="Ajustes">
                                {Icons.settings}
                            </button>
                        </div>
                    </div>

                    {/* Quick actions: favorites + global search */}
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            className="btn"
                            onClick={openFavorites}
                            style={{
                                flex: 1, justifyContent: "center",
                                border: viewMode === "favorites" ? "1px solid rgba(224,175,104,0.5)" : undefined,
                                background: viewMode === "favorites" ? "rgba(224,175,104,0.10)" : undefined
                            }}
                        >
                            {Icons.star}
                            <span style={{ marginLeft: 6 }}>Favoritos</span>
                        </button>
                        <button
                            className="btn"
                            onClick={openGlobalSearch}
                            style={{
                                flex: 1, justifyContent: "center",
                                border: viewMode === "search" ? "1px solid rgba(255,255,255,0.35)" : undefined,
                                background: viewMode === "search" ? "rgba(255,255,255,0.08)" : undefined
                            }}
                        >
                            {Icons.search}
                            <span style={{ marginLeft: 6 }}>Buscar todo</span>
                        </button>
                    </div>

                    {/* Workspace selector */}
                    <div className="glass2" style={{ padding: 12 }}>
                        <div className="muted2" style={{ fontSize: 12, marginBottom: 8 }}>Workspace</div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <select
                                className="select"
                                value={activeWorkspaceId}
                                onChange={(e) => { setActiveWorkspaceId(e.target.value); setActiveSectionId(""); backToSection(); }}
                            >
                                {workspaces.map(w => (
                                    <option key={w.id} value={w.id}>
                                        {w.name} {w.command_count !== undefined ? `(${w.command_count})` : ""}
                                    </option>
                                ))}
                            </select>
                            <button
                                className="btn"
                                onClick={() => { setEditingWorkspace(null); setWorkspaceModalOpen(true); }}
                                title="Nuevo workspace"
                            >
                                {Icons.add}
                            </button>
                        </div>

                        {activeWorkspace && (
                            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                                <button
                                    className="btn"
                                    onClick={() => { setEditingWorkspace(activeWorkspace); setWorkspaceModalOpen(true); }}
                                >
                                    {Icons.edit}
                                    <span style={{ marginLeft: 6 }}>Renombrar</span>
                                </button>

                                <button className="btn" onClick={() => deleteWorkspace(activeWorkspace.id)}>
                                    {Icons.delete}
                                    <span style={{ marginLeft: 6 }}>Eliminar</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sections */}
                    <div style={{ overflow: "auto", paddingRight: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <div className="muted2" style={{ fontSize: 12 }}>Secciones</div>
                            <button
                                className="btn"
                                onClick={() => { setEditingSection(null); setSectionModalOpen(true); }}
                                disabled={!activeWorkspaceId}
                            >
                                {Icons.add} Añadir
                            </button>
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                            {[...sections].sort((a, b) => a.position - b.position).map((s, idx, arr) => {
                                const active = viewMode === "section" && s.id === activeSectionId;
                                return (
                                    <div
                                        key={s.id}
                                        className="glass2"
                                        style={{
                                            padding: 12,
                                            border: active ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.10)",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => { setActiveSectionId(s.id); backToSection(); }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div className="icon-title" style={{ fontWeight: 700, fontSize: 13 }}>
                                                    {Icons[s.icon as IconKey] ?? Icons.folder}
                                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {s.title}
                                                    </span>
                                                </div>
                                                {s.command_count !== undefined && (
                                                    <div className="muted2" style={{ fontSize: 11, marginTop: 3 }}>
                                                        {s.command_count} comando{s.command_count === 1 ? "" : "s"}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <button
                                                    className="btn"
                                                    onClick={(e) => { e.stopPropagation(); moveSectionPosition(s, -1); }}
                                                    disabled={idx === 0}
                                                    title="Subir"
                                                    style={{ padding: 6 }}
                                                >
                                                    {Icons.chevronUp}
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={(e) => { e.stopPropagation(); moveSectionPosition(s, 1); }}
                                                    disabled={idx === arr.length - 1}
                                                    title="Bajar"
                                                    style={{ padding: 6 }}
                                                >
                                                    {Icons.chevronDown}
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={(e) => { e.stopPropagation(); exportSectionMarkdown(s); }}
                                                    title="Exportar a Markdown"
                                                    style={{ padding: 6 }}
                                                >
                                                    {Icons.download}
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={(e) => { e.stopPropagation(); setEditingSection(s); setSectionModalOpen(true); }}
                                                    title="Editar sección"
                                                    style={{ padding: 6 }}
                                                >
                                                    {Icons.edit}
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={(e) => { e.stopPropagation(); deleteSection(s.id); }}
                                                    title="Eliminar sección"
                                                    style={{ padding: 6 }}
                                                >
                                                    {Icons.delete}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {sections.length === 0 && (
                                <div className="glass2" style={{ padding: 14 }}>
                                    <div style={{ fontWeight: 700 }}>Sin secciones todavía</div>
                                    <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                                        Crea secciones como "Enumeración SUID", "Active Directory", "Fuzzing Web", etc.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer hint */}
                    <div className="muted2" style={{ fontSize: 12 }}>
                        Almacenado localmente en <span className="mono">server/data/*.db</span>
                    </div>
                </div>
            </div>

            {/* Main */}
            <div style={{ padding: 14 }}>
                <div className="glass" style={{ height: "calc(100vh - 28px)", padding: 16, overflow: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                            <button
                                className="btn"
                                onClick={() => setSidebarOpen((v) => !v)}
                                title={sidebarOpen ? "Ocultar panel" : "Mostrar panel"}
                            >
                                {sidebarOpen ? Icons.panelClose : Icons.panelOpen}
                            </button>
                            <div>
                                <div className="muted2" style={{ fontSize: 12 }}>
                                    {viewMode === "search" ? "Búsqueda global" : viewMode === "favorites" ? "Comandos favoritos" : "Sección activa"}
                                </div>
                                <div className="icon-title" style={{ fontSize: 22, fontWeight: 850, marginTop: 6 }}>
                                    {viewMode === "search" && <>{Icons.search}<span>Resultados de búsqueda</span></>}
                                    {viewMode === "favorites" && <>{Icons.star}<span>Favoritos</span></>}
                                    {viewMode === "section" && (
                                        activeSection ? (
                                            <>
                                                {Icons[activeSection.icon as IconKey] ?? Icons.folder}
                                                <span>{activeSection.title}</span>
                                            </>
                                        ) : "Selecciona una sección"
                                    )}
                                </div>
                                <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                                    {viewMode === "search"
                                        ? "Busca en todos los comandos del workspace, sin importar la sección."
                                        : "Guarda comandos con explicación. El resaltado de sintaxis se adapta al lenguaje."}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            {viewMode !== "section" && (
                                <button className="btn" onClick={backToSection}>
                                    {Icons.back}
                                    <span style={{ marginLeft: 6 }}>Volver a la sección</span>
                                </button>
                            )}
                            <button
                                className="btn"
                                onClick={() => { setEditingCommand(null); setCommandModalOpen(true); }}
                                disabled={viewMode === "section" ? !activeSectionId : sections.length === 0}
                            >
                                {Icons.add} Nuevo comando
                            </button>
                        </div>
                    </div>

                    <div style={{ height: 14 }} />

                    <div className="glass2" style={{ padding: 12, marginBottom: 14 }}>
                        <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>
                            {viewMode === "search" ? "Buscar en todo el vault" : "Buscar en esta sección"}
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            <input
                                className="input mono"
                                placeholder="nmap, sudo, enum, payload, sqli..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ flex: 1 }}
                            />

                            {search && (
                                <button className="btn" onClick={() => setSearch("")}>
                                    {Icons.close}
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14, alignItems: "center" }}>
                        {availableTags.map(tag => {
                            const active = activeTags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    className="btn"
                                    onClick={() =>
                                        setActiveTags(active
                                            ? activeTags.filter(t => t !== tag)
                                            : [...activeTags, tag]
                                        )
                                    }
                                    style={{
                                        padding: "4px 10px",
                                        fontSize: 12,
                                        border: active ? "1px solid rgba(255,255,255,0.4)" : "1px solid var(--border)",
                                        background: active ? "rgba(255,255,255,0.08)" : "transparent"
                                    }}
                                >
                                    #{tag}
                                </button>
                            );
                        })}

                        <select
                            className="select"
                            value={riskFilter}
                            onChange={(e) => setRiskFilter(e.target.value)}
                            style={{ width: "auto", fontSize: 12, padding: "6px 10px" }}
                        >
                            <option value="">Todos los riesgos</option>
                            <option value="info">Info</option>
                            <option value="low">Bajo</option>
                            <option value="medium">Medio</option>
                            <option value="high">Alto</option>
                            <option value="critical">Crítico</option>
                        </select>

                        {(activeTags.length > 0 || riskFilter) && (
                            <button
                                className="btn"
                                onClick={() => { setActiveTags([]); setRiskFilter(""); }}
                                style={{ fontSize: 12 }}
                            >
                                {Icons.filterOff}
                                <span style={{ marginLeft: 6 }}>Limpiar filtros</span>
                            </button>
                        )}

                        <div className="muted2" style={{ fontSize: 12, marginLeft: "auto" }}>
                            {filteredCommands.length} comando{filteredCommands.length === 1 ? "" : "s"}
                        </div>
                    </div>

                    <div style={{ display: "grid", gap: 14 }}>
                        {filteredCommands.map((c) => (
                            <CommandCard
                                key={c.id}
                                command={c}
                                versions={versions[c.id]}
                                previewVersion={previewVersion[c.id]}
                                showSectionBadge={viewMode !== "section"}
                                onEdit={() => { setEditingCommand(c); setCommandModalOpen(true); }}
                                onDelete={() => deleteCommand(c.id)}
                                onLoadVersions={() => loadVersions(c.id)}
                                onSetPreviewVersion={(v) => setPreviewVersion(p => ({ ...p, [c.id]: v }))}
                                onToggleFavorite={() => toggleFavorite(c)}
                            />
                        ))}

                        {filteredCommands.length === 0 && search && viewMode === "section" && (
                            <div className="glass2" style={{ padding: 16 }}>
                                <div style={{ fontWeight: 800, fontSize: 15 }}>Sin resultados</div>
                                <div className="muted" style={{ marginTop: 6 }}>
                                    Ningún comando coincide con <span className="mono">"{search}"</span>
                                </div>
                            </div>
                        )}

                        {viewMode === "section" && activeSectionId && commands.length === 0 && (
                            <div className="glass2" style={{ padding: 16 }}>
                                <div style={{ fontWeight: 800, fontSize: 15 }}>
                                    Sin comandos en esta sección
                                </div>
                                <div className="muted icon-title" style={{ marginTop: 8, fontSize: 13 }}>
                                    Pulsa
                                    <span className="kbd icon-title">
                                        {Icons.add} Nuevo comando
                                    </span>
                                    para guardar tu primer snippet.
                                </div>
                            </div>
                        )}

                        {viewMode === "favorites" && filteredCommands.length === 0 && (
                            <div className="glass2" style={{ padding: 16 }}>
                                <div style={{ fontWeight: 800, fontSize: 15 }}>Sin favoritos todavía</div>
                                <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                                    Marca comandos con la estrella para acceder a ellos rápidamente desde aquí.
                                </div>
                            </div>
                        )}

                        {viewMode === "search" && search && filteredCommands.length === 0 && (
                            <div className="glass2" style={{ padding: 16 }}>
                                <div style={{ fontWeight: 800, fontSize: 15 }}>Sin resultados</div>
                                <div className="muted" style={{ marginTop: 6 }}>
                                    Ningún comando del workspace coincide con <span className="mono">"{search}"</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Workspace modal */}
            <Modal
                open={workspaceModalOpen}
                title={editingWorkspace ? "Renombrar Workspace" : "Crear Workspace"}
                onClose={() => { setWorkspaceModalOpen(false); setEditingWorkspace(null); }}
            >
                <WorkspaceEditor
                    initialName={editingWorkspace?.name ?? ""}
                    submitLabel={editingWorkspace ? "Actualizar" : "Crear"}
                    onSubmit={createOrUpdateWorkspace}
                />
            </Modal>

            {/* Section modal */}
            <Modal
                open={sectionModalOpen}
                title={editingSection ? "Editar Sección" : "Crear Sección"}
                onClose={() => { setSectionModalOpen(false); setEditingSection(null); }}
            >
                <SectionEditor
                    initial={{
                        title: editingSection?.title ?? "",
                        icon: editingSection?.icon ?? "terminal",
                        position: editingSection?.position ?? sections.length
                    }}
                    submitLabel={editingSection ? "Actualizar" : "Crear"}
                    onSubmit={createOrUpdateSection}
                />
            </Modal>

            {/* Command modal */}
            <Modal
                open={commandModalOpen}
                title={editingCommand ? "Editar Comando" : "Nuevo Comando"}
                onClose={() => { setCommandModalOpen(false); setEditingCommand(null); }}
                width={820}
            >
                <CommandEditor
                    initial={editingCommand ?? undefined}
                    submitLabel={editingCommand ? "Actualizar" : "Guardar"}
                    onSubmit={createOrUpdateCommand}
                />
            </Modal>

            {/* Settings modal */}
            <Modal
                open={settingsModalOpen}
                title="Ajustes"
                onClose={() => setSettingsModalOpen(false)}
                width={620}
            >
                <SettingsPanel
                    onAuthChanged={() => { /* status refreshed inside panel */ }}
                    onImported={refreshWorkspaces}
                />
            </Modal>
        </div>
    );
}

function WorkspaceEditor(props: {
    initialName: string;
    submitLabel: string;
    onSubmit: (name: string) => void;
}) {
    const [name, setName] = useState(props.initialName);
    useEffect(() => setName(props.initialName), [props.initialName]);

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); props.onSubmit(name.trim() || "Sin título"); }}
            style={{ display: "grid", gap: 10 }}
        >
            <div>
                <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Nombre</div>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn" type="submit">{props.submitLabel}</button>
            </div>
        </form>
    );
}

function SectionEditor(props: {
    initial: { title: string; icon: string; position: number };
    submitLabel: string;
    onSubmit: (p: { title: string; icon: string; position: number }) => void;
}) {
    const [title, setTitle] = useState(props.initial.title);
    const [icon, setIcon] = useState(props.initial.icon);
    const [position, setPosition] = useState(props.initial.position);
    const [iconFilter, setIconFilter] = useState("");

    useEffect(() => {
        setTitle(props.initial.title);
        setIcon(props.initial.icon);
        setPosition(props.initial.position);
    }, [props.initial]);

    const iconKeys = (Object.keys(Icons) as IconKey[]).filter((key) =>
        key.toLowerCase().includes(iconFilter.toLowerCase())
    );

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                props.onSubmit({
                    title: title.trim() || "Sin título",
                    icon: icon,
                    position: Number.isFinite(position) ? position : 0
                });
            }}
            style={{ display: "grid", gap: 10 }}
        >
            {/* Title + Order */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10 }}>
                <div>
                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Título</div>
                    <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div>
                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Orden</div>
                    <input
                        className="input"
                        type="number"
                        value={position}
                        onChange={(e) => setPosition(Number(e.target.value))}
                    />
                </div>
            </div>

            {/* Icon selector */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div className="muted2" style={{ fontSize: 12 }}>Icono ({icon})</div>
                    <input
                        className="input mono"
                        placeholder="filtrar..."
                        value={iconFilter}
                        onChange={(e) => setIconFilter(e.target.value)}
                        style={{ width: 140, padding: "4px 8px", fontSize: 12 }}
                    />
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))",
                        gap: 8,
                        maxHeight: 160,
                        overflowY: "auto",
                        paddingRight: 4
                    }}
                >
                    {iconKeys.map((key) => (
                        <button
                            key={key}
                            type="button"
                            className="btn"
                            onClick={() => setIcon(key)}
                            style={{
                                padding: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: icon === key ? "1px solid rgba(255,255,255,0.35)" : "1px solid var(--border)"
                            }}
                            title={key}
                        >
                            {Icons[key]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="muted2" style={{ fontSize: 12 }}>
                Elige un icono representativo para esta sección.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn" type="submit">
                    {props.submitLabel}
                </button>
            </div>
        </form>
    );
}
