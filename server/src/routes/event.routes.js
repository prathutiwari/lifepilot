import express from "express";
import { createEvent, deleteEvent, updateEvent } from "../controllers/event.controller.js";

const router = express.Router();

router.post("/", createEvent);
router.delete("/:eventId", deleteEvent);
router.patch("/:eventId", updateEvent);

export default router;
