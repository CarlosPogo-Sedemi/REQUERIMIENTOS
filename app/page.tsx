"use client";

import { useMsal } from "@azure/msal-react";

export default function LoginPage() {
  const { instance } = useMsal();

  const login = async () => {
    sessionStorage.setItem("postLoginRedirect", "/dashboard");

    await instance.loginRedirect({
      scopes: ["User.Read", "User.ReadBasic.All"],
      redirectStartPage: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl lg:grid-cols-2">
          <div className="hidden bg-black p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="text-2xl font-bold tracking-[0.25em]">SEDEMI</div>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/75">
                Sistema interno para gestión documental, seguimiento de requerimientos
                y automatización de procesos empresariales.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-semibold">Acceso corporativo seguro</h3>
                <p className="mt-2 text-sm text-white/70">
                  El ingreso está habilitado únicamente para cuentas institucionales
                  de SEDEMI autenticadas con Microsoft.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-semibold">Flujos centralizados</h3>
                <p className="mt-2 text-sm text-white/70">
                  Desde esta plataforma podrás gestionar módulos internos como facturas,
                  contratos, CRM y otros procesos integrados.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center bg-white p-8 sm:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <div className="text-3xl font-bold tracking-widest text-neutral-900 lg:hidden">
                  SEDEMI
                </div>
                <h1 className="mt-2 text-3xl font-bold text-neutral-900">
                  Iniciar sesión
                </h1>
                <p className="mt-3 text-sm leading-6 text-neutral-500">
                  Accede a la plataforma de requerimientos y gestión interna usando tu
                  cuenta corporativa de Microsoft.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
                <button
                  onClick={login}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100"
                >
                  <span className="grid h-5 w-5 grid-cols-2 grid-rows-2 gap-[2px]">
                    <span className="bg-[#f25022]" />
                    <span className="bg-[#7fba00]" />
                    <span className="bg-[#00a4ef]" />
                    <span className="bg-[#ffb900]" />
                  </span>
                  Iniciar sesión con Microsoft
                </button>

                <p className="mt-4 text-center text-xs leading-5 text-neutral-500">
                  Acceso exclusivo para usuarios corporativos de SEDEMI.
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                <p className="font-medium text-neutral-800">Antes de ingresar</p>
                <ul className="mt-2 space-y-2 text-sm text-neutral-500">
                  <li>• Usa tu cuenta institucional activa.</li>
                  <li>• Verifica que tengas permisos asignados en la plataforma.</li>
                  <li>• Si tienes inconvenientes, contacta al equipo SIG/TI.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}