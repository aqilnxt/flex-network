import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createHash } from "crypto";
import type { DocumentContractData } from "./types";

const BOILERPLATE = [
  "KLAUSUL STANDAR:",
  "1. Talent wajib melaksanakan tanggung jawab sesuai posisi dengan itikad baik.",
  "2. Kedua pihak wajib menjaga kerahasiaan informasi yang dipertukarkan selama kerja sama.",
  "3. Pembayaran kompensasi dilakukan via mekanisme platform (simulasi escrow).",
  "4. Kontrak dapat diakhiri lebih awal oleh salah satu pihak dengan pemberitahuan 7 hari.",
  "5. Sengketa diselesaikan secara musyawarah, gagal maka menempuh hukum yang berlaku di Indonesia.",
];

const WRAP_WIDTH = 90;

function wrapText(text: string, width = WRAP_WIDTH): string[] {
  if (text.length <= width) return [text];
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && (line + " " + word).length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function generateContractDocument(
  data: DocumentContractData,
): Promise<{ bytes: Uint8Array; hash: string }> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595.28, 841.89]); // A4
  let y = 800;
  const write = (text: string, size = 10, useBold = false) => {
    if (y < 60) { page = doc.addPage([595.28, 841.89]); y = 800; }
    page.drawText(text, { x: 50, y, size, font: useBold ? bold : font, color: rgb(0.05, 0.04, 0.03) });
    y -= size + 8;
  };
  const field = (label: string, value: string | null) => {
    for (const line of wrapText(`${label}: ${value ?? "-"}`)) write(line);
  };

  write("KONTRAK KERJA", 16, true);
  field("Nomor", data.contractNumber);
  write("");
  field("Pihak 1 (TALENT)", data.talentName);
  field("Pihak 2 (HIRER)", data.hirerName);
  write("");
  write("1. POSISI", 11, true); field("Posisi", data.roleTitle);
  write("2. DESKRIPSI", 11, true); field("Deskripsi", data.description);
  field("Tanggung Jawab", data.responsibilities);
  write("3. DURASI", 11, true); field("Durasi", data.duration);
  write("4. LOKASI", 11, true); field("Lokasi", data.location);
  write("5. KOMPENSASI", 11, true);
  write(`Kompensasi: Rp ${data.compensation ?? 0}`);
  write("6. SYARAT & KETENTUAN", 11, true);
  for (const line of wrapText(data.termsConditions ?? "-")) write(line);
  write("");
  for (const line of BOILERPLATE) write(line);
  write("");
  write("Dokumen ini ditandatangani secara elektronik melalui Flex Network.", 9);

  const bytes = await doc.save();
  const hash = createHash("sha256").update(bytes).digest("hex");
  return { bytes, hash };
}

export async function appendSignatureBlock(
  existingBytes: Uint8Array,
  hash: string,
  signatures: { talent: { name: string; at: string } | null; hirer: { name: string; at: string } | null },
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(existingBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595.28, 841.89]);
  let y = 780;
  const write = (text: string, size = 10, useBold = false) => {
    page.drawText(text, { x: 50, y, size, font: useBold ? bold : font });
    y -= size + 8;
  };
  write("VERIFIKASI DIGITAL", 13, true);
  write(`Hash Dokumen: ${hash}`);
  write("");
  write("TANDA TANGAN", 13, true);
  write(signatures.talent ? `Talent: ${signatures.talent.name} — (Digital) — ${signatures.talent.at}` : "Talent: ________________");
  write(signatures.hirer ? `Hirer: ${signatures.hirer.name} — (Digital) — ${signatures.hirer.at}` : "Hirer: ________________");
  return doc.save();
}
