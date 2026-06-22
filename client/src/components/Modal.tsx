import { motion, AnimatePresence } from "framer-motion";

import { Icons } from "./icons";

export function Modal(props: {
    open: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    width?: number;
}) {
    return (
        <AnimatePresence>
            {props.open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.55 }}
                        exit={{ opacity: 0 }}
                        onClick={props.onClose}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "#000",
                            zIndex: 40
                        }}
                    />

                    {/* Centered modal container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            display: "grid",
                            placeItems: "center",
                            zIndex: 50,
                            padding: 16
                        }}
                    >
                        <div
                            className="glass"
                            style={{
                                width: `min(${props.width ?? 720}px, calc(100vw - 24px))`,
                                maxHeight: "calc(100vh - 48px)",
                                overflow: "auto",
                                padding: 18
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 650 }}>
                                        {props.title}
                                    </div>
                                    <div className="muted2" style={{ fontSize: 12, marginTop: 4 }}>
                                        Pulsa <span className="kbd">Esc</span> para cerrar
                                    </div>
                                </div>

                                <button
                                    className="btn"
                                    onClick={props.onClose}
                                    aria-label="Cerrar"
                                >
                                    {Icons.close}
                                </button>
                            </div>

                            <div style={{ marginTop: 14 }}>{props.children}</div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
