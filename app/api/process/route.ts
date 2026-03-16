import fs from "fs";
import path from "path";

export async function POST(req: Request) {

  try {

    const text = await req.text();

    if (!text) {
      return Response.json(
        { error: "Body vacío" },
        { status: 400 }
      );
    }

    const body = JSON.parse(text);

    const fileName = body.fileName;
    const fileContent = body.fileContent;

    const buffer = Buffer.from(fileContent, "base64");

    const outputPath = path.join(process.cwd(), "storage", fileName);

    fs.writeFileSync(outputPath, buffer);

    return Response.json({
      status: "saved",
      file: fileName
    });

  } catch (error) {

    return Response.json(
      { error: "Invalid request", details: String(error) },
      { status: 500 }
    );

  }

}