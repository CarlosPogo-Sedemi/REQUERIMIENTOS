"use client";

import { useEffect, useState } from "react";
import styles from "../guest.module.css";

export default function GuestCasePage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    const r = await fetch("/api/guest/me");
    const j = await r.json();
    if (!r.ok || !j.ok) {
      setErr(j?.error || "No autorizado");
      setData(null);
      return;
    }
    setData(j);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.cardWide}>
        <div className={styles.title}>Documentación requerida</div>

        {err ? <div className={styles.alert}>{err}</div> : null}

        {!data ? (
          <div className={styles.sub}>Cargando…</div>
        ) : (
          <>
            <div className={styles.kv}>
              <span>Email</span><b>{data.guest.email}</b>
            </div>
            <div className={styles.kv}>
              <span>Caso</span><code>{data.case.id}</code>
            </div>
            <div className={styles.kv}>
              <span>Estado</span><b>{data.case.status}</b>
            </div>
            <div className={styles.kv}>
              <span>Expira</span><b>{new Date(data.case.expiresAt).toLocaleString("es-EC")}</b>
            </div>

            <hr className={styles.hr} />

            <div className={styles.sub}>
              Próximo paso: subir PDFs y ver lista de archivos (OneDrive) en tiempo real.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
