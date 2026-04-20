import {
  clientHouseholdApproveJoinRequest,
  clientHouseholdCreate,
  clientHouseholdInvite,
  clientHouseholdLeave,
  clientHouseholdListMine,
  clientHouseholdListPendingInvitesForMe,
  clientHouseholdListPendingJoinRequestsForAdmin,
  clientHouseholdRejectJoinRequest,
  clientHouseholdRemoveMember,
  clientHouseholdRequestJoin,
} from "./householdParseClient.js";

function toErr(e) {
  if (!e || typeof e !== "object") return new Error("Household request failed.");
  const msg = e.message || String(e);
  return new Error(msg);
}

/**
 * @param {string} name
 * @returns {Promise<{ householdId: string, name: string, role: string }>}
 */
export async function cloudHouseholdCreate(name) {
  try {
    return await clientHouseholdCreate(name);
  } catch (e) {
    throw toErr(e);
  }
}

/**
 * @returns {Promise<Array<{ householdId: string, name: string, role: string }>>}
 */
export async function cloudHouseholdListMine() {
  try {
    return await clientHouseholdListMine();
  } catch (e) {
    throw toErr(e);
  }
}

/**
 * @param {{ householdId: string, email: string, role?: 'admin' | 'member' }} params
 * @returns {Promise<{ inviteId: string, inviteToken: string }>}
 */
export async function cloudHouseholdInvite(params) {
  try {
    return await clientHouseholdInvite(params);
  } catch (e) {
    throw toErr(e);
  }
}

/**
 * Email-based inbox without Cloud Code is not available; always empty.
 * @returns {Promise<[]>}
 */
export async function cloudHouseholdListPendingInvitesForMe() {
  try {
    return await clientHouseholdListPendingInvitesForMe();
  } catch (e) {
    throw toErr(e);
  }
}

/**
 * Partner submits join request (admin must approve in app).
 * @param {string} inviteId
 * @param {string} inviteToken
 */
export async function cloudHouseholdRequestJoin(inviteId, inviteToken) {
  try {
    return await clientHouseholdRequestJoin(inviteId, inviteToken);
  } catch (e) {
    throw toErr(e);
  }
}

/**
 * @returns {Promise<Array<{ requestId: string, householdId: string, householdName: string, requesterName: string, requesterEmail: string, role: string }>>}
 */
export async function cloudHouseholdListPendingJoinRequestsForAdmin() {
  try {
    return await clientHouseholdListPendingJoinRequestsForAdmin();
  } catch (e) {
    throw toErr(e);
  }
}

/**
 * @param {string} requestId
 */
export async function cloudHouseholdApproveJoinRequest(requestId) {
  try {
    return await clientHouseholdApproveJoinRequest(requestId);
  } catch (e) {
    throw toErr(e);
  }
}

/**
 * @param {string} requestId
 */
export async function cloudHouseholdRejectJoinRequest(requestId) {
  try {
    return await clientHouseholdRejectJoinRequest(requestId);
  } catch (e) {
    throw toErr(e);
  }
}

/**
 * @param {string} householdId
 * @param {string} userId
 */
export async function cloudHouseholdRemoveMember(householdId, userId) {
  try {
    return await clientHouseholdRemoveMember(householdId, userId);
  } catch (e) {
    throw toErr(e);
  }
}

/**
 * @param {string} householdId
 */
export async function cloudHouseholdLeave(householdId) {
  try {
    return await clientHouseholdLeave(householdId);
  } catch (e) {
    throw toErr(e);
  }
}
