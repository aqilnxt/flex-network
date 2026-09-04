import { simulatedProvider } from "./provider-simulated";
import { privyProvider } from "./provider-privy";
import type { SignatureProvider } from "./types";

export function getSignatureProvider(): SignatureProvider {
  const mode = process.env.SIGNATURE_MODE ?? "simulated";
  return mode === "privy" ? privyProvider : simulatedProvider;
}
export type { SignatureProvider } from "./types";
