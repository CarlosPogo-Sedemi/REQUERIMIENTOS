
"use client";

import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";

type Role = "COLABORADOR" | "ADMIN" | "GESTOR_TTHH";

type UserRow = {
  id: string;
  displayName: string;
  upn: string;
  mail: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

type StatusFilter = "active" | "inactive" | "all";

export default function AdminUsersPage() {
  const { instance } = useMsal();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [status, setStatus] = useState<StatusFilter>("active");
  const [searchQuery, setSearchQuery] = useState("");

  const roleOptions: { value: Role; label: string }[] = useMemo(
    () => [
      { value: "COLABORADOR", label: "Colaborador" },
      { value: "GESTOR_TTHH", label: "Gestor TTHH" },
      { value: "ADMIN", label: "Administrador" }
    ],
    []
  );

  const getToken = async () => {
    const account = instance.getActiveAccount() || instance.getAllAccounts()[0];
    if (!account) throw new Error("No hay sesión activa. Vuelve a iniciar sesión.");

    const token = await instance.acquireTokenSilent({
      account,
      scopes: ["User.Read"]
    });

    return token.accessToken;
  };

  const loadUsers = async (opts?: {
    page?: number;
    status?: StatusFilter;
    searchQuery?: string;
  }) => {
    setLoading(true);
    setError(null);

    const nextPage = opts?.page ?? page;
    const nextStatus = opts?.status ?? status;
    const nextQ = opts?.searchQuery ?? searchQuery;

    try {
      const accessToken = await getToken();

      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("status", nextStatus);
      if (nextQ) params.set("searchQuery", nextQ.trim());

      const r = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const text = await r.text();
      let json: any;

      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Respuesta no-JSON (status ${r.status}): ${text.slice(0, 160)}`);
      }

      if (!r.ok || !json.ok) {
        throw new Error(json?.error || `Error cargando usuarios (status ${r.status})`);
      }

      setUsers(json.users || []);
      setPage(json.page || nextPage);
      setTotalPages(json.totalPages || 1);
      setStatus(json.status || nextStatus);
    } catch (e: any) {
      setError(e?.message || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  const patchUser = async (
    id: string,
    payload: Partial<Pick<UserRow, "role" | "isActive">>
  ) => {
    setSavingId(id);
    setError(null);

    try {
      const accessToken = await getToken();

      const r = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const text = await r.text();
      let json: any;

      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Respuesta no-JSON (status ${r.status}): ${text.slice(0, 160)}`);
      }

      if (!r.ok || !json.ok) {
        throw new Error(json?.error || `Error actualizando (status ${r.status})`);
      }

      const updated: UserRow = json.user;
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    } catch (e: any) {
      setError(e?.message || "Error actualizando usuario");
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApplyFilters = () => loadUsers({ page: 1, status, searchQuery });
  const onPrev = () => loadUsers({ page: Math.max(1, page - 1) });
  const onNext = () => loadUsers({ page: Math.min(totalPages, page + 1) });

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

            <button
              onClick={() => loadUsers()}
              disabled={loading}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Recargar
            </button>

            <button
              onClick={() => instance.logoutRedirect()}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Administración de usuarios</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Gestiona usuarios de la plataforma, cambia roles y controla el estado
              de acceso de cada cuenta.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto">
            <button
              onClick={onPrev}
              disabled={loading || page <= 1}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ←
            </button>

            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 shadow-sm">
              Página <span className="font-semibold">{page}</span> / {totalPages}
            </div>

            <button
              onClick={onNext}
              disabled={loading || page >= totalPages}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end">
            <div className="w-full lg:max-w-[220px]">
              <label
                htmlFor="statusFilter"
                className="mb-2 block text-sm font-medium text-neutral-700">
                Estado
              </label>
              <select
                id="statusFilter"
                aria-label="Filtrar usuarios por estado"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-black"
              >
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="all">Todos</option>
              </select>
            </div>

            <div className="w-full lg:max-w-md">
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Búsqueda
              </label>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre, UPN o mail"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-black"
              />
            </div>

            <button
              onClick={onApplyFilters}
              disabled={loading}
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Aplicar
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 animate-pulse rounded-full bg-amber-500" />
                <span className="text-sm font-medium text-neutral-700">
                  Cargando usuarios...
                </span>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-neutral-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                        UPN (principal)
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                        Mail
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                        Rol
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                        Activo
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                        Creado
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {users.map((u) => {
                      const saving = savingId === u.id;

                      return (
                        <tr
                          key={u.id}
                          className={!u.isActive ? "bg-neutral-50/70" : ""}
                        >
                          <td className="px-4 py-4 align-top">
                            <div className="font-semibold text-neutral-900">
                              {u.displayName}
                            </div>
                            <div className="mt-1 text-xs text-neutral-500 break-all">
                              ID: {u.id}
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="break-all font-mono text-xs text-neutral-800">
                              {u.upn}
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="break-all font-mono text-xs text-neutral-800">
                              {u.mail || "-"}
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <select
                              aria-label="{`Cambiar rol de ${u.displayName}`}"
                              title={`Cambiar rol de ${u.displayName}`}
                              value={u.role}
                              disabled={saving}
                              onChange={(e) =>
                                patchUser(u.id, { role: e.target.value as Role })
                              }
                              className="w-full min-w-[170px] rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none transition focus:border-black disabled:opacity-60"
                            >
                              {roleOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <button
                              type="button"
                              aria-label={
                                u.isActive
                                  ? `Desactivar usuario ${u.displayName}`
                                  : `Activar usuario ${u.displayName}`
                              }
                              title={
                                u.isActive
                                  ? `Desactivar usuario ${u.displayName}`
                                  : `Activar usuario ${u.displayName}`

                              }
                              disabled={saving}
                              onClick={() =>
                                patchUser(u.id, { isActive: !u.isActive })
                              }
                              className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${u.isActive ? "bg-green-600" : "bg-neutral-300"
                                } disabled:opacity-60`}
                            >
                              <span
                                aria-hidden="true"
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${u.isActive ? "translate-x-8" : "translate-x-1"
                                  }`}
                              />
                            </button>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="text-xs text-neutral-700">
                              {new Date(u.createdAt).toLocaleString("es-EC")}
                            </div>
                            {saving && (
                              <div className="mt-2 text-xs font-medium text-amber-600">
                                Guardando...
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {users.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-sm text-neutral-400"
                        >
                          Sin resultados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}