import crypto from "crypto";

export function makeSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
