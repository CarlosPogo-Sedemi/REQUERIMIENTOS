"use client";

import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import styles from "./tthh.module.css";

type CaseRow = {
  id: string;
  status: string;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  guest: { email: string };
};

export default function TthhCasesPage() {
  const { instance } = useMsal();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);

  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");

  const getToken = async () => {
    const account = instance.getActiveAccount() || instance.getAllAccounts()[0];
    if (!account) throw new Error("No hay sesión activa");
    const token = await instance.acquireTokenSilent({ account, scopes: ["User.Read"] });
    return token.accessToken;
  };

  const loadCases = async () => {
    setLoading(true);
    setErr(null);
    try {
      const t = await getToken();
      const r = await fetch("/api/tthh/cases/list", { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Error cargando casos");
      setCases(j.cases || []);
    } catch (e: any) {
      setErr(e?.message || "Error");
      
    } finally {
      setLoading(false);
    }
  };

  const crearCaso = async () => {
    setErr(null);
    try {
      const t = await getToken();
      const r = await fetch("/api/tthh/cases", {
        method: "POST",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, cedula }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Error creando caso");
      setEmail("");
      setCedula("");
      await loadCases();
    } catch (e: any) {
      setErr(e?.message || "Error");
    }
  };

  const generarLink = async (caseId: string) => {
    setErr(null);
    try {
      const t = await getToken();
      const r = await fetch(`/api/tthh/cases/${caseId}/send-link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Error generando link");

      await navigator.clipboard.writeText(j.link);
      alert("Link copiado al portapapeles");
    } catch (e: any) {
      setErr(e?.message || "Error");
    }
  };

  useEffect(() => {
    loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>SEDEMI</div>
        <div className={styles.actions}>
          <a className={styles.link} href="/dashboard">Volver</a>
          <button className={styles.secondaryBtn} onClick={loadCases} disabled={loading}>Recargar</button>
          <button className={styles.logoutBtn} onClick={() => instance.logoutRedirect()}>Salir</button>
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.h1}>Gestión TTHH • Casos</h1>
        <div className={styles.sub}>Crea un caso, genera link (1 día), y el acceso dura 2 días desde activación.</div>

        {err ? <div className={styles.alert}>{err}</div> : null}

        <section className={styles.card}>
          <h2>Crear caso</h2>
          <div className={styles.form}>
            <div className={styles.field}>
              <label>Email del postulante</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} placeholder="postulante@gmail.com" />
            </div>
            <div className={styles.field}>
              <label>Cédula</label>
              <input value={cedula} onChange={(e) => setCedula(e.target.value)} className={styles.input} placeholder="1712345678" />
            </div>

            <button className={styles.primaryBtn} onClick={crearCaso} disabled={!email || !cedula}>
              Crear
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Mis casos</h2>
            <span className={styles.badge}>{cases.length}</span>
          </div>

          {loading ? (
            <div className={styles.loading}>Cargando…</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Postulante</th>
                    <th>Estado</th>
                    <th>Activado</th>
                    <th>Expira</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className={styles.mono}>{c.guest.email}</div>
                        <div className={styles.small}>Case: {c.id}</div>
                      </td>
                      <td><b>{c.status}</b></td>
                      <td className={styles.small}>{c.activatedAt ? new Date(c.activatedAt).toLocaleString("es-EC") : "-"}</td>
                      <td className={styles.small}>{c.expiresAt ? new Date(c.expiresAt).toLocaleString("es-EC") : "-"}</td>
                      <td>
                        <button className={styles.tableBtn} onClick={() => generarLink(c.id)}>
                          Generar / reenviar link
                        </button>
                      </td>
                    </tr>
                  ))}

                  {cases.length === 0 ? (
                    <tr><td colSpan={5} className={styles.empty}>Aún no tienes casos.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
