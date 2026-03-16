"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../guest.module.css";


export default function GuestAccessPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";

  const [cedula, setCedula] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/guest/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, cedula }),
      });

      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Error");

      router.replace("/guest/case");
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.title}>Acceso a Documentación</div>
        <div className={styles.sub}>Ingrese su cédula para continuar.</div>

        {!token ? <div className={styles.alert}>Link inválido (sin token).</div> : null}
        {err ? <div className={styles.alert}>{err}</div> : null}

        <div className={styles.field}>
          <label>Cédula</label>
          <input
            className={styles.input}
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="1712345678"
          />
        </div>

        <button className={styles.primary} onClick={onSubmit} disabled={!token || !cedula || loading}>
          {loading ? "Validando…" : "Ingresar"}
        </button>
      </div>
    </div>
  );
}
