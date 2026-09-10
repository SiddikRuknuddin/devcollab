const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  inviteDeveloper,
  getProjectMembers,
  respondToInvitation,
  getMyInvitations,
  removeMember,
  cancelInvitation,
} = require("../controllers/projectMemberController");

const router = express.Router();

// Invite a developer to a project
router.post("/:projectId/members", protect, inviteDeveloper);

// Get all members/invitations for a project
router.get("/:projectId/members", protect, getProjectMembers);

// Invited developer responds (Accept / Reject)
router.put("/members/:memberId/respond", protect, respondToInvitation);

// Get logged-in user's invitations
router.get("/my/invitations", protect, getMyInvitations);

// Project owner removes an ACCEPTED member
router.delete("/members/:memberId", protect, removeMember);

// Project owner cancels a PENDING invitation
router.delete("/members/:memberId/cancel", protect, cancelInvitation);

module.exports = router;