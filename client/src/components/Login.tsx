import { useState } from "react";
import toast from "react-hot-toast";
import { AuthAPI } from "../lib/api";
import { Icons } from "./icons";

export function Login(props: { onSuccess: () => void }) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!password) return;
        setLoading(true);
        try {
            await AuthAPI.login(password);
            toast.success("Acceso concedido");
            props.onSuccess();
        } catch (err: any) {
            toast.error(err?.response?.data?.error ?? "Contraseña incorrecta");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            style={{
                height: "100vh",
                display: "grid",
                placeItems: "center",
                padding: 20
            }}
        >
            <form onSubmit={submit} className="glass" style={{ padding: 28, width: "min(380px, 100%)" }}>
                <div className="icon-title" style={{ fontSize: 20, fontWeight: 800, justifyContent: "center" }}>
                    {Icons.vault}
                    <span>Command Vault</span>
                </div>
                <div className="muted2" style={{ textAlign: "center", marginTop: 6, fontSize: 13 }}>
                    Esta instancia está protegida. Introduce la contraseña local para continuar.
                </div>

                <div style={{ marginTop: 22 }}>
                    <div className="muted2" style={{ fontSize: 12, marginBottom: 6 }}>Contraseña</div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            autoFocus
                            type={showPw ? "text" : "password"}
                            className="input mono"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <button type="button" className="btn" onClick={() => setShowPw((v) => !v)}>
                            {showPw ? Icons.eyeOff : Icons.eye}
                        </button>
                    </div>
                </div>

                <button className="btn" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
                    {Icons.login}
                    <span style={{ marginLeft: 6 }}>{loading ? "Verificando…" : "Entrar"}</span>
                </button>
            </form>
        </div>
    );
}
