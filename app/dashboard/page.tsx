"use client";

import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { instance } = useMsal();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const account = instance.getActiveAccount() || instance.getAllAccounts()[0];

    if (!account) {
      window.location.href = "/";
      return;
    }

    (async () => {
      try {
        const activeAccount = instance.getActiveAccount() || instance.getAllAccounts()[0];
        if (!activeAccount) return;

        const token = await instance.acquireTokenSilent({
          account: activeAccount,
          scopes: ["User.Read"]
        });

        const r = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token.accessToken}` }
        });

        const json = await r.json();
        setData(json);

        const r2 = await fetch("/api/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aadObjectId: json.aadObjectId,
            userPrincipalName: json.me?.userPrincipalName,
            mail: json.me?.mail,
            displayName: json.me?.displayName
          })
        });

        const b = await r2.json();

        if (b?.ok) {
          setData((prev: any) => ({ ...prev, appUser: b.user }));

          if (b.user?.isActive === false) {
            await instance.logoutRedirect({
              postLogoutRedirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/`
            });
            return;
          }
        }

        if (!json?.found) {
          setErr("No existe vínculo en ESTRUCTURA GENERAL (AADObjectId).");
        } else {
          setErr(null);
        }
      } catch (e: any) {
        setErr(e?.message || "Error");
      }
    })();
  }, [instance]);

  const emp = data?.employee;
  const roleLabel = data?.appUser?.role?.toLowerCase() || "colaborador";

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b bg-black text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-xl font-bold tracking-widest">SEDEMI</div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold">
              Rol: {roleLabel}
            </span>

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Perfil</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Información general del colaborador y accesos disponibles dentro de la plataforma.
          </p>
        </div>

        {err && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {!data ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-pulse rounded-full bg-amber-500" />
              <p className="text-sm text-neutral-700">Cargando perfil...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-neutral-900">Cuenta Microsoft</h2>

              <div className="mt-5 divide-y divide-neutral-200">
                <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-sm text-neutral-500">Nombre</span>
                  <span className="text-right font-semibold text-neutral-900">{emp?.field_2}</span>
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-sm text-neutral-500">Usuario</span>
                  <span className="text-right font-semibold text-neutral-900">{data.me?.displayName}</span>
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-sm text-neutral-500">Email</span>
                  <span className="text-right font-semibold text-neutral-900">{data.me?.userPrincipalName}</span>
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-sm text-neutral-500">Cargo (Graph)</span>
                  <span className="text-right font-semibold text-neutral-900">{data.me?.jobTitle || "-"}</span>
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-sm text-neutral-500">AAD Object ID</span>
                  <code className="max-w-[60%] break-all text-right text-xs text-neutral-700">
                    {data.aadObjectId}
                  </code>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-neutral-900">Estructura General</h2>

              {emp ? (
                <div className="mt-5 divide-y divide-neutral-200">
                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-sm text-neutral-500">Cédula</span>
                    <span className="text-right font-semibold text-neutral-900">{emp.Title}</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-sm text-neutral-500">EKON</span>
                    <span className="text-right font-semibold text-neutral-900">{emp.field_1}</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-sm text-neutral-500">Nombre</span>
                    <span className="text-right font-semibold text-neutral-900">{emp.field_2}</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-sm text-neutral-500">Unidad</span>
                    <span className="text-right font-semibold text-neutral-900">{emp.field_3}</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-sm text-neutral-500">Departamento</span>
                    <span className="text-right font-semibold text-neutral-900">{emp.field_4}</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-sm text-neutral-500">Área</span>
                    <span className="text-right font-semibold text-neutral-900">{emp.field_5}</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-sm text-neutral-500">Cargo</span>
                    <span className="text-right font-semibold text-neutral-900">{emp.field_6}</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-sm text-neutral-500">Macroproceso</span>
                    <span className="text-right font-semibold text-neutral-900">{emp.MACROPROCESO}</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-sm text-neutral-500">Grupo Pago</span>
                    <span className="text-right font-semibold text-neutral-900">{emp.GrupoPago}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
                  No encontrado.
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-xl font-semibold text-neutral-900">Siguientes acciones</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Accesos y módulos disponibles según el rol del usuario.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
                  Crear ticket (próximo paso)
                </button>

                <button className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">
                  Mis tickets
                </button>

                {data?.appUser?.role === "ADMIN" && (
                  <button
                    onClick={() => router.push("/admin/users")}
                    className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Administración
                  </button>
                )}

                {(data?.appUser?.role === "GESTOR_TTHH" || data?.appUser?.role === "ADMIN") && (
                  <button
                    onClick={() => router.push("/tthh/cases")}
                    className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Gestión TTHH
                  </button>
                )}

                {(data?.appUser?.role === "ADMIN" || data?.appUser?.role === "COLABORADOR") && (
                  <button
                    onClick={() => router.push("/sri")}
                    className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Facturas
                  </button>
                )}

                {data?.appUser?.role === "ADMIN" && (
                  <button
                    onClick={() => router.push("/dashboard-zoho")}
                    className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Zoho CRM
                  </button>
                )}

                {(data?.appUser?.role === "ADMIN" || data?.appUser?.role === "COLABORADOR") && (
                  <button
                    onClick={() => router.push("/revision-contratos")}
                    className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Contratos
                  </button>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}