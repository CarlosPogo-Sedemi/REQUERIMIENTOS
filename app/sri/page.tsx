/*
"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./sri.module.css";

type Invoice = {
    id: string;
    claveAcceso: string;
    rucEmisor: string;
    razonSocialEmisor: string;
    tipoComprobante: string;
    serieComprobante: string;
    fechaEmision: string | null;
    fechaAutorizacion: string | null;
    identificacionReceptor: string | null;
    valorSinImpuestos: string;
    iva: string;
    importeTotal: string;
    rucProfile: {
        tipoContribuyente: string | null;
        regimen: string | null;
        actividadEconomicaPrincipal: string | null;
    } | null;

    files?: {
        kind: string;
        storagePath: string;
    }[];
};

function fmtDate(d: string | null) {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString();
}

function fmtMoney(v: string) {
    const n = Number(v);
    if (!Number.isFinite(n)) return v;
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SriPage() {
    const [txt, setTxt] = useState<File | null>(null);
    const [copiedClave, setCopiedClave] = useState<string | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importSummary, setImportSummary] = useState<any>(null);
    const [importError, setImportError] = useState<string | null>(null);

    // filtros por columna
    const [filters, setFilters] = useState({
        claveAcceso: "",
        rucEmisor: "",
        razonSocialEmisor: "",
        tipoComprobante: "",
        serieComprobante: "",
        identificacionReceptor: "",
        from: "",
        to: "",
    });

    // tabla
    const [data, setData] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [tableError, setTableError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);

    const [sortBy, setSortBy] = useState("fechaEmision");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const [total, setTotal] = useState(0);
    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

    // Debounce para filtros (para que no consulte en cada tecla instant)
    const [debouncedFilters, setDebouncedFilters] = useState(filters);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedFilters(filters), 350);
        return () => clearTimeout(t);
    }, [filters]);

    async function fetchTable(p = page) {
        setLoading(true);
        setTableError(null);

        try {
            const params = new URLSearchParams({
                page: String(p),
                pageSize: String(pageSize),
                sortBy,
                sortDir,
                ...Object.fromEntries(Object.entries(debouncedFilters).filter(([, v]) => (v || "").trim() !== "")),
            });

            const res = await fetch(`/api/sri/list?${params.toString()}`);
            const json = await res.json();

            if (!res.ok || !json.ok) throw new Error(json?.error || "Error consultando datos.");

            setData(json.items);
            setTotal(json.total);
            setPage(json.page);
        } catch (e: any) {
            setTableError(e?.message || "Error.");
        } finally {
            setLoading(false);
        }
    }

    //Funcion de copiar clave de acceso al portapapeles
    async function copyText(id: string, text: string) {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
        } finally {
            setCopiedClave(id);
            setTimeout(() => setCopiedClave(null), 800);
        }
    }

    useEffect(() => {
        // cuando cambian filtros u orden, resetea a página 1
        setPage(1);
        fetchTable(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedFilters, sortBy, sortDir]);

    async function handleImport() {
        setImportError(null);
        setImportSummary(null);

        if (!txt) {
            setImportError("Selecciona el TXT descargado del SRI.");
            return;
        }

        setImportLoading(true);
        try {
            const fd = new FormData();
            fd.append("txt", txt);

            const res = await fetch("/api/sri/import", { method: "POST", body: fd });
            const json = await res.json();

            if (!res.ok || !json.ok) throw new Error(json?.error || "Error importando.");

            setImportSummary(json.summary);
            setTxt(null);

            // refresca tabla
            fetchTable(1);
        } catch (e: any) {
            setImportError(e?.message || "Error.");
        } finally {
            setImportLoading(false);
        }
    }

    function toggleSort(col: string) {
        if (sortBy === col) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortBy(col);
            setSortDir("asc");
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Facturas SRI</h1>
                    <p className={styles.subtitle}>Importa el TXT del SRI y consulta con filtros por columna.</p>
                </div>
            </div>

  
            <section className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Importar TXT</h2>
                    <div className={styles.cardActions}>
                        <input
                            className={styles.file}
                            type="file"
                            accept=".txt,text/plain"
                            onChange={(e) => setTxt(e.target.files?.[0] ?? null)}
                        />
                        <button className={styles.primary} onClick={handleImport} disabled={importLoading}>
                            {importLoading ? "Registrando..." : "Registrar"}
                        </button>
                    </div>
                </div>

                {importError && <div className={styles.error}>{importError}</div>}

                {importSummary && (
                    <div className={styles.success}>
                        Importación OK — Archivo: <b>{importSummary.file}</b> | Filas: <b>{importSummary.totalRows}</b> | Insertadas:{" "}
                        <b>{importSummary.inserted}</b> | Duplicadas: <b>{importSummary.duplicates}</b>
                    </div>
                )}
            </section>

  
            <section className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Listado</h2>
                    <div className={styles.meta}>
                        {loading ? "Cargando..." : `Total: ${total.toLocaleString()}`}
                    </div>
                </div>

                <div className={styles.filtersRow}>
                    <div className={styles.filterGroup}>
                        <label className={styles.label}>Desde</label>
                        <input
                            className={styles.input}
                            type="date"
                            value={filters.from}
                            onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.label}>Hasta</label>
                        <input
                            className={styles.input}
                            type="date"
                            value={filters.to}
                            onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
                        />
                    </div>

                    <button
                        className={styles.secondary}
                        onClick={() =>
                            setFilters({
                                claveAcceso: "",
                                rucEmisor: "",
                                razonSocialEmisor: "",
                                tipoComprobante: "",
                                serieComprobante: "",
                                identificacionReceptor: "",
                                from: "",
                                to: "",
                            })
                        }
                    >
                        Limpiar filtros
                    </button>
                </div>

                {tableError && <div className={styles.error}>{tableError}</div>}

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.thRow}>
                                <th className={`${styles.th} ${styles.thCenter}`} onClick={() => toggleSort("fechaEmision")}>
                                    Emisión {sortBy === "fechaEmision" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`} onClick={() => toggleSort("fechaAutorizacion")}>
                                    Autorización {sortBy === "fechaAutorizacion" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`} onClick={() => toggleSort("rucEmisor")}>
                                    RUC Emisor {sortBy === "rucEmisor" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`} onClick={() => toggleSort("razonSocialEmisor")}>
                                    Razón Social {sortBy === "razonSocialEmisor" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                </th>

                                <th className={`${styles.th} ${styles.thCenter}`} onClick={() => toggleSort("tipoContribuyente")}>
                                    Tipo Contribuyente {sortBy === "tipoContribuyente" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`} onClick={() => toggleSort("regimen")}>
                                    Régimen {sortBy === "regimen" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                </th>

                                <th className={`${styles.th} ${styles.thCenter}`} onClick={() => toggleSort("tipoComprobante")}>
                                    Tipo {sortBy === "tipoComprobante" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`} onClick={() => toggleSort("serieComprobante")}>
                                    Serie {sortBy === "serieComprobante" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`} >Clave Acceso</th>
                                <th className={`${styles.th} ${styles.thCenter}`} onClick={() => toggleSort("valorSinImpuestos")}>
                                    Valor Sin IMP {sortBy === "valorSinImpuestos" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`} onClick={() => toggleSort("iva")}>
                                    IVA {sortBy === "iva" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`} onClick={() => toggleSort("importeTotal")}>
                                    Total {sortBy === "importeTotal" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                </th>

                                <th className={`${styles.th} ${styles.thCenter}`}>Documentos</th>
                            </tr>

                         
                            <tr className={styles.filterRow}>
                                <th className={`${styles.th} ${styles.thCenter}`}>
             
                                    <span className={styles.muted}>—</span>
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`}>
                          
                                    <span className={styles.muted}>—</span>
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`}>
                                    <input
                                        className={styles.inputSm}
                                        placeholder="RUC..."
                                        value={filters.rucEmisor}
                                        onChange={(e) => setFilters((p) => ({ ...p, rucEmisor: e.target.value }))}
                                    />
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`}>
                                    <input
                                        className={styles.inputSm}
                                        placeholder="Buscar razón social..."
                                        value={filters.razonSocialEmisor}
                                        onChange={(e) => setFilters((p) => ({ ...p, razonSocialEmisor: e.target.value }))}
                                    />
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`}> 
                                    <span className={styles.muted}>—</span>
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`}> 
                                    <span className={styles.muted}>—</span>
                                </th>
                                <th className={styles.th}>
                                    <input
                                        className={styles.inputSm}
                                        placeholder="Factura"
                                        value={filters.tipoComprobante}
                                        onChange={(e) => setFilters((p) => ({ ...p, tipoComprobante: e.target.value }))}
                                    />
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`}>
                                    <input
                                        className={styles.inputSm}
                                        placeholder="001-002-..."
                                        value={filters.serieComprobante}
                                        onChange={(e) => setFilters((p) => ({ ...p, serieComprobante: e.target.value }))}
                                    />
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`}>
                                    <input
                                        className={styles.inputSm}
                                        placeholder="Clave acceso..."
                                        value={filters.claveAcceso}
                                        onChange={(e) => setFilters((p) => ({ ...p, claveAcceso: e.target.value }))}
                                    />
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`}>
                                    <span className={styles.muted}>—</span>
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`}>
                                    <span className={styles.muted}>—</span>
                                </th>
                                <th className={`${styles.th} ${styles.thCenter}`}>
                                    <span className={styles.muted}>—</span>
                                </th>

                                <th className={`${styles.th} ${styles.thCenter}`}>
                                    <span className={styles.muted}>—</span>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {data.length === 0 && !loading ? (
                                <tr>
                                    <td className={styles.td} colSpan={12}>
                                        Sin resultados
                                    </td>
                                </tr>
                            ) : (
                                data.map((r) => (
                                    <tr key={r.id} className={styles.tr}>
                                        <td className={styles.tdCenter}>{fmtDate(r.fechaEmision)}</td>
                                        <td className={styles.tdCenter}>{fmtDate(r.fechaAutorizacion)}</td>
                                        <td className={styles.tdCenter}>{r.rucEmisor}</td>
                                        <td className={styles.tdCenter}>
                                            {r.razonSocialEmisor}
                                            {r.rucProfile?.actividadEconomicaPrincipal ? (
                                                <span
                                                    title={r.rucProfile.actividadEconomicaPrincipal}
                                                    style={{ marginLeft: 8, cursor: "help" }}
                                                >
                                                    ℹ️
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className={styles.tdCenter}>{r.rucProfile?.tipoContribuyente ?? "—"}</td>
                                        <td className={styles.tdCenter}>{r.rucProfile?.regimen ?? "—"}</td>

                                        <td className={styles.tdCenter}>{r.tipoComprobante}</td>
                                        <td className={styles.tdCenter}>{r.serieComprobante}</td>



                                        <td
                                            className={`${styles.tdCenter} ${styles.colClave} ${styles.copyCell}`}
                                            title={r.claveAcceso}
                                            onClick={() => copyText(r.id, r.claveAcceso)}
                                        >
                                            <span className={styles.claveWrap}>
                                                <span className={styles.claveStart}>{r.claveAcceso.slice(0, 12)}</span>
                                                <span className={styles.claveDots}>…</span>
                                                <span className={styles.claveEnd}>{r.claveAcceso.slice(-10)}</span>

                                                {copiedClave === r.id && <span className={styles.copiedBadge}>Copiado ✓</span>}
                                            </span>
                                        </td>


                                        <td className={styles.tdCenter}>{fmtMoney(r.valorSinImpuestos)}</td>
                                        <td className={styles.tdCenter}>{fmtMoney(r.iva)}</td>
                                        <td className={styles.tdCenter}>{fmtMoney(r.importeTotal)}</td>


                                        <td className={styles.tdCenter}>
                                            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                                {r.files?.map((file) => (
                                                    <a
                                                        key={file.storagePath}
                                                        href={file.storagePath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title={`Ver ${file.kind}`}
                                                        className={styles.actionBtn} // Puedes crear este estilo en tu CSS
                                                        style={{ textDecoration: "none", fontSize: "1.2rem" }}
                                                    >
                                                        {file.kind === "PDF" ? "📕" : "📄"}
                                                    </a>
                                                ))}
                                                {(!r.files || r.files.length === 0) && (
                                                    <span title="Sin archivos" style={{ opacity: 0.3 }}>⌛</span>
                                                )}
                                            </div>
                                        </td>

                                        
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

         
                <div className={styles.pager}>
                    <button className={styles.secondary} disabled={page <= 1 || loading} onClick={() => fetchTable(page - 1)}>
                        ◀ Anterior
                    </button>
                    <div className={styles.pagerInfo}>
                        Página <b>{page}</b> de <b>{totalPages}</b>
                    </div>
                    <button
                        className={styles.secondary}
                        disabled={page >= totalPages || loading}
                        onClick={() => fetchTable(page + 1)}
                    >
                        Siguiente ▶
                    </button>
                </div>
            </section>
        </div>
    );
}
*/

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Invoice = {
    id: string;
    claveAcceso: string;
    rucEmisor: string;
    razonSocialEmisor: string;
    tipoComprobante: string;
    serieComprobante: string;
    fechaEmision: string | null;
    fechaAutorizacion: string | null;
    identificacionReceptor: string | null;
    valorSinImpuestos: string;
    iva: string;
    importeTotal: string;
    rucProfile: {
        tipoContribuyente: string | null;
        regimen: string | null;
        actividadEconomicaPrincipal: string | null;
    } | null;
    files?: {
        kind: string;
        storagePath: string;
    }[];
};

