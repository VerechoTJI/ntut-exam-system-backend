import { Router } from "express";
import * as codeController from "../../controllers/admin/code.controller";

const router = Router();

// Judge student code - requires studentID in body
router.post("/judge", codeController.judgeCode);

// Get all submitted students
router.get("/submitted-students", codeController.getSubmittedStudents);

// Get student code - supports both GET with param and POST with body
router.get("/:studentID", codeController.getStudentCode);
router.post("/", codeController.getStudentCode);

export default router;
