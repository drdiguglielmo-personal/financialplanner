/**
 * SmartBudget — Back4App Cloud Code (households + shared finance).
 *
 * OPTIONAL: The default SmartBudget client uses `src/services/householdParseClient.js` (no Cloud Code).
 * Deploy this file only if you wire the app to `Parse.Cloud.run` again or maintain a separate client.
 *
 * Deploy: Back4App Dashboard → Cloud Code → paste or upload this file as main.js (or merge functions).
 * Requires master key in Cloud Code (default on Back4App) for Role writes and membership queries.
 *
 * Database: create Parse classes (Browser or API):
 * - Household: name (String), createdBy (Pointer _User)
 * - HouseholdFinance: household (Pointer Household), budgets (Object), transactions (Array),
 *   manualExpenses (Array), goals (Array), bankConnected (Boolean)
 * - HouseholdMember: household (Pointer), user (Pointer _User), role (String: "admin" | "member")
 * - HouseholdInvite: household (Pointer), invitedEmail (String), role (String), inviteToken (String),
 *   status (String: "pending" | "accepted" | "revoked"), createdBy (Pointer _User)
 *
 * CLP (minimum): authenticated users can Create on all four; Find/Get/Update tuned per your policy.
 * Rows are ACL-scoped from Cloud Code; prefer locking down direct client Create on HouseholdFinance if possible.
 */

/* global Parse */

function normEmail(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

function userEmail(user) {
  return normEmail(user.get("email") || user.get("username"));
}

async function assertHouseholdAdmin(householdId, user) {
  const q = new Parse.Query("HouseholdMember");
  q.equalTo("household", Parse.Object.createWithoutData("Household", householdId));
  q.equalTo("user", user);
  q.equalTo("role", "admin");
  const row = await q.first({ useMasterKey: true });
  if (!row) throw new Parse.Error(403, "Only household admins can do this.");
}

Parse.Cloud.define("household_create", async (request) => {
  const user = request.user;
  if (!user) throw new Parse.Error(209, "Login required");
  const name = String(request.params.name || "").trim();
  if (!name) throw new Parse.Error(142, "Household name is required.");

  const Household = Parse.Object.extend("Household");
  const h = new Household();
  h.set("name", name);
  h.set("createdBy", user);
  const aclH = new Parse.ACL(user);
  h.setACL(aclH);
  await h.save(null, { useMasterKey: true });

  const roleName = "household_" + h.id;
  const roleAcl = new Parse.ACL();
  roleAcl.setPublicReadAccess(false);
  roleAcl.setPublicWriteAccess(false);
  roleAcl.setReadAccess(user, true);
  roleAcl.setWriteAccess(user, true);
  const role = new Parse.Role(roleName, roleAcl);
  role.getUsers().add(user);
  await role.save(null, { useMasterKey: true });

  const HF = Parse.Object.extend("HouseholdFinance");
  const hf = new HF();
  hf.set("household", h);
  hf.set("budgets", {});
  hf.set("transactions", []);
  hf.set("manualExpenses", []);
  hf.set("goals", []);
  hf.set("bankConnected", false);
  const aclHF = new Parse.ACL();
  aclHF.setPublicReadAccess(false);
  aclHF.setPublicWriteAccess(false);
  aclHF.setRoleReadAccess(roleName, true);
  aclHF.setRoleWriteAccess(roleName, true);
  hf.setACL(aclHF);
  await hf.save(null, { useMasterKey: true });

  const Member = Parse.Object.extend("HouseholdMember");
  const m = new Member();
  m.set("household", h);
  m.set("user", user);
  m.set("role", "admin");
  const aclM = new Parse.ACL();
  aclM.setPublicReadAccess(false);
  aclM.setPublicWriteAccess(false);
  aclM.setReadAccess(user, true);
  aclM.setWriteAccess(user, true);
  m.setACL(aclM);
  await m.save(null, { useMasterKey: true });

  return { householdId: h.id, name: h.get("name"), role: "admin" };
});

Parse.Cloud.define("household_listMine", async (request) => {
  const user = request.user;
  if (!user) throw new Parse.Error(209, "Login required");
  const q = new Parse.Query("HouseholdMember");
  q.equalTo("user", user);
  q.include("household");
  const rows = await q.find({ useMasterKey: true });
  return rows.map((r) => {
    const hh = r.get("household");
    return {
      householdId: hh.id,
      name: hh.get("name"),
      role: r.get("role") || "member",
    };
  });
});

Parse.Cloud.define("household_invite", async (request) => {
  const user = request.user;
  if (!user) throw new Parse.Error(209, "Login required");
  const householdId = request.params.householdId;
  const invitedEmail = normEmail(request.params.email);
  const role = request.params.role === "admin" ? "admin" : "member";
  if (!householdId || !invitedEmail) throw new Parse.Error(142, "householdId and email are required.");

  await assertHouseholdAdmin(householdId, user);

  const token =
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2);

  const Invite = Parse.Object.extend("HouseholdInvite");
  const inv = new Invite();
  inv.set("household", Parse.Object.createWithoutData("Household", householdId));
  inv.set("invitedEmail", invitedEmail);
  inv.set("role", role);
  inv.set("inviteToken", token);
  inv.set("status", "pending");
  inv.set("createdBy", user);
  const aclI = new Parse.ACL();
  aclI.setPublicReadAccess(false);
  aclI.setPublicWriteAccess(false);
  aclI.setReadAccess(user, true);
  aclI.setWriteAccess(user, true);
  inv.setACL(aclI);
  await inv.save(null, { useMasterKey: true });

  return { inviteId: inv.id, inviteToken: token };
});