function fmtDate(d: string | null) {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString("es-EC");
}

function fmtMoney(v: string) {
    const n = Number(v);
    if (!Number.isFinite(n)) return v;
    return n.toLocaleString("es-EC", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

export default function SriPage() {
    const router = useRouter();

    const [txt, setTxt] = useState<File | null>(null);
    const [copiedClave, setCopiedClave] = useState<string | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importSummary, setImportSummary] = useState<any>(null);
    const [importError, setImportError] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        claveAcceso: "",
        rucEmisor: "",
        razonSocialEmisor: "",
        tipoComprobante: "",
        serieComprobante: "",
        identificacionReceptor: "",
        from: "",
        to: ""
    });

    const [data, setData] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [tableError, setTableError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);

    const [sortBy, setSortBy] = useState("fechaEmision");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const [total, setTotal] = useState(0);
    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

    const [debouncedFilters, setDebouncedFilters] = useState(filters);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedFilters(filters), 350);
        return () => clearTimeout(t);
    }, [filters]);

    async function fetchTable(p = page) {
        setLoading(true);
        setTableError(null);

        try {
            const params = new URLSearchParams({
                page: String(p),
                pageSize: String(pageSize),
                sortBy,
                sortDir,
                ...Object.fromEntries(
                    Object.entries(debouncedFilters).filter(([, v]) => (v || "").trim() !== "")
                )
            });

            const res = await fetch(`/api/sri/list?${params.toString()}`);
            const json = await res.json();

            if (!res.ok || !json.ok) throw new Error(json?.error || "Error consultando datos.");

            setData(json.items);
            setTotal(json.total);
            setPage(json.page);
        } catch (e: any) {
            setTableError(e?.message || "Error.");
        } finally {
            setLoading(false);
        }
    }

    async function copyText(id: string, text: string) {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
        } finally {
            setCopiedClave(id);
            setTimeout(() => setCopiedClave(null), 800);
        }
    }

    useEffect(() => {
        setPage(1);
        fetchTable(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedFilters, sortBy, sortDir]);

    async function handleImport() {
        setImportError(null);
        setImportSummary(null);

        if (!txt) {
            setImportError("Selecciona el TXT descargado del SRI.");
            return;
        }

        setImportLoading(true);
        try {
            const fd = new FormData();
            fd.append("txt", txt);

            const res = await fetch("/api/sri/import", {
                method: "POST",
                body: fd
            });

            const json = await res.json();

            if (!res.ok || !json.ok) throw new Error(json?.error || "Error importando.");

            setImportSummary(json.summary);
            setTxt(null);
            fetchTable(1);
        } catch (e: any) {
            setImportError(e?.message || "Error.");
        } finally {
            setImportLoading(false);
        }
    }

    function toggleSort(col: string) {
        if (sortBy === col) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortBy(col);
            setSortDir("asc");
        }
    }

    function sortIndicator(col: string) {
        if (sortBy !== col) return null;
        return sortDir === "asc" ? " ▲" : " ▼";
    }

    return (
        <div className="min-h-screen bg-neutral-100">
            <header className="border-b bg-black text-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="text-xl font-bold tracking-widest">SEDEMI</div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
                        >
                            Volver
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1500px] px-1 py-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900">Facturas SRI</h1>
                    <p className="mt-2 text-sm text-neutral-500">
                        Importa el TXT del SRI y consulta comprobantes con filtros, ordenamiento y acceso a documentos.
                    </p>
                </div>

                <div className="space-y-6">
                    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-neutral-900">Importar TXT</h2>
                                <p className="mt-1 text-sm text-neutral-500">
                                    Carga el archivo TXT descargado del SRI para registrar comprobantes en el sistema.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                                <label
                                    htmlFor="sriTxtFile"
                                    className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                                >
                                    Elegir archivo
                                </label>

                                <input
                                    id="sriTxtFile"
                                    type="file"
                                    accept=".txt,text/plain"
                                    onChange={(e) => setTxt(e.target.files?.[0] ?? null)}
                                    className="hidden"
                                />

                                <div className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
                                    {txt ? (
                                        <div className="flex flex-col">
                                            <span className="truncate font-medium">{txt.name}</span>
                                            <span className="mt-1 text-xs text-neutral-500">
                                                {(txt.size / 1024).toFixed(1)} KB
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-neutral-400">No se ha seleccionado ningún archivo</span>
                                    )}
                                </div>

                                <button
                                    className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    onClick={handleImport}
                                    disabled={importLoading}
                                >
                                    {importLoading ? "Registrando..." : "Registrar"}
                                </button>
                            </div>
                        </div>

                        {importError && (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {importError}
                            </div>
                        )}

                        {importSummary && (
                            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                                Importación OK — Archivo: <b>{importSummary.file}</b> | Filas: <b>{importSummary.totalRows}</b> |
                                Insertadas: <b>{importSummary.inserted}</b> | Duplicadas: <b>{importSummary.duplicates}</b>
                            </div>
                        )}
                    </section>

                    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-neutral-900">Listado</h2>
                                <p className="mt-1 text-sm text-neutral-500">
                                    Visualiza, filtra y ordena la información importada.
                                </p>
                            </div>

                            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-600">
                                {loading ? "Cargando..." : `Total: ${total.toLocaleString("es-EC")}`}
                            </div>
                        </div>

                        <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                            <div>
                                <label htmlFor="fromDate" className="mb-2 block text-sm font-medium text-neutral-700">
                                    Desde
                                </label>
                                <input
                                    id="fromDate"
                                    type="date"
                                    value={filters.from}
                                    onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-black"
                                />
                            </div>

                            <div>
                                <label htmlFor="toDate" className="mb-2 block text-sm font-medium text-neutral-700">
                                    Hasta
                                </label>
                                <input
                                    id="toDate"
                                    type="date"
                                    value={filters.to}
                                    onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-black"
                                />
                            </div>

                            <div>
                                <label htmlFor="rucEmisorFilter" className="mb-2 block text-sm font-medium text-neutral-700">
                                    RUC emisor
                                </label>
                                <input
                                    id="rucEmisorFilter"
                                    value={filters.rucEmisor}
                                    onChange={(e) => setFilters((p) => ({ ...p, rucEmisor: e.target.value }))}
                                    placeholder="RUC..."
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-black"
                                />
                            </div>

                            <div>
                                <label htmlFor="razonSocialFilter" className="mb-2 block text-sm font-medium text-neutral-700">
                                    Razón social
                                </label>
                                <input
                                    id="razonSocialFilter"
                                    value={filters.razonSocialEmisor}
                                    onChange={(e) => setFilters((p) => ({ ...p, razonSocialEmisor: e.target.value }))}
                                    placeholder="Buscar razón social..."
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-black"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                                    onClick={() =>
                                        setFilters({
                                            claveAcceso: "",
                                            rucEmisor: "",
                                            razonSocialEmisor: "",
                                            tipoComprobante: "",
                                            serieComprobante: "",
                                            identificacionReceptor: "",
                                            from: "",
                                            to: ""
                                        })
                                    }
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        </div>

                        <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                            <div>
                                <label htmlFor="tipoComprobanteFilter" className="mb-2 block text-sm font-medium text-neutral-700">
                                    Tipo comprobante
                                </label>
                                <input
                                    id="tipoComprobanteFilter"
                                    value={filters.tipoComprobante}
                                    onChange={(e) => setFilters((p) => ({ ...p, tipoComprobante: e.target.value }))}
                                    placeholder="Factura"
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-black"
                                />
                            </div>

                            <div>
                                <label htmlFor="serieComprobanteFilter" className="mb-2 block text-sm font-medium text-neutral-700">
                                    Serie
                                </label>
                                <input
                                    id="serieComprobanteFilter"
                                    value={filters.serieComprobante}
                                    onChange={(e) => setFilters((p) => ({ ...p, serieComprobante: e.target.value }))}
                                    placeholder="001-002-..."
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-black"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="claveAccesoFilter" className="mb-2 block text-sm font-medium text-neutral-700">
                                    Clave de acceso
                                </label>
                                <input
                                    id="claveAccesoFilter"
                                    value={filters.claveAcceso}
                                    onChange={(e) => setFilters((p) => ({ ...p, claveAcceso: e.target.value }))}
                                    placeholder="Clave acceso..."
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-black"
                                />
                            </div>
                        </div>

                        {tableError && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {tableError}
                            </div>
                        )}

                        <div className="overflow-hidden rounded-2xl border border-neutral-200">
                            <div className="overflow-x-auto">
                                {/*             <table className="min-w-full divide-y divide-neutral-200 text-sm"> */}
                                <table className="w-full table-fixed divide-y divide-neutral-200 text-[13px]">
                                    <thead className="bg-neutral-50">
                                        <tr>
                                            <th className="w-[90px] cursor-pointer px-3 py-2 text-left font-semibold text-neutral-700" onClick={() => toggleSort("fechaEmision")}>
                                                Emisión{sortIndicator("fechaEmision")}
                                            </th>
                                            <th className="w-[95px] cursor-pointer px-3 py-2 text-left font-semibold text-neutral-700" onClick={() => toggleSort("fechaAutorizacion")}>
                                                Autorización{sortIndicator("fechaAutorizacion")}
                                            </th>
                                            <th className="w-[130px] cursor-pointer px-3 py-2 text-left font-semibold text-neutral-700" onClick={() => toggleSort("rucEmisor")}>
                                                RUC Emisor{sortIndicator("rucEmisor")}
                                            </th>
                                            <th className="w-[200px] cursor-pointer px-3 py-2 text-left font-semibold text-neutral-700" onClick={() => toggleSort("razonSocialEmisor")}>
                                                Razón Social{sortIndicator("razonSocialEmisor")}
                                            </th>
                                            <th className="w-[110px] cursor-pointer px-3 py-2 text-left font-semibold text-neutral-700" onClick={() => toggleSort("tipoContribuyente")}>
                                                Tipo Contrib.
                                                {sortIndicator("tipoContribuyente")}
                                            </th>
                                            <th className="w-[95px] cursor-pointer px-3 py-2 text-left font-semibold text-neutral-700" onClick={() => toggleSort("regimen")}>
                                                Régimen{sortIndicator("regimen")}
                                            </th>
                                            <th className="w-[80px] cursor-pointer px-3 py-2 text-left font-semibold text-neutral-700" onClick={() => toggleSort("tipoComprobante")}>
                                                Tipo{sortIndicator("tipoComprobante")}
                                            </th>
                                            <th className="w-[110px] cursor-pointer px-3 py-2 text-left font-semibold text-neutral-700" onClick={() => toggleSort("serieComprobante")}>
                                                Serie{sortIndicator("serieComprobante")}
                                            </th>
                                            <th className="w-[130px] px-3 py-2 text-left font-semibold text-neutral-700">
                                                Clave Acceso
                                            </th>
                                            <th className="w-[90px] cursor-pointer px-3 py-2 text-left font-semibold text-neutral-700" onClick={() => toggleSort("valorSinImpuestos")}>
                                                Valor S/IMP{sortIndicator("valorSinImpuestos")}
                                            </th>
                                            <th className="w-[70px] cursor-pointer px-3 py-2 text-left font-semibold text-neutral-700" onClick={() => toggleSort("iva")}>
                                                IVA{sortIndicator("iva")}
                                            </th>
                                            <th className="w-[80px] cursor-pointer px-3 py-2 text-left font-semibold text-neutral-700" onClick={() => toggleSort("importeTotal")}>
                                                Total{sortIndicator("importeTotal")}
                                            </th>
                                            <th className="w-[95px] px-3 py-2 text-left font-semibold text-neutral-700">
                                                Docs
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-neutral-200 bg-white">
                                        {data.length === 0 && !loading ? (
                                            <tr>
                                                <td colSpan={13} className="px-4 py-8 text-center text-sm text-neutral-400">
                                                    Sin resultados
                                                </td>
                                            </tr>
                                        ) : (
                                            data.map((r) => (
                                                <tr key={r.id} className="hover:bg-neutral-50">
                                                    <td className="px-3 py-3 text-neutral-700">{fmtDate(r.fechaEmision)}</td>
                                                    <td className="px-3 py-3 text-neutral-700">{fmtDate(r.fechaAutorizacion)}</td>
                                                    <td className="px-3 py-3 text-neutral-700">{r.rucEmisor}</td>

                                                    <td className="px-3 py-3 text-neutral-700">
                                                        <div className="flex items-center gap-1 leading-snug">
                                                            <span className="line-clamp-3">{r.razonSocialEmisor}</span>
                                                            {r.rucProfile?.actividadEconomicaPrincipal ? (
                                                                <span
                                                                    title={r.rucProfile.actividadEconomicaPrincipal}
                                                                    className="shrink-0 cursor-help text-lg opacity-600"
                                                                >
                                                                    ℹ️
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </td>

                                                    <td className="px-3 py-3  text-neutral-700">
                                                        {r.rucProfile?.tipoContribuyente ?? "—"}
                                                    </td>
                                                    <td className="px-3 py-3  text-neutral-700">
                                                        {r.rucProfile?.regimen ?? "—"}
                                                    </td>

                                                    <td className="px-3 py-3  text-neutral-700">{r.tipoComprobante}</td>
                                                    <td className="px-3 py-3 text-[12px] text-neutral-700">{r.serieComprobante}</td>

                                                    <td className="px-3 py-3 ">
                                                        <button
                                                            type="button"
                                                            onClick={() => copyText(r.id, r.claveAcceso)}
                                                            className="group w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-2 text-left text-[11px] text-neutral-700 transition hover:bg-neutral-100" title={r.claveAcceso}
                                                        >
                                                            <div className="flex flex-col leading-tight">
                                                                <span className="font-medium">
                                                                    {r.claveAcceso.slice(0, 10)}…{r.claveAcceso.slice(-8)}
                                                                </span>
                                                                <span className="mt-1 text-[10px] text-neutral-400 group-hover:text-neutral-500">
                                                                    {copiedClave === r.id ? "Copiado ✓" : "Copiar"}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    </td>

                                                    <td className="px-3 py-3  text-neutral-700">{fmtMoney(r.valorSinImpuestos)}</td>
                                                    <td className="px-3 py-3  text-neutral-700">{fmtMoney(r.iva)}</td>
                                                    <td className="px-3 py-3  font-medium text-neutral-900">{fmtMoney(r.importeTotal)}</td>

                                                    <td className="px-3 py-3 ">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {r.files?.map((file) => (
                                                                <a
                                                                    key={file.storagePath}
                                                                    href={file.storagePath}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title={`Ver ${file.kind}`}
                                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-base transition hover:bg-neutral-50"
                                                                >
                                                                    {file.kind === "PDF" ? "📕" : "📄"}
                                                                </a>
                                                            ))}

                                                            {(!r.files || r.files.length === 0) && (
                                                                <span className="text-lg opacity-30" title="Sin archivos">
                                                                    ⌛
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={page <= 1 || loading}
                                onClick={() => fetchTable(page - 1)}
                            >
                                ◀ Anterior
                            </button>

                            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-700">
                                Página <b>{page}</b> de <b>{totalPages}</b>
                            </div>

                            <button
                                className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={page >= totalPages || loading}
                                onClick={() => fetchTable(page + 1)}
                            >
                                Siguiente ▶
                            </button>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}