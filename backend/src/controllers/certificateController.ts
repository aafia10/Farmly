import { Request, Response, NextFunction } from "express";
import QRCode from "qrcode";
import { z } from "zod";
import { certificateService, traceUrl } from "../services/certificateService";
import { HttpError } from "../utils/httpError";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const recordId = z.string().trim().min(3).max(120).regex(/^[\w.-]+$/, "Invalid identifier");

const originSchema = z.object({
  batchId: recordId,
  documentKind: z.string().trim().min(2).max(80),
  issuingOrganization: z.string().trim().max(160).optional(),
  issuedOn: isoDate.optional(),
  expiresOn: isoDate.optional(),
  certificationClaim: z.string().trim().max(120).optional(),
  visibility: z.enum(["public", "private"]).default("private"),
  supersedesCertificateId: recordId.optional(),
  fileName: z.string().trim().min(1).max(160).regex(/^[^\\/]+$/, "Invalid file name"),
  mimeType: z.string().trim().min(3).max(80),
  contentBase64: z.string().min(4),
});

const purchaseSchema = z.object({
  sourceBatchId: recordId,
  quantity: z.number().positive().max(10_000_000),
  pricePerUnit: z.number().nonnegative().max(10_000_000).optional(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
});

const verifySchema = z.object({ contentBase64: z.string().min(4).optional() }).default({});
const revokeSchema = z.object({ reason: z.string().trim().min(5).max(300) });

function requireUser(req: Request) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  return req.user;
}

/**
 * The signed-in user, ignoring optionalAuth's demo-farmer fallback: requests without a
 * token must never see private metadata or private documents.
 */
function explicitUser(req: Request) {
  return req.headers.authorization?.startsWith("Bearer ") ? req.user ?? null : null;
}

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

export const certificateController = {
  createOrigin: wrap(async (req, res) => {
    const input = originSchema.parse(req.body);
    const result = await certificateService.createOriginCertificate(requireUser(req), input);
    res.status(result.duplicate ? 200 : 201).json({ success: true, data: result });
  }),

  getCertificate: wrap(async (req, res) => {
    const data = await certificateService.getCertificateDetail(recordId.parse(req.params.id), explicitUser(req));
    res.json({ success: true, data });
  }),

  getDocument: wrap(async (req, res) => {
    const data = await certificateService.getDocumentLink(recordId.parse(req.params.id), explicitUser(req));
    res.json({ success: true, data });
  }),

  verify: wrap(async (req, res) => {
    const { contentBase64 } = verifySchema.parse(req.body ?? {});
    const file = contentBase64 ? Buffer.from(contentBase64, "base64") : undefined;
    const data = await certificateService.verifyCertificate(recordId.parse(req.params.id), file);
    res.json({ success: true, data });
  }),

  retry: wrap(async (req, res) => {
    const data = await certificateService.retryCertificate(recordId.parse(req.params.id), requireUser(req));
    res.json({ success: true, data });
  }),

  revoke: wrap(async (req, res) => {
    const { reason } = revokeSchema.parse(req.body);
    const data = await certificateService.revokeCertificate(recordId.parse(req.params.id), reason, requireUser(req));
    res.json({ success: true, data });
  }),

  createPurchase: wrap(async (req, res) => {
    const key = req.header("Idempotency-Key")?.trim();
    if (!key || key.length < 8 || key.length > 120 || !/^[\w-]+$/.test(key)) {
      throw new HttpError(400, "A valid Idempotency-Key header (8-120 characters) is required");
    }
    const input = purchaseSchema.parse(req.body);
    const data = await certificateService.createPurchase(requireUser(req), input, key);
    res.status(201).json({ success: true, data });
  }),

  retryPurchase: wrap(async (req, res) => {
    const data = await certificateService.retryPurchase(recordId.parse(req.params.id), requireUser(req));
    res.json({ success: true, data });
  }),

  batchTrace: wrap(async (req, res) => {
    const data = await certificateService.getBatchTrace(recordId.parse(req.params.id), requireUser(req));
    res.json({ success: true, data });
  }),

  publicTrace: wrap(async (req, res) => {
    const data = await certificateService.getPublicTrace(recordId.parse(req.params.id));
    res.json({ success: true, data });
  }),

  qr: wrap(async (req, res) => {
    const id = recordId.parse(req.params.id);
    // The QR only encodes the public page URL, never tokens or record contents.
    const svg = await QRCode.toString(traceUrl(id), { type: "svg", errorCorrectionLevel: "M", margin: 1 });
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(svg);
  }),

  available: wrap(async (req, res) => {
    const data = await certificateService.getAvailableBatches(requireUser(req));
    res.json({ success: true, data });
  }),

  dashboard: wrap(async (req, res) => {
    const data = await certificateService.getDashboard(requireUser(req));
    res.json({ success: true, data });
  }),
};
