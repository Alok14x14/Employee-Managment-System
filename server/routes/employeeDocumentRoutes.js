import { Router } from "express";
import multer from "multer";
import { protect, protectAdmin, requirePasswordChanged } from "../middleware/auth.js";
import { deleteDocument, getDocumentContent, listDocuments, uploadDocument } from "../controllers/employeeDocumentController.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const parsePdfUpload = (req, res, next) => upload.single("file")(req, res, (error) => {
  if (!error) return next();
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "PDF files must be 5 MB or smaller" });
  return res.status(400).json({ error: "Could not read uploaded file" });
});

router.get("/", protect, requirePasswordChanged, listDocuments);
router.get("/:id/content", protect, requirePasswordChanged, getDocumentContent);
router.post("/", protect, requirePasswordChanged, protectAdmin, parsePdfUpload, uploadDocument);
router.delete("/:id", protect, requirePasswordChanged, protectAdmin, deleteDocument);

export default router;
