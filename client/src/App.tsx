import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

import { CommandsAPI, CommandEntry, SectionsAPI, Section, WorkspacesAPI, Workspace } from "./lib/api";
import { Modal } from "./components/Modal";
import { CommandEditor, CommandDraft } from "./components/CommandEditor";
import { TerminalBlock } from "./components/TerminalBlock";

import { Icons } from "./components/icons";
type IconKey = keyof typeof Icons;

function useEsc(handler: () => void) {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") handler(); };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [handler]);
}

export default function App() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [commands, setCommands] = useState<CommandEntry[]>([]);

    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
    const [activeSectionId, setActiveSectionId] = useState<string>("");

    const [loading, setLoading] = useState(true);

    // Modals
    const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
    const [sectionModalOpen, setSectionModalOpen] = useState(false);
    const [commandModalOpen, setCommandModalOpen] = useState(false);

    const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [editingCommand, setEditingCommand] = useState<CommandEntry | null>(null);

    const activeWorkspace = useMemo(
        () => workspaces.find(w => w.id === activeWorkspaceId) ?? null,
        [workspaces, activeWorkspaceId]
    );
    const activeSection = useMemo(
        () => sections.find(s => s.id === activeSectionId) ?? null,
        [sections, activeSectionId]
    );

    useEsc(() => {
        setWorkspaceModalOpen(false);
        setSectionModalOpen(false);
        setCommandModalOpen(false);
    });

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
        (async () => {
            try {
                setLoading(true);
                await refreshWorkspaces();
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!activeWorkspaceId) return;
        refreshSections(activeWorkspaceId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWorkspaceId]);

    useEffect(() => {
        refreshCommands(activeSectionId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSectionId]);

    // --------- CRUD handlers ---------

    async function createOrUpdateWorkspace(name: string) {
        try {
            if (editingWorkspace) {
                await WorkspacesAPI.update(editingWorkspace.id, name);
                toast.success("Workspace updated");
            } else {
                const created = await WorkspacesAPI.create(name);
                setActiveWorkspaceId(created.id);
                toast.success("Workspace created");
            }
            setWorkspaceModalOpen(false);
            setEditingWorkspace(null);
            await refreshWorkspaces();
        } catch (e: any) {
            toast.error(`Workspace failed: ${e?.message ?? "unknown error"}`);
        }
    }

    async function deleteWorkspace(id: string) {
        if (!confirm("Delete workspace? This also deletes its sections & commands.")) return;
        try {
            await WorkspacesAPI.remove(id);
            toast.success("Workspace deleted");
            setActiveWorkspaceId("");
            setActiveSectionId("");
            await refreshWorkspaces();
        } catch (e: any) {
            toast.error(`Delete failed: ${e?.message ?? "unknown error"}`);
        }
    }

    async function createOrUpdateSection(payload: { title: string; icon: string; position: number }) {
        if (!activeWorkspaceId) return;
        try {
            if (editingSection) {
                await SectionsAPI.update(editingSection.id, payload);
                toast.success("Section updated");
            } else {
                const created = await SectionsAPI.create({
                    workspace_id: activeWorkspaceId,
                    title: payload.title,
                    icon: payload.icon,
                    position: payload.position
                });
                setActiveSectionId(created.id);
                toast.success("Section created");
            }
            setSectionModalOpen(false);
            setEditingSection(null);
            await refreshSections(activeWorkspaceId);
        } catch (e: any) {
            toast.error(`Section failed: ${e?.message ?? "unknown error"}`);
        }
    }

    async function deleteSection(id: string) {
        if (!confirm("Delete section? This also deletes its commands.")) return;
        try {
            await SectionsAPI.remove(id);
            toast.success("Section deleted");
            if (id === activeSectionId) setActiveSectionId("");
            await refreshSections(activeWorkspaceId);
        } catch (e: any) {
            toast.error(`Delete failed: ${e?.message ?? "unknown error"}`);
        }
    }

    async function createOrUpdateCommand(draft: CommandDraft) {
        if (!activeSectionId) return;
        try {
            if (editingCommand) {
                await CommandsAPI.update(editingCommand.id, draft);
                toast.success("Command updated");
            } else {
                await CommandsAPI.create({ section_id: activeSectionId, ...draft });
                toast.success("Command saved");
            }
            setCommandModalOpen(false);
            setEditingCommand(null);
            await refreshCommands(activeSectionId);
        } catch (e: any) {
            toast.error(`Command failed: ${e?.message ?? "unknown error"}`);
        }
    }

    async function deleteCommand(id: string) {
        if (!confirm("Delete command?")) return;
        try {
            await CommandsAPI.remove(id);
            toast.success("Command deleted");
            await refreshCommands(activeSectionId);
        } catch (e: any) {
            toast.error(`Delete failed: ${e?.message ?? "unknown error"}`);
        }
    }

    // --------- UI ---------

    if (loading) {
        return (
            <div style={{ padding: 24 }}>
                <div className="glass" style={{ padding: 18, maxWidth: 520 }}>
                    <span className="nf nf-fa-vault mono" style={{ marginRight: 8 }} />
                    Command Vault
                    <div className="muted" style={{ marginTop: 8 }}>Loading workspace…</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: "100vh", display: "grid", gridTemplateColumns: "320px 1fr" }}>
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
            <div style={{ padding: 14 }}>
                <div className="glass" style={{ height: "calc(100vh - 28px)", padding: 14, display: "grid", gridTemplateRows: "auto auto 1fr auto", gap: 12 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        fontSize: 18,
                                        fontWeight: 700
                                    }}
                                >
                                    {Icons.bug}
                                    <span>Command Vault</span>
                                </div>
                                <div className="muted2" style={{ marginTop: 4, fontSize: 12 }}>
                                    Personal pentest & sysadmin command workspace
                                </div>
                            </div>
                            <div className="kbd">Ctrl</div>
                        </div>
                    </div>

                    {/* Workspace selector */}
                    <div className="glass2" style={{ padding: 12 }}>
                        <div className="muted2" style={{ fontSize: 12, marginBottom: 8 }}>Workspace</div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <select
                                className="select"
                                value={activeWorkspaceId}
                                onChange={(e) => { setActiveWorkspaceId(e.target.value); setActiveSectionId(""); }}
                            >
                                {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                            <button
                                className="btn"
                                onClick={() => { setEditingWorkspace(null); setWorkspaceModalOpen(true); }}
                                title="New workspace"
                            >
                                {Icons.add}
                            </button>
                        </div>

                        {activeWorkspace && (
                            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        setEditingWorkspace(activeWorkspace);
                                        setWorkspaceModalOpen(true);
                                    }}
                                >
                                    {Icons.edit}
                                    <span style={{ marginLeft: 6 }}>Rename</span>
                                </button>

                                <button
                                    className="btn"
                                    onClick={() => deleteWorkspace(activeWorkspace.id)}
                                >
                                    {Icons.delete}
                                    <span style={{ marginLeft: 6 }}>Delete</span>
                                </button>
                            </div>

                        )}
                    </div>

                    {/* Sections */}
                    <div style={{ overflow: "auto", paddingRight: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <div className="muted2" style={{ fontSize: 12 }}>Sections</div>
                            <button
                                className="btn"
                                onClick={() => { setEditingSection(null); setSectionModalOpen(true); }}
                                disabled={!activeWorkspaceId}
                            >
                                {Icons.add} Add
                            </button>
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                            {sections.map((s) => {
                                const active = s.id === activeSectionId;
                                return (
                                    <motion.div
                                        key={s.id}
                                        whileHover={{ y: -1 }}
                                        transition={{ duration: 0.16 }}
                                        className="glass2"
                                        style={{
                                            padding: 12,
                                            border: active ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.10)",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => setActiveSectionId(s.id)}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                                            <div>
                                                <div className="icon-title" style={{ fontWeight: 700 }}>
                                                    {Icons[s.icon as keyof typeof Icons]}
                                                    {s.title}
                                                </div>
                                                {/*<div className="muted2" style={{ fontSize: 12, marginTop: 4 }}>
                                                    position {s.position}
                                                </div>*/}
                                            </div>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button
                                                    className="btn"
                                                    onClick={(e) => { e.stopPropagation(); setEditingSection(s); setSectionModalOpen(true); }}
                                                    title="Edit section"
                                                >
                                                    {Icons.edit}
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={(e) => { e.stopPropagation(); deleteSection(s.id); }}
                                                    title="Delete section"
                                                >
                                                    {Icons.delete}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {sections.length === 0 && (
                                <div className="glass2" style={{ padding: 14 }}>
                                    <div style={{ fontWeight: 700 }}>No sections yet</div>
                                    <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                                        Create sections like “SUID Enumeration”, “Active Directory”, “Web Fuzzing”, etc.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer hint */}
                    <div className="muted2" style={{ fontSize: 12 }}>
                        Stored locally in <span className="mono">server/data/*.db</span>
                    </div>
                </div>
            </div>

            {/* Main */}
            <div style={{ padding: 14 }}>
                <div className="glass" style={{ height: "calc(100vh - 28px)", padding: 16, overflow: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                        <div>
                            <div className="muted2" style={{ fontSize: 12 }}>Active section</div>
                            <div
                                className="icon-title"
                                style={{ fontSize: 22, fontWeight: 850, marginTop: 6 }}
                            >
                                {activeSection ? (
                                    <>
                                        {Icons[activeSection.icon as keyof typeof Icons]}
                                        {activeSection.title}
                                    </>
                                ) : (
                                    "Select a section"
                                )}
                            </div>
                            <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                                Save commands with explanations. Syntax highlighting adapts to language.
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                className="btn"
                                onClick={() => { setEditingCommand(null); setCommandModalOpen(true); }}
                                disabled={!activeSectionId}
                            >
                                {Icons.add} New command
                            </button>
                        </div>
                    </div>

                    <div style={{ height: 14 }} />

                    <div style={{ display: "grid", gap: 14 }}>
                        {commands.map((c) => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18 }}
                                className="glass2"
                                style={{ padding: 14 }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 850, fontSize: 16 }}>{c.title}</div>
                                        <div className="muted" style={{ marginTop: 6, fontSize: 13, whiteSpace: "pre-wrap" }}>
                                            {c.description || <span className="muted2">No explanation provided.</span>}
                                        </div>
                                        <div className="muted2 mono" style={{ marginTop: 10, fontSize: 12 }}>
                                            lang: {c.language} · order: {c.position} · updated: {new Date(c.updated_at).toLocaleString()}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                        <button className="btn" onClick={() => { setEditingCommand(c); setCommandModalOpen(true); }}>
                                            {Icons.editAlt}
                                            <span style={{ marginLeft: 6 }}>Edit</span>
                                        </button>
                                        <button className="btn" onClick={() => deleteCommand(c.id)}>
                                            {Icons.delete}
                                            <span style={{ marginLeft: 6 }}>Delete</span>
                                        </button>
                                    </div>
                                </div>

                                <div style={{ height: 12 }} />
                                <TerminalBlock language={c.language} code={c.command} />
                            </motion.div>
                        ))}

                        {activeSectionId && commands.length === 0 && (
                            <div className="glass2" style={{ padding: 16 }}>
                                <div style={{ fontWeight: 800, fontSize: 15 }}>
                                    No commands in this section
                                </div>

                                <div
                                    className="muted icon-title"
                                    style={{ marginTop: 8, fontSize: 13 }}
                                >
                                    Click
                                    <span className="kbd icon-title">
                                        {Icons.add}
                                        New command
                                    </span>
                                    to store your first snippet.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Workspace modal */}
            <Modal
                open={workspaceModalOpen}
                title={editingWorkspace ? "Rename Workspace" : "Create Workspace"}
                onClose={() => { setWorkspaceModalOpen(false); setEditingWorkspace(null); }}
            >
                <WorkspaceEditor
                    initialName={editingWorkspace?.name ?? ""}
                    submitLabel={editingWorkspace ? "Update" : "Create"}
                    onSubmit={createOrUpdateWorkspace}
                />
            </Modal>

            {/* Section modal */}
            <Modal
                open={sectionModalOpen}
                title={editingSection ? "Edit Section" : "Create Section"}
                onClose={() => { setSectionModalOpen(false); setEditingSection(null); }}
            >
                <SectionEditor
                    initial={{
                        title: editingSection?.title ?? "",
                        icon: editingSection?.icon ?? "terminal",
                        position: editingSection?.position ?? 0
                    }}
                    submitLabel={editingSection ? "Update" : "Create"}
                    onSubmit={createOrUpdateSection}
                />
            </Modal>

            {/* Command modal */}
            <Modal
                open={commandModalOpen}
                title={editingCommand ? "Edit Command" : "New Command"}
                onClose={() => { setCommandModalOpen(false); setEditingCommand(null); }}
            >
                <CommandEditor
                    initial={editingCommand ?? undefined}
                    submitLabel={editingCommand ? "Update" : "Save"}
                    onSubmit={createOrUpdateCommand}
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
            onSubmit={(e) => { e.preventDefault(); props.onSubmit(name.trim() || "Untitled"); }}
            style={{ display: "grid", gap: 10 }}
        >
            <div>
                <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Name</div>
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

    useEffect(() => {
        setTitle(props.initial.title);
        setIcon(props.initial.icon);
        setPosition(props.initial.position);
    }, [props.initial]);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();

                props.onSubmit({
                    title: title.trim() || "Untitled",
                    icon: icon,
                    position: Number.isFinite(position) ? position : 0
                });
            }}
            style={{ display: "grid", gap: 10 }}
        >
            {/* Title + Order */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 110px",
                    gap: 10
                }}
            >
                <div>
                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>
                        Title
                    </div>
                    <input
                        className="input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div>
                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>
                        Order
                    </div>
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
                <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>
                    Icon
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))",
                        gap: 8,
                        maxHeight: 120,
                        overflowY: "auto",
                        paddingRight: 4
                    }}
                >
                    {(Object.keys(Icons) as IconKey[]).map((key) => (
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
                                border:
                                    icon === key
                                        ? "1px solid rgba(255,255,255,0.35)"
                                        : "1px solid var(--border)"
                            }}
                            title={key}
                        >
                            {Icons[key]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="muted2" style={{ fontSize: 12 }}>
                Tip: Choose an icon for this section.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn" type="submit">
                    {props.submitLabel}
                </button>
            </div>
        </form>
    );

}
