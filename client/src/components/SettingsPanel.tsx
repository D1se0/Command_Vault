import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AuthAPI, AuthStatus, DataAPI } from "../lib/api";
import { Icons } from "./icons";

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export function SettingsPanel(props: {
    onAuthChanged: () => void;
    onImported: () => void;
}) {
    const [status, setStatus] = useState<AuthStatus | null>(null);
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [newPw2, setNewPw2] = useState("");
    const [busy, setBusy] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function refresh() {
        try {
            const s = await AuthAPI.status();
            setStatus(s);
        } catch {
            /* ignore */
        }
    }

    useEffect(() => { refresh(); }, []);

    async function enableAuth() {
        if (newPw.length < 4) {
            toast.error("La contraseña debe tener al menos 4 caracteres");
            return;
        }
        if (newPw !== newPw2) {
            toast.error("Las contraseñas no coinciden");
            return;
        }
        setBusy(true);
        try {
            await AuthAPI.configure({
                enable: true,
                new_password: newPw,
                current_password: currentPw || undefined
            });
            toast.success("Autenticación activada. Vuelve a iniciar sesión si es necesario.");
            setNewPw(""); setNewPw2(""); setCurrentPw("");
            await refresh();
            props.onAuthChanged();
        } catch (err: any) {
            toast.error(err?.response?.data?.error ?? "No se pudo activar la autenticación");
        } finally {
            setBusy(false);
        }
    }

    async function disableAuth() {
        setBusy(true);
        try {
            await AuthAPI.configure({ enable: false, current_password: currentPw || undefined });
            toast.success("Autenticación desactivada");
            setCurrentPw("");
            await refresh();
            props.onAuthChanged();
        } catch (err: any) {
            toast.error(err?.response?.data?.error ?? "No se pudo desactivar la autenticación");
        } finally {
            setBusy(false);
        }
    }

    async function handleExport() {
        try {
            const blob = await DataAPI.exportAll();
            downloadBlob(blob, `command-vault-backup-${Date.now()}.json`);
            toast.success("Backup exportado");
        } catch (err: any) {
            toast.error(err?.response?.data?.error ?? "Error al exportar");
        }
    }

    async function handleImportFile(file: File) {
        try {
            const text = await file.text();
            const json = JSON.parse(text);
            const result = await DataAPI.importAll(json, `Importado ${new Date().toLocaleString()}`);
            toast.success("Importación completada en un nuevo workspace");
            props.onImported();
            return result;
        } catch (err: any) {
            toast.error(err?.response?.data?.error ?? "Archivo de importación inválido");
        }
    }

    return (
        <div style={{ display: "grid", gap: 18 }}>
            {/* Auth section */}
            <div className="glass2" style={{ padding: 14 }}>
                <div className="icon-title" style={{ fontWeight: 800, fontSize: 14 }}>
                    {Icons.shieldCheck}
                    <span>Acceso con contraseña</span>
                </div>
                <div className="muted2" style={{ fontSize: 12, marginTop: 6 }}>
                    Protege esta instancia con una contraseña local. Útil si la expones en tu red (LAN) y no quieres que cualquiera con la IP pueda entrar.
                </div>

                <div style={{ marginTop: 12 }}>
                    {status?.auth_enabled ? (
                        <div style={{ display: "grid", gap: 10 }}>
                            <div className="muted" style={{ fontSize: 13 }}>
                                Estado: <span style={{ color: "#9ece6a", fontWeight: 700 }}>Activada</span>
                            </div>
                            <div>
                                <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Contraseña actual (para confirmar)</div>
                                <input
                                    type="password"
                                    className="input"
                                    value={currentPw}
                                    onChange={(e) => setCurrentPw(e.target.value)}
                                />
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button className="btn" disabled={busy} onClick={disableAuth}>
                                    {Icons.unlock}
                                    <span style={{ marginLeft: 6 }}>Desactivar protección</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                            <div className="muted" style={{ fontSize: 13 }}>
                                Estado: <span className="muted2" style={{ fontWeight: 700 }}>Desactivada</span>
                            </div>

                            {status?.has_password && (
                                <div>
                                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Contraseña actual (si ya configuraste una antes)</div>
                                    <input
                                        type="password"
                                        className="input"
                                        value={currentPw}
                                        onChange={(e) => setCurrentPw(e.target.value)}
                                    />
                                </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div>
                                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Nueva contraseña</div>
                                    <input
                                        type="password"
                                        className="input"
                                        value={newPw}
                                        onChange={(e) => setNewPw(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Repetir contraseña</div>
                                    <input
                                        type="password"
                                        className="input"
                                        value={newPw2}
                                        onChange={(e) => setNewPw2(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <button className="btn" disabled={busy} onClick={enableAuth}>
                                    {Icons.lock}
                                    <span style={{ marginLeft: 6 }}>Activar protección</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Export / Import */}
            <div className="glass2" style={{ padding: 14 }}>
                <div className="icon-title" style={{ fontWeight: 800, fontSize: 14 }}>
                    {Icons.archive}
                    <span>Copia de seguridad</span>
                </div>
                <div className="muted2" style={{ fontSize: 12, marginTop: 6 }}>
                    Exporta toda tu base de datos (workspaces, secciones, comandos e historial) a un archivo JSON, o impórtala desde un backup anterior.
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                    <button className="btn" onClick={handleExport}>
                        {Icons.download}
                        <span style={{ marginLeft: 6 }}>Exportar todo (JSON)</span>
                    </button>

                    <button className="btn" onClick={() => fileInputRef.current?.click()}>
                        {Icons.upload}
                        <span style={{ marginLeft: 6 }}>Importar backup</span>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/json"
                        style={{ display: "none" }}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImportFile(file);
                            e.target.value = "";
                        }}
                    />
                </div>

                <div className="muted2" style={{ fontSize: 11, marginTop: 10 }}>
                    La importación siempre crea un workspace nuevo, nunca sobrescribe datos existentes.
                </div>
            </div>
        </div>
    );
}
