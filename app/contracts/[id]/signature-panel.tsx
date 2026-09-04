import { redirect } from "next/navigation";
import {
  requestSignatureAction,
  signDocumentAction,
} from "@/modules/signature/actions";
import type { SignatureInfo } from "@/modules/signature/service";

type SignaturePanelProps = {
  info: SignatureInfo;
  contractId: string;
  viewerId: string;
  talentId: string;
  hirerId: string;
  contractStatus: string;
  actionError?: string;
};

export function SignaturePanel({
  info,
  contractId,
  viewerId,
  talentId,
  hirerId,
  contractStatus,
  actionError,
}: SignaturePanelProps) {
  const isTalent = viewerId === talentId;
  const isHirer = viewerId === hirerId;
  const modeLabel = info.mode === "privy" ? "Privy" : "Simulasi";

  async function submitRequestSignature(): Promise<void> {
    "use server";
    const formData = new FormData();
    formData.set("contractId", contractId);
    const result = await requestSignatureAction(formData);
    if (!result.success) {
      redirect(
        `/contracts/${contractId}?signature_error=${encodeURIComponent(result.error.message)}`,
      );
    }
    redirect(`/contracts/${contractId}`);
  }

  async function submitSignDocument(): Promise<void> {
    "use server";
    const formData = new FormData();
    formData.set("contractId", contractId);
    const result = await signDocumentAction(formData);
    if (!result.success) {
      redirect(
        `/contracts/${contractId}?signature_error=${encodeURIComponent(result.error.message)}`,
      );
    }
    redirect(`/contracts/${contractId}`);
  }

  const showRequest = contractStatus === "DRAFT" && isHirer;
  const showPending = contractStatus === "PENDING_SIGNATURE";
  const showSigned = contractStatus === "ACTIVE" && Boolean(info.signedDocumentUrl);

  if (!showRequest && !showPending && !showSigned) return null;

  const canSign =
    showPending &&
    ((isTalent && !info.talentSignedAt) || (isHirer && !info.hirerSignedAt));

  return (
    <div className="card mt-3 p-4 flex flex-col gap-2 text-sm">
      <p className="font-medium">Tanda Tangan Digital</p>

      {actionError && (
        <p
          role="alert"
          className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]"
        >
          {actionError}
        </p>
      )}

      {showRequest && (
        <div className="flex flex-col gap-2">
          <p className="text-ink-2">
            Kirim kontrak ke tanda tangan digital kedua pihak (mode {modeLabel}).
          </p>
          <form action={submitRequestSignature}>
            <button className="btn-primary px-4 py-2 text-sm">
              Kirim ke Tanda Tangan (Simulasi)
            </button>
          </form>
        </div>
      )}

      {showPending && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1 text-xs font-semibold text-[#B45309]">
              Menunggu Tanda Tangan
            </span>
            <span className="badge">{modeLabel}</span>
          </div>
          <p>Talent: {info.talentSignedAt ? "✔ ditandatangani" : "belum"}</p>
          <p>Hirer: {info.hirerSignedAt ? "✔ ditandatangani" : "belum"}</p>
          {canSign && (
            <form action={submitSignDocument} className="mt-2">
              <button className="btn-primary px-4 py-2 text-sm">
                Tanda Tangani (Simulasi)
              </button>
            </form>
          )}
        </>
      )}

      {showSigned && (
        <>
          <span className="self-start rounded-full bg-[#EAFBF1] px-2.5 py-1 text-xs font-semibold text-[#15803D]">
            Telah Ditandatangani
          </span>
          {info.hash && (
            <p className="text-ink-2">
              Hash:{" "}
              <span className="font-mono text-xs" title={info.hash}>
                {info.hash.slice(0, 16)}
              </span>
            </p>
          )}
          {info.downloadUrl && (
            <a
              href={info.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start text-sm text-primary hover:underline"
            >
              Unduh Dokumen
            </a>
          )}
        </>
      )}
    </div>
  );
}
