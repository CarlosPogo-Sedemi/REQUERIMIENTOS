import crypto from "crypto";
import bcrypt from "bcryptjs";

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function hashCedula(cedula: string) {
  const saltRounds = 10;
  return bcrypt.hash(cedula, saltRounds);
}

export async function verifyCedula(cedula: string, hash: string) {
  return bcrypt.compare(cedula, hash);
}

export function generateToken() {
  // token aleatorio (URL-safe)
  return crypto.randomBytes(32).toString("base64url");
}
