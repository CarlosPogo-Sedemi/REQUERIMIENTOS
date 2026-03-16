import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ ok: false, error: "Missing token" }, { status: 401 });
    }
    const token = auth.replace("Bearer ", "");

    // 1) obtener /me con Graph (solo requiere User.Read)
    const meResp = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await meResp.json();
    if (!meResp.ok) {
      return NextResponse.json({ ok: false, error: "Graph /me failed", details: me }, { status: meResp.status });
    }

    const aadObjectId = me.id as string;
    const flowUrl = process.env.PROFILE_FLOW_URL;
    if (!flowUrl) {
      return NextResponse.json({ ok: false, error: "Missing PROFILE_FLOW_URL" }, { status: 500 });
    }

    // 2) llamar al Flow wrapper (SharePoint)
    const flowResp = await fetch(flowUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadObjectId }),
    });

    const flowText = await flowResp.text();
    let flowData: any;
    try {
      flowData = JSON.parse(flowText);
    } catch {
      flowData = { raw: flowText };
    }

    if (!flowResp.ok) {
      return NextResponse.json(
        { ok: false, error: "Flow failed", status: flowResp.status, flow: flowData, me },
        { status: 502 }
      );
    }

    // esperamos estructura tipo: { ok, count, items }
    const items = flowData.items ?? flowData.value ?? [];
    const found = Array.isArray(items) && items.length > 0;

    return NextResponse.json({
      ok: true,
      found,
      aadObjectId,
      me: {
        displayName: me.displayName,
        mail: me.mail,
        userPrincipalName: me.userPrincipalName,
        id: me.id,
        jobTitle: me.jobTitle,
      },
      employee: found ? items[0] : null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
