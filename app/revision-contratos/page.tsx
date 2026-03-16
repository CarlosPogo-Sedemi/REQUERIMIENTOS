"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";


type ProcessStep = "idle" | "uploading" | "processing" | "downloading" | "done" | "error";

export default function RevisionContratosPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [step, setStep] = useState<ProcessStep>("idle");
  const [generatedAt, setGeneratedAt] = useState<string>("");

  const fileSizeLabel = useMemo(() => {
    if (!file) return "";
    const sizeKb = file.size / 1024;
    if (sizeKb < 1024) return `${sizeKb.toFixed(1)} KB`;
    return `${(sizeKb / 1024).toFixed(2)} MB`;
  }, [file]);

  const stepLabel = useMemo(() => {
    switch (step) {
      case "uploading":
        return "Subiendo archivo...";
      case "processing":
        return "Analizando comentarios y generando contrato...";
      case "downloading":
        return "Preparando descarga del documento...";
      case "done":
        return "Documento generado correctamente";
      case "error":
        return "Ocurrió un error";
      default:
        return "Listo para procesar";
    }
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!file) {
      setError("Selecciona un archivo .docx antes de continuar.");
      setStep("error");
      return;
    }

    try {
      setLoading(true);
      setStep("uploading");

      const apiUrl = process.env.NEXT_PUBLIC_CONTRATOS_API_URL;

      if (!apiUrl) {
        throw new Error("No está configurada la URL del backend de contratos.");
      }

      const formData = new FormData();
      formData.append("file", file);

      setStep("processing");

      const res = await fetch(`${apiUrl}/api/contratos/revisar`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data?.detail || data?.error || "Error al procesar el archivo");
        } else {
          const text = await res.text();
          console.error("Respuesta no JSON:", text);
          throw new Error("El servidor devolvió un error no controlado.");
        }
      }

      setStep("downloading");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(".docx", "") + "_REVISADO.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      const now = new Date();
      setGeneratedAt(now.toLocaleString("es-EC"));
      setSuccessMessage("El contrato fue generado y descargado correctamente.");
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Error inesperado");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="border-b bg-black text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-xl font-bold tracking-widest">SEDEMI</div>

          <div className="flex items-center gap-3">
            <label
              onClick={() => router.push("/dashboard")}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Regresar
            </label>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Revisión de contratos con IA</h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-600">
            Carga un contrato en formato Word para analizar comentarios, corregir la redacción y
            generar una nueva versión estructurada del documento.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">Generar contrato corregido</h2>
              <p className="mt-1 text-sm text-neutral-500">
                El procesamiento puede tardar entre 2 y 4 minutos dependiendo del tamaño del archivo
                y la cantidad de observaciones.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5">
                <label htmlFor="contractFile" className="mb-3 block text-sm font-medium text-neutral-700">
                  Selecciona el contrato en Word
                </label>

                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <label
                    htmlFor="contractFile"
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                  >
                    Elegir archivo
                  </label>

                  <input
                    id="contractFile"
                    type="file"
                    accept=".docx"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null);
                      setError("");
                      setSuccessMessage("");
                      setStep("idle");
                    }}
                    className="hidden"
                  />

                  <div className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
                    {file ? (
                      <div className="flex flex-col">
                        <span className="truncate font-medium">{file.name}</span>
                        <span className="mt-1 text-xs text-neutral-500">{fileSizeLabel}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-400">No se ha seleccionado ningún archivo</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Procesando..." : "Subir y corregir"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setError("");
                    setSuccessMessage("");
                    setGeneratedAt("");
                    setStep("idle");
                  }}
                  className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-900">Estado del proceso</h3>

            <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <div className="flex items-center gap-3">
                <div
                  className={`h-4 w-4 rounded-full ${loading
                      ? "animate-pulse bg-amber-500"
                      : step === "done"
                        ? "bg-green-500"
                        : step === "error"
                          ? "bg-red-500"
                          : "bg-neutral-300"
                    }`}
                />
                <span className="text-sm font-medium text-neutral-800">{stepLabel}</span>
              </div>

              {loading && (
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-red-600" />
                  </div>
                  <p className="mt-3 text-xs text-neutral-500">
                    El archivo se está procesando. No cierres esta ventana.
                  </p>
                </div>
              )}

              {!loading && step === "idle" && (
                <p className="mt-3 text-xs text-neutral-500">
                  Una vez cargado el documento, el sistema analizará comentarios, reescribirá el contrato
                  y descargará automáticamente la nueva versión.
                </p>
              )}

              {generatedAt && (
                <p className="mt-3 text-xs text-neutral-500">
                  Último documento generado: {generatedAt}
                </p>
              )}
            </div>

            {successMessage && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Historial de generación</h3>
              <p className="text-sm text-neutral-500">
                Este bloque queda listo para enlazar los documentos guardados en OneDrive o SharePoint.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Documento</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {generatedAt && file ? (
                  <tr>
                    <td className="px-4 py-4 text-neutral-800">{file.name.replace(".docx", "")}_REVISADO.docx</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        Generado
                      </span>
                    </td>
                    <td className="px-4 py-4 text-neutral-600">{generatedAt}</td>
                    <td className="px-4 py-4 text-neutral-500">
                      Descargado localmente
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                      Aún no hay documentos registrados en esta sesión.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}