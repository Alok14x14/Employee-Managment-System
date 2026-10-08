import express from "express";
import { protect } from "../middleware/auth.js";
import { DEPARTMENTS } from "../constants/departments.js";

const metaRouter = express.Router();

// GET /api/meta/departments
metaRouter.get("/departments", protect, (req, res) => {
  return res.json(DEPARTMENTS);
});

export default metaRouter;