Parse.Cloud.define("household_listPendingInvitesForMe", async (request) => {
  const user = request.user;
  if (!user) throw new Parse.Error(209, "Login required");
  const em = userEmail(user);
  const q = new Parse.Query("HouseholdInvite");
  q.equalTo("invitedEmail", em);
  q.equalTo("status", "pending");
  q.include("household");
  q.include("createdBy");
  const rows = await q.find({ useMasterKey: true });
  return rows.map((r) => ({
    inviteId: r.id,
    householdId: r.get("household").id,
    householdName: r.get("household").get("name"),
    role: r.get("role"),
    invitedBy: r.get("createdBy").get("name") || r.get("createdBy").get("username"),
  }));
});

Parse.Cloud.define("household_acceptInvite", async (request) => {
  const user = request.user;
  if (!user) throw new Parse.Error(209, "Login required");
  const inviteId = request.params.inviteId;
  if (!inviteId) throw new Parse.Error(142, "inviteId is required.");

  const inv = await new Parse.Query("HouseholdInvite").get(inviteId, { useMasterKey: true });
  if (inv.get("status") !== "pending") throw new Parse.Error(400, "Invite is no longer pending.");
  if (userEmail(user) !== normEmail(inv.get("invitedEmail"))) throw new Parse.Error(403, "This invite is for a different account.");

  const household = inv.get("household");
  const householdId = household.id;
  const roleName = "household_" + householdId;
  const pr = new Parse.Query(Parse.Role);
  pr.equalTo("name", roleName);
  const parseRole = await pr.first({ useMasterKey: true });
  if (!parseRole) throw new Parse.Error(500, "Household role missing; contact support.");

  parseRole.getUsers().add(user);
  await parseRole.save(null, { useMasterKey: true });

  const Member = Parse.Object.extend("HouseholdMember");
  const m = new Member();
  m.set("household", household);
  m.set("user", user);
  m.set("role", inv.get("role") === "admin" ? "admin" : "member");
  const aclM = new Parse.ACL();
  aclM.setPublicReadAccess(false);
  aclM.setPublicWriteAccess(false);
  aclM.setReadAccess(user, true);
  aclM.setWriteAccess(user, true);
  m.setACL(aclM);
  await m.save(null, { useMasterKey: true });

  inv.set("status", "accepted");
  await inv.save(null, { useMasterKey: true });

  return { householdId, name: household.get("name"), role: m.get("role") };
});

Parse.Cloud.define("household_removeMember", async (request) => {
  const user = request.user;
  if (!user) throw new Parse.Error(209, "Login required");
  const householdId = request.params.householdId;
  const removeUserId = request.params.userId;
  if (!householdId || !removeUserId) throw new Parse.Error(142, "householdId and userId are required.");
  if (removeUserId === user.id) throw new Parse.Error(400, "Use leave household to remove yourself.");

  await assertHouseholdAdmin(householdId, user);

  let targetUser;
  try {
    targetUser = await new Parse.Query(Parse.User).get(removeUserId, { useMasterKey: true });
  } catch {
    throw new Parse.Error(404, "User not found.");
  }

  const roleName = "household_" + householdId;
  const pr = new Parse.Query(Parse.Role);
  pr.equalTo("name", roleName);
  const parseRole = await pr.first({ useMasterKey: true });
  if (parseRole) {
    parseRole.getUsers().remove(targetUser);
    await parseRole.save(null, { useMasterKey: true });
  }

  const mq = new Parse.Query("HouseholdMember");
  mq.equalTo("household", Parse.Object.createWithoutData("Household", householdId));
  mq.equalTo("user", targetUser);
  const mem = await mq.first({ useMasterKey: true });
  if (mem) await mem.destroy({ useMasterKey: true });

  return { ok: true };
});

Parse.Cloud.define("household_leave", async (request) => {
  const user = request.user;
  if (!user) throw new Parse.Error(209, "Login required");
  const householdId = request.params.householdId;
  if (!householdId) throw new Parse.Error(142, "householdId is required.");

  const roleName = "household_" + householdId;
  const pr = new Parse.Query(Parse.Role);
  pr.equalTo("name", roleName);
  const parseRole = await pr.first({ useMasterKey: true });
  if (parseRole) {
    parseRole.getUsers().remove(user);
    await parseRole.save(null, { useMasterKey: true });
  }

  const mq = new Parse.Query("HouseholdMember");
  mq.equalTo("household", Parse.Object.createWithoutData("Household", householdId));
  mq.equalTo("user", user);
  const mem = await mq.first({ useMasterKey: true });
  if (mem) await mem.destroy({ useMasterKey: true });

  return { ok: true };
});
