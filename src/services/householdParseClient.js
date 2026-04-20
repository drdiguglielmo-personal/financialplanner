/**
 * Household sharing using only the Parse JS SDK (no Cloud Code).
 * Uses per-object ACLs with User pointers on HouseholdFinance. Parse Roles are not used.
 *
 * Flow: admin creates an invite (secret token). Partner enters invite ID + token → creates a
 * HouseholdJoinRequest. Admin approves → HouseholdFinance ACL updated + HouseholdMember created.
 *
 * Parse classes (create via Dashboard or first save): Household, HouseholdFinance, HouseholdMember,
 * HouseholdInvite, HouseholdJoinRequest. CLP: authenticated Create/Find/Get/Update on these classes
 * as needed; row ACLs restrict access.
 */
import Parse from "./parseClient.js";

function normEmail(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

function randomToken() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

function requireUser() {
  const user = Parse.User.current();
  if (!user) throw new Error("Sign in required.");
  return user;
}

/**
 * Some Parse/Back4App setups mishandle a column literally named `role`. We persist `householdRole` and mirror `role`.
 * @param {Parse.Object} row
 * @returns {"admin" | "member"}
 */
function getMemberRole(row) {
  const raw = row.get("householdRole") ?? row.get("role");
  return raw === "admin" ? "admin" : "member";
}

/**
 * @param {Parse.Object} row
 * @param {"admin" | "member"} role
 */
function setMemberRole(row, role) {
  row.set("householdRole", role);
  row.set("role", role);
}

async function isHouseholdCreator(householdId, user) {
  const h = await new Parse.Query("Household").get(householdId);
  const cb = h.get("createdBy");
  return Boolean(cb && cb.id === user.id);
}

async function assertHouseholdAdmin(householdId, user) {
  if (await isHouseholdCreator(householdId, user)) return;
  const q = new Parse.Query("HouseholdMember");
  q.equalTo("household", Parse.Object.createWithoutData("Household", householdId));
  q.equalTo("user", user);
  const row = await q.first();
  if (!row || getMemberRole(row) !== "admin") {
    throw new Error("Only household admins can do this.");
  }
}

/**
 * Ensures every Household you created has a HouseholdMember row with admin role (repairs partial saves / bad column names).
 * @param {Parse.User} user
 */
async function ensureCreatorMemberships(user) {
  const Member = Parse.Object.extend("HouseholdMember");
  const hq = new Parse.Query("Household");
  hq.equalTo("createdBy", user);
  const households = await hq.find();
  for (const h of households) {
    const mq = new Parse.Query("HouseholdMember");
    mq.equalTo("household", h);
    mq.equalTo("user", user);
    let m = await mq.first();
    if (!m) {
      m = new Member();
      m.set("household", h);
      m.set("user", user);
      setMemberRole(m, "admin");
      m.set("householdNameSnapshot", h.get("name") || "");
      const aclM = new Parse.ACL(user);
      m.setACL(aclM);
      try {
        await m.save();
      } catch {
        /* ignore */
      }
    } else {
      let needsSave = false;
      if (getMemberRole(m) !== "admin") {
        setMemberRole(m, "admin");
        needsSave = true;
      }
      if (!m.get("householdNameSnapshot") && h.get("name")) {
        m.set("householdNameSnapshot", h.get("name"));
        needsSave = true;
      }
      if (needsSave) {
        try {
          await m.save();
        } catch {
          /* ignore */
        }
      }
    }
  }
}

/**
 * Household ids where the user may approve join requests (creator or member row says admin).
 * @param {Parse.User} user
 * @returns {Promise<string[]>}
 */
async function householdIdsWhereAdmin(user) {
  const ids = new Set();
  const ownedQ = new Parse.Query("Household");
  ownedQ.equalTo("createdBy", user);
  const owned = await ownedQ.find();
  for (const h of owned) ids.add(h.id);

  const mq = new Parse.Query("HouseholdMember");
  mq.equalTo("user", user);
  mq.include("household");
  const rows = await mq.find();
  for (const r of rows) {
    const hh = r.get("household");
    if (!hh) continue;
    let creator = hh.get("createdBy");
    if (!creator && hh.id) {
      try {
        const full = await new Parse.Query("Household").include("createdBy").get(hh.id);
        creator = full.get("createdBy");
      } catch {
        /* ignore */
      }
    }
    const creatorIsMe = creator && creator.id === user.id;
    if (getMemberRole(r) === "admin" || creatorIsMe) ids.add(hh.id);
  }
  return [...ids];
}

/**
 * @param {string} name
 * @returns {Promise<{ householdId: string, name: string, role: string }>}
 */
export async function clientHouseholdCreate(name) {
  const user = requireUser();
  const n = String(name || "").trim();
  if (!n) throw new Error("Household name is required.");

  const Household = Parse.Object.extend("Household");
  const h = new Household();
  h.set("name", n);
  h.set("createdBy", user);
  const aclH = new Parse.ACL(user);
  h.setACL(aclH);
  await h.save();

  const HF = Parse.Object.extend("HouseholdFinance");
  const hf = new HF();
  hf.set("household", h);
  hf.set("budgets", {});
  hf.set("transactions", []);
  hf.set("manualExpenses", []);
  hf.set("goals", []);
  hf.set("bankConnected", false);
  const aclHF = new Parse.ACL(user);
  aclHF.setPublicReadAccess(false);
  aclHF.setPublicWriteAccess(false);
  hf.setACL(aclHF);
  await hf.save();

  const Member = Parse.Object.extend("HouseholdMember");
  const m = new Member();
  m.set("household", h);
  m.set("user", user);
  setMemberRole(m, "admin");
  m.set("householdNameSnapshot", n);
  const aclM = new Parse.ACL(user);
  m.setACL(aclM);
  await m.save();

  return { householdId: h.id, name: h.get("name"), role: "admin" };
}

/**
 * @returns {Promise<Array<{ householdId: string, name: string, role: string }>>}
 */
export async function clientHouseholdListMine() {
  const user = requireUser();
  await ensureCreatorMemberships(user);
  const q = new Parse.Query("HouseholdMember");
  q.equalTo("user", user);
  q.include("household");
  const rows = await q.find();
  const out = [];
  for (const r of rows) {
    const hh = r.get("household");
    let snapshot = r.get("householdNameSnapshot");
    let creator = hh?.get("createdBy");
    if (!creator && hh?.id) {
      try {
        const full = await new Parse.Query("Household").include("createdBy").get(hh.id);
        creator = full.get("createdBy");
      } catch {
        /* ignore */
      }
    }
    /** Partners often cannot read Household (creator-only ACL); `include` then has no `name`. Snapshot is required. */
    let displayName = snapshot || (hh && hh.get("name"));
    if (!displayName && creator?.id === user.id && hh?.id) {
      try {
        const hf = await new Parse.Query("Household").get(hh.id);
        displayName = hf.get("name") || "";
        if (displayName) {
          r.set("householdNameSnapshot", displayName);
          await r.save();
        }
      } catch {
        /* ignore */
      }
    }
    if (!displayName) displayName = "Household";

    let role = getMemberRole(r);
    if (creator?.id === user.id) role = "admin";

    const householdId = hh?.id || "";
    out.push({
      householdId,
      name: displayName,
      role,
    });
  }
  return out;
}

/**
 * @param {{ householdId: string, email: string, role?: 'admin' | 'member' }} params
 */
export async function clientHouseholdInvite(params) {
  const user = requireUser();
  const householdId = params.householdId;
  const invitedEmail = normEmail(params.email);
  const role = params.role === "admin" ? "admin" : "member";
  if (!householdId || !invitedEmail) throw new Error("Household and partner email are required.");

  await assertHouseholdAdmin(householdId, user);

  const household = await new Parse.Query("Household").include("createdBy").get(householdId);
  const creator = household.get("createdBy");
  const memberRows = await new Parse.Query("HouseholdMember").equalTo("household", household).include("user").find();
  /** @type {Map<string, Parse.User>} */
  const notify = new Map();
  if (creator?.id) notify.set(creator.id, creator);
  notify.set(user.id, user);
  for (const row of memberRows) {
    const u = row.get("user");
    if (!u) continue;
    if (getMemberRole(row) === "admin" || (creator && u.id === creator.id)) {
      notify.set(u.id, u);
    }
  }

  const token = randomToken();

  const Invite = Parse.Object.extend("HouseholdInvite");
  const inv = new Invite();
  inv.set("household", household);
  inv.set("invitedEmail", invitedEmail);
  inv.set("inviteRole", role);
  inv.set("role", role);
  inv.set("inviteToken", token);
  inv.set("status", "pending");
  inv.set("createdBy", user);
  inv.set("householdCreator", creator || user);
  inv.set("householdNameSnapshot", household.get("name") || "");
  inv.set("notifyAdmins", [...notify.values()]);
  /** String IDs — Back4App reliably stores Array<String>; Array<Pointer> can come back empty when the partner loads the invite. */
  inv.set("notifyAdminIds", [...notify.keys()]);
  const aclI = new Parse.ACL(user);
  aclI.setPublicReadAccess(true);
  aclI.setPublicWriteAccess(false);
  inv.setACL(aclI);
  await inv.save();

  return { inviteId: inv.id, inviteToken: token };
}

/**
 * Client-only mode cannot safely list “invites for my email” without Cloud Code.
 * @returns {Promise<[]>}
 */
export async function clientHouseholdListPendingInvitesForMe() {
  requireUser();
  return [];
}

/**
 * @param {string} inviteId
 * @param {string} inviteToken
 * @returns {Promise<{ requestId: string, householdId: string, householdName: string }>}
 */
export async function clientHouseholdRequestJoin(inviteId, inviteToken) {
  const user = requireUser();
  const token = String(inviteToken || "").trim();
  const id = String(inviteId || "")
    .trim()
    .replace(/\s+/g, "");
  if (!id || !token) throw new Error("Invite ID and code are required.");

  let inv;
  try {
    inv = await new Parse.Query("HouseholdInvite").get(id);
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? e.code : undefined;
    if (code === 101) {
      throw new Error(
        "Invite not found. Copy the Invite ID exactly, or ask the admin to send a new invite (older invites may need to be recreated)."
      );
    }
    throw e;
  }
  if (inv.get("status") !== "pending") throw new Error("This invite is no longer active.");
  if (inv.get("inviteToken") !== token) throw new Error("Invalid invite code.");
  const em = normEmail(user.get("email") || user.get("username"));
  const expected = normEmail(inv.get("invitedEmail"));
  if (expected && em !== expected) throw new Error("This invite was sent to a different email address.");

  const household = inv.get("household");
  if (!household) throw new Error("Invalid invite.");

  const householdId = household.id;
  const householdName =
    inv.get("householdNameSnapshot") || inv.get("householdName") || "Household";

  const Jr = Parse.Object.extend("HouseholdJoinRequest");
  const existing = new Parse.Query(Jr);
  existing.equalTo("household", household);
  existing.equalTo("requestingUser", user);
  existing.equalTo("status", "pending");
  const dup = await existing.first();
  if (dup) {
    return {
      requestId: dup.id,
      householdId,
      householdName,
    };
  }

  const invRole = inv.get("inviteRole") ?? inv.get("role");
  const granted = invRole === "admin" ? "admin" : "member";

  /** Admin user ids for ACL + listing (prefer strings from invite; pointer arrays are unreliable on some hosts). */
  const adminIdSet = new Set();
  const idList = inv.get("notifyAdminIds");
  if (Array.isArray(idList)) {
    for (const x of idList) {
      if (x) adminIdSet.add(String(x));
    }
  }
  const creator = inv.get("householdCreator") || inv.get("createdBy");
  const inviter = inv.get("createdBy");
  const notifyList = inv.get("notifyAdmins");
  if (Array.isArray(notifyList)) {
    for (const u of notifyList) {
      if (u && u.id) adminIdSet.add(u.id);
    }
  }
  if (creator?.id) adminIdSet.add(creator.id);
  if (inviter?.id) adminIdSet.add(inviter.id);

  const jr = new Jr();
  jr.set("household", household);
  jr.set("invite", inv);
  jr.set("requestingUser", user);
  jr.set("grantedRole", granted);
  jr.set("role", granted);
  jr.set("status", "pending");
  jr.set("notifyAdminIds", [...adminIdSet]);
  jr.set("householdNameSnapshot", householdName);
  const acl = new Parse.ACL(user);
  acl.setWriteAccess(user, true);
  for (const uid of adminIdSet) {
    const pu = Parse.User.createWithoutData(uid);
    acl.setReadAccess(pu, true);
    /** Admins must be able to update status (approve / reject); read-only caused saves to fail silently on some hosts. */
    acl.setWriteAccess(pu, true);
  }
  jr.setACL(acl);
  await jr.save();

  return {
    requestId: jr.id,
    householdId,
    householdName,
  };
}

/**
 * @returns {Promise<Array<{ requestId: string, householdId: string, householdName: string, requesterName: string, requesterEmail: string, role: string }>>}
 */
export async function clientHouseholdListPendingJoinRequestsForAdmin() {
  const user = requireUser();
  await ensureCreatorMemberships(user);
  const adminIds = await householdIdsWhereAdmin(user);
  const uid = user.id;

  let byHousehold = [];
  if (adminIds.length > 0) {
    const householdPtrs = adminIds.map((id) => Parse.Object.createWithoutData("Household", id));
    const jrQ = new Parse.Query("HouseholdJoinRequest");
    jrQ.containedIn("household", householdPtrs);
    jrQ.equalTo("status", "pending");
    jrQ.include("household");
    jrQ.include("requestingUser");
    byHousehold = await jrQ.find();
  }

  /** Array<String> column: documents where this user id appears in notifyAdminIds. */
  const qNotify = new Parse.Query("HouseholdJoinRequest");
  qNotify.equalTo("notifyAdminIds", uid);
  qNotify.equalTo("status", "pending");
  qNotify.include("household");
  qNotify.include("requestingUser");
  const byNotify = await qNotify.find();

  const seen = new Set();
  const rows = [];
  for (const r of [...byHousehold, ...byNotify]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    rows.push(r);
  }

  return rows.map((r) => {
    const hh = r.get("household");
    const ru = r.get("requestingUser");
    const rr = r.get("grantedRole") ?? r.get("role");
    const snap = r.get("householdNameSnapshot");
    return {
      requestId: r.id,
      householdId: hh?.id || "",
      householdName: snap || hh?.get("name") || "",
      requesterName: ru?.get("name") || ru?.get("username") || "User",
      requesterEmail: ru?.get("email") || ru?.get("username") || "",
      role: rr === "admin" ? "admin" : "member",
    };
  });
}

/**
 * @param {string} requestId
 */
export async function clientHouseholdApproveJoinRequest(requestId) {
  const user = requireUser();
  if (!requestId) throw new Error("Request id is required.");

  const Jr = Parse.Object.extend("HouseholdJoinRequest");
  const req = await new Parse.Query(Jr).get(requestId);
  if (req.get("status") !== "pending") throw new Error("This request is no longer pending.");

  const household = req.get("household");
  if (!household) throw new Error("Invalid request.");
  await assertHouseholdAdmin(household.id, user);

  const invitee = req.get("requestingUser");
  if (!invitee) throw new Error("Missing requesting user.");

  const role = (req.get("grantedRole") ?? req.get("role")) === "admin" ? "admin" : "member";

  const householdFull = await new Parse.Query("Household").include("createdBy").get(household.id);
  const resolvedName = req.get("householdNameSnapshot") || householdFull.get("name") || "Household";
  const cr = householdFull.get("createdBy");

  const hfQ = new Parse.Query("HouseholdFinance");
  hfQ.equalTo("household", household);
  const hf = await hfQ.first();
  if (!hf) throw new Error("HouseholdFinance row missing. Create a household again or fix data in Back4App.");

  const acl = hf.getACL() || new Parse.ACL();
  acl.setReadAccess(invitee, true);
  acl.setWriteAccess(invitee, true);
  hf.setACL(acl);
  await hf.save();

  const Member = Parse.Object.extend("HouseholdMember");
  const mq = new Parse.Query(Member);
  mq.equalTo("household", household);
  mq.equalTo("user", invitee);
  const existing = await mq.first();
  if (!existing) {
    const allMembers = await new Parse.Query("HouseholdMember").equalTo("household", household).include("user").find();
    const adminRowsForAcl = allMembers.filter((row) => {
      const u = row.get("user");
      if (!u) return false;
      return getMemberRole(row) === "admin" || (cr && u.id === cr.id);
    });
    const m = new Member();
    m.set("household", household);
    m.set("user", invitee);
    setMemberRole(m, role);
    m.set("householdNameSnapshot", resolvedName);
    const aclM = new Parse.ACL(invitee);
    aclM.setReadAccess(invitee, true);
    for (const row of adminRowsForAcl) {
      const au = row.get("user");
      if (au) aclM.setReadAccess(au, true);
    }
    m.setACL(aclM);
    await m.save();
  }

  const inv = req.get("invite");
  if (inv) {
    inv.set("status", "accepted");
    await inv.save();
  }

  req.set("status", "approved");
  await req.save();

  return { householdId: household.id, name: resolvedName, role };
}

/**
 * @param {string} requestId
 */
export async function clientHouseholdRejectJoinRequest(requestId) {
  const user = requireUser();
  if (!requestId) throw new Error("Request id is required.");

  const Jr = Parse.Object.extend("HouseholdJoinRequest");
  const req = await new Parse.Query(Jr).get(requestId);
  if (req.get("status") !== "pending") throw new Error("This request is no longer pending.");

  const household = req.get("household");
  if (!household) throw new Error("Invalid request.");
  await assertHouseholdAdmin(household.id, user);

  req.set("status", "rejected");
  await req.save();
}

/**
 * @param {string} householdId
 * @param {string} removeUserId
 */
export async function clientHouseholdRemoveMember(householdId, removeUserId) {
  const user = requireUser();
  if (!householdId || !removeUserId) throw new Error("householdId and userId are required.");
  if (removeUserId === user.id) throw new Error("Use leave household to remove yourself.");

  await assertHouseholdAdmin(householdId, user);

  let targetUser;
  try {
    targetUser = await new Parse.Query(Parse.User).get(removeUserId);
  } catch {
    throw new Error("User not found.");
  }

  const household = Parse.Object.createWithoutData("Household", householdId);

  const hfQ = new Parse.Query("HouseholdFinance");
  hfQ.equalTo("household", household);
  const hf = await hfQ.first();
  if (hf) {
    const acl = hf.getACL() || new Parse.ACL();
    acl.setReadAccess(targetUser, false);
    acl.setWriteAccess(targetUser, false);
    hf.setACL(acl);
    await hf.save();
  }

  const mq = new Parse.Query("HouseholdMember");
  mq.equalTo("household", household);
  mq.equalTo("user", targetUser);
  const mem = await mq.first();
  if (mem) await mem.destroy();
}

/**
 * @param {string} householdId
 */
export async function clientHouseholdLeave(householdId) {
  const user = requireUser();
  if (!householdId) throw new Error("householdId is required.");

  const household = Parse.Object.createWithoutData("Household", householdId);

  const hfQ = new Parse.Query("HouseholdFinance");
  hfQ.equalTo("household", household);
  const hf = await hfQ.first();
  if (hf) {
    const acl = hf.getACL() || new Parse.ACL();
    acl.setReadAccess(user, false);
    acl.setWriteAccess(user, false);
    hf.setACL(acl);
    await hf.save();
  }

  const mq = new Parse.Query("HouseholdMember");
  mq.equalTo("household", household);
  mq.equalTo("user", user);
  const mem = await mq.first();
  if (mem) await mem.destroy();
}
