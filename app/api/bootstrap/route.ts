import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { aadObjectId, userPrincipalName, mail, displayName } = await req.json();

    if (!aadObjectId || !userPrincipalName || !displayName) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    const upn = String(userPrincipalName).toLowerCase();
    const mailNorm = mail ? String(mail).toLowerCase() : null;

    const bootstrapAdmin = (process.env.BOOTSTRAP_ADMIN_EMAIL || "").toLowerCase();
    const role = upn === bootstrapAdmin ? "ADMIN" : "COLABORADOR";

    const user = await prisma.user.upsert({
      where: { aadObjectId },
      create: {
        aadObjectId,
        upn,
        mail: mailNorm,
        displayName,
        role: role as any,
      },
      update: {
        // si ya existe, actualiza datos "seguros" (no cambies role aquí si ya lo gestiona admin)
        upn,
        mail: mailNorm,
        displayName,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
