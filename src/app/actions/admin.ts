"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z, ZodError } from "zod";

import { db } from "@/db";
import { plans, rooms, users, type UserRole } from "@/db/schema";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { countAdmins, requireAdmin } from "@/lib/admin/authorization";
import {
  assertCanBlockUserAsAdmin,
  assertCanChangeUserRole,
  assertCanDeleteUserAsAdmin,
  isValidUserRole,
} from "@/lib/admin/policy";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { toSafeClientError } from "@/lib/errors";
import { deleteLiveKitRoom } from "@/lib/livekit/token";
import { logger } from "@/lib/logger";
import {
  assertPlanCanBeAssigned,
  assertPlanCanBeDeleted,
} from "@/lib/plans/limits";
import { countUsersOnPlan, getFreePlan } from "@/lib/plans/queries";
import {
  assignPlanSchema,
  createPlanSchema,
  planIdSchema,
  updatePlanSchema,
} from "@/lib/plans/validation";
import { endRoomNow } from "@/lib/rooms/end-room";
import { getRoomById } from "@/lib/rooms/queries";
import { assertAdminMutationRateLimit } from "@/lib/security/rate-limit";
import { deleteUserAccount } from "@/lib/users/delete-account";

export type AdminActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const flattened = error.flatten();
  const fieldErrors = flattened.fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const result: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      result[key] = messages;
    }
  }
  return result;
}

function actionError(error: unknown): AdminActionState {
  const safe = toSafeClientError(error);
  return { ok: false, message: safe.message };
}

async function requireAdminWithRateLimit() {
  const result = await requireAdmin();
  await assertAdminMutationRateLimit(result.user.id);
  return result;
}

const userIdSchema = z.object({
  userId: z.string().uuid("Invalid user."),
});

const roomIdSchema = z.object({
  roomId: z.string().uuid("Invalid room."),
});

const changeRoleSchema = z.object({
  userId: z.string().uuid("Invalid user."),
  role: z.string(),
});

export async function changeUserRoleAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let actor;
  try {
    ({ user: actor } = await requireAdminWithRateLimit());
  } catch (error) {
    return actionError(error);
  }

  const parsed = changeRoleSchema.safeParse({
    userId: formString(formData, "userId"),
    role: formString(formData, "role"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid request.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { userId, role: rawRole } = parsed.data;
  if (!isValidUserRole(rawRole)) {
    return { ok: false, message: "Invalid role." };
  }
  const nextRole: UserRole = rawRole;

  try {
    const rows = await db
      .select({
        id: users.id,
        role: users.role,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const target = rows[0];
    if (!target) {
      return { ok: false, message: "User not found." };
    }

    const adminCount = await countAdmins();
    assertCanChangeUserRole({
      actorId: actor.id,
      targetId: target.id,
      targetCurrentRole: target.role,
      nextRole,
      adminCount,
    });

    if (target.role === nextRole) {
      return { ok: true, message: "Role unchanged." };
    }

    await db
      .update(users)
      .set({ role: nextRole })
      .where(eq(users.id, target.id));

    await writeAdminAuditLog({
      actorUserId: actor.id,
      action: "user.role_changed",
      targetType: "user",
      targetId: target.id,
      metadata: { from: target.role, to: nextRole },
    });

    logger.info("admin.user_role_changed", {
      actorId: actor.id,
      targetId: target.id,
      from: target.role,
      to: nextRole,
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${target.id}`);
    return { ok: true, message: `Role updated to ${nextRole}.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function revokeUserSessionsAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let actor;
  try {
    ({ user: actor } = await requireAdminWithRateLimit());
  } catch (error) {
    return actionError(error);
  }

  const parsed = userIdSchema.safeParse({
    userId: formString(formData, "userId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid user.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const target = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, parsed.data.userId))
      .limit(1);

    if (!target[0]) {
      return { ok: false, message: "User not found." };
    }

    const revoked = await revokeAllSessionsForUser(target[0].id);

    await writeAdminAuditLog({
      actorUserId: actor.id,
      action: "user.sessions_revoked",
      targetType: "user",
      targetId: target[0].id,
      metadata: { count: revoked },
    });

    revalidatePath(`/admin/users/${target[0].id}`);
    return {
      ok: true,
      message:
        revoked === 0
          ? "No active sessions to revoke."
          : `Revoked ${revoked} session${revoked === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteUserAsAdminAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let actor;
  try {
    ({ user: actor } = await requireAdminWithRateLimit());
  } catch (error) {
    return actionError(error);
  }

  const parsed = userIdSchema.safeParse({
    userId: formString(formData, "userId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid user.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    assertCanDeleteUserAsAdmin({
      actorId: actor.id,
      targetId: parsed.data.userId,
    });

    const target = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, parsed.data.userId))
      .limit(1);

    if (!target[0]) {
      return { ok: false, message: "User not found." };
    }

    if (target[0].role === "admin") {
      const adminCount = await countAdmins();
      if (adminCount <= 1) {
        return {
          ok: false,
          message: "Cannot delete the last remaining administrator.",
        };
      }
    }

    await writeAdminAuditLog({
      actorUserId: actor.id,
      action: "user.deleted",
      targetType: "user",
      targetId: target[0].id,
      metadata: { email: target[0].email, role: target[0].role },
    });

    await deleteUserAccount(target[0].id);

    revalidatePath("/admin/users");
    revalidatePath("/admin");
  } catch (error) {
    return actionError(error);
  }

  redirect("/admin/users");
}

export async function deleteRoomAsAdminAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let actor;
  try {
    ({ user: actor } = await requireAdminWithRateLimit());
  } catch (error) {
    return actionError(error);
  }

  const parsed = roomIdSchema.safeParse({
    roomId: formString(formData, "roomId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid room.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const room = await getRoomById(parsed.data.roomId);
    if (!room) {
      return { ok: false, message: "Room not found." };
    }

    await deleteLiveKitRoom(room.id);
    await db.delete(rooms).where(eq(rooms.id, room.id));

    await writeAdminAuditLog({
      actorUserId: actor.id,
      action: "room.deleted",
      targetType: "room",
      targetId: room.id,
      metadata: { title: room.title, hostUserId: room.hostUserId },
    });

    revalidatePath("/admin/rooms");
    revalidatePath("/admin");
  } catch (error) {
    return actionError(error);
  }

  redirect("/admin/rooms");
}

export async function endRoomAsAdminAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let actor;
  try {
    ({ user: actor } = await requireAdminWithRateLimit());
  } catch (error) {
    return actionError(error);
  }

  const parsed = roomIdSchema.safeParse({
    roomId: formString(formData, "roomId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid room.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const room = await getRoomById(parsed.data.roomId);
    if (!room) {
      return { ok: false, message: "Room not found." };
    }

    await endRoomNow(room);

    await writeAdminAuditLog({
      actorUserId: actor.id,
      action: "room.ended",
      targetType: "room",
      targetId: room.id,
      metadata: { title: room.title },
    });

    revalidatePath(`/admin/rooms/${room.id}`);
    revalidatePath("/admin/rooms");
    revalidatePath("/admin");
    return { ok: true, message: "Room ended. Participants will be disconnected." };
  } catch (error) {
    return actionError(error);
  }
}

export async function createPlanAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let actor;
  try {
    ({ user: actor } = await requireAdminWithRateLimit());
  } catch (error) {
    return actionError(error);
  }

  const parsed = createPlanSchema.safeParse({
    name: formString(formData, "name"),
    slug: formString(formData, "slug"),
    description: formString(formData, "description"),
    maxConcurrentParticipants: formString(formData, "maxConcurrentParticipants"),
    maxRoomDurationMinutes: formString(formData, "maxRoomDurationMinutes"),
    priceAmount: formString(formData, "priceAmount") || "0",
    currency: formString(formData, "currency") || "IRR",
    isActive: formString(formData, "isActive") || "true",
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const created = await db
      .insert(plans)
      .values({
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        maxConcurrentParticipants: parsed.data.maxConcurrentParticipants,
        maxRoomDurationMinutes: parsed.data.maxRoomDurationMinutes,
        priceAmount: parsed.data.priceAmount,
        currency: parsed.data.currency,
        isActive: parsed.data.isActive,
      })
      .returning({ id: plans.id });

    const plan = created[0];
    if (!plan) {
      throw new Error("Plan insert returned no row");
    }

    await writeAdminAuditLog({
      actorUserId: actor.id,
      action: "plan.created",
      targetType: "plan",
      targetId: plan.id,
      metadata: { slug: parsed.data.slug, name: parsed.data.name },
    });

    revalidatePath("/admin/plans");
    return { ok: true, message: "Plan created." };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        fieldErrors: { slug: ["This slug is already taken."] },
      };
    }
    return actionError(error);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export async function updatePlanAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let actor;
  try {
    ({ user: actor } = await requireAdminWithRateLimit());
  } catch (error) {
    return actionError(error);
  }

  const parsed = updatePlanSchema.safeParse({
    planId: formString(formData, "planId"),
    name: formString(formData, "name"),
    slug: formString(formData, "slug"),
    description: formString(formData, "description"),
    maxConcurrentParticipants: formString(formData, "maxConcurrentParticipants"),
    maxRoomDurationMinutes: formString(formData, "maxRoomDurationMinutes"),
    priceAmount: formString(formData, "priceAmount") || "0",
    currency: formString(formData, "currency") || "IRR",
    isActive: formString(formData, "isActive") || "true",
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const existing = await db
      .select()
      .from(plans)
      .where(eq(plans.id, parsed.data.planId))
      .limit(1);
    if (!existing[0]) {
      return { ok: false, message: "Plan not found." };
    }

    await db
      .update(plans)
      .set({
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        maxConcurrentParticipants: parsed.data.maxConcurrentParticipants,
        maxRoomDurationMinutes: parsed.data.maxRoomDurationMinutes,
        priceAmount: parsed.data.priceAmount,
        currency: parsed.data.currency,
        isActive: parsed.data.isActive,
      })
      .where(eq(plans.id, parsed.data.planId));

    const becameActive =
      !existing[0].isActive && parsed.data.isActive === true;
    const becameInactive =
      existing[0].isActive && parsed.data.isActive === false;

    await writeAdminAuditLog({
      actorUserId: actor.id,
      action: becameActive
        ? "plan.activated"
        : becameInactive
          ? "plan.deactivated"
          : "plan.updated",
      targetType: "plan",
      targetId: parsed.data.planId,
      metadata: { slug: parsed.data.slug },
    });

    revalidatePath("/admin/plans");
    revalidatePath(`/admin/plans/${parsed.data.planId}`);
    return { ok: true, message: "Plan updated." };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        fieldErrors: { slug: ["This slug is already taken."] },
      };
    }
    return actionError(error);
  }
}

export async function deletePlanAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let actor;
  try {
    ({ user: actor } = await requireAdminWithRateLimit());
  } catch (error) {
    return actionError(error);
  }

  const parsed = planIdSchema.safeParse({
    planId: formString(formData, "planId"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Invalid plan." };
  }

  try {
    const assigned = await countUsersOnPlan(parsed.data.planId);
    assertPlanCanBeDeleted(assigned);

    const existing = await db
      .select({ id: plans.id, slug: plans.slug })
      .from(plans)
      .where(eq(plans.id, parsed.data.planId))
      .limit(1);
    if (!existing[0]) {
      return { ok: false, message: "Plan not found." };
    }

    await db.delete(plans).where(eq(plans.id, parsed.data.planId));

    await writeAdminAuditLog({
      actorUserId: actor.id,
      action: "plan.deleted",
      targetType: "plan",
      targetId: parsed.data.planId,
      metadata: { slug: existing[0].slug },
    });

    revalidatePath("/admin/plans");
  } catch (error) {
    return actionError(error);
  }

  redirect("/admin/plans");
}

export async function assignUserPlanAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let actor;
  try {
    ({ user: actor } = await requireAdminWithRateLimit());
  } catch (error) {
    return actionError(error);
  }

  const parsed = assignPlanSchema.safeParse({
    userId: formString(formData, "userId"),
    planId: formString(formData, "planId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid request.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const planRows = await db
      .select()
      .from(plans)
      .where(eq(plans.id, parsed.data.planId))
      .limit(1);
    const plan = planRows[0];
    if (!plan) {
      return { ok: false, message: "Plan not found." };
    }
    assertPlanCanBeAssigned(plan);

    const userRows = await db
      .select({ id: users.id, planId: users.planId })
      .from(users)
      .where(eq(users.id, parsed.data.userId))
      .limit(1);
    if (!userRows[0]) {
      return { ok: false, message: "User not found." };
    }

    await db
      .update(users)
      .set({ planId: plan.id })
      .where(eq(users.id, parsed.data.userId));

    await writeAdminAuditLog({
      actorUserId: actor.id,
      action: "user.plan_changed",
      targetType: "user",
      targetId: parsed.data.userId,
      metadata: {
        fromPlanId: userRows[0].planId,
        toPlanId: plan.id,
        toSlug: plan.slug,
      },
    });

    revalidatePath(`/admin/users/${parsed.data.userId}`);
    revalidatePath("/admin/users");
    return { ok: true, message: `Plan set to ${plan.name}.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function blockUserAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  formData.set("intent", "block");
  return setUserBlockAction(_prevState, formData);
}

export async function unblockUserAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  formData.set("intent", "unblock");
  return setUserBlockAction(_prevState, formData);
}

export async function setUserBlockAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let actor;
  try {
    ({ user: actor } = await requireAdminWithRateLimit());
  } catch (error) {
    return actionError(error);
  }

  const intentRaw = formString(formData, "intent");
  const intent = intentRaw === "unblock" ? "unblock" : "block";

  const parsed = userIdSchema.safeParse({
    userId: formString(formData, "userId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid user.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const targetRows = await db
      .select({
        id: users.id,
        role: users.role,
        blockedAt: users.blockedAt,
      })
      .from(users)
      .where(eq(users.id, parsed.data.userId))
      .limit(1);
    const target = targetRows[0];
    if (!target) {
      return { ok: false, message: "User not found." };
    }

    if (intent === "block") {
      if (target.blockedAt) {
        return { ok: true, message: "User is already blocked." };
      }

      const adminCount = await countAdmins();
      assertCanBlockUserAsAdmin({
        actorId: actor.id,
        targetId: target.id,
        targetRole: target.role,
        adminCount,
      });

      await db
        .update(users)
        .set({ blockedAt: new Date() })
        .where(eq(users.id, target.id));

      const revoked = await revokeAllSessionsForUser(target.id);

      await writeAdminAuditLog({
        actorUserId: actor.id,
        action: "user.blocked",
        targetType: "user",
        targetId: target.id,
        metadata: { sessionsRevoked: revoked },
      });

      revalidatePath(`/admin/users/${target.id}`);
      revalidatePath("/admin/users");
      return {
        ok: true,
        message: "User blocked and signed out everywhere.",
      };
    }

    if (!target.blockedAt) {
      return { ok: true, message: "User is not blocked." };
    }

    await db
      .update(users)
      .set({ blockedAt: null })
      .where(eq(users.id, target.id));

    await writeAdminAuditLog({
      actorUserId: actor.id,
      action: "user.unblocked",
      targetType: "user",
      targetId: target.id,
      metadata: {},
    });

    revalidatePath(`/admin/users/${target.id}`);
    revalidatePath("/admin/users");
    return { ok: true, message: "User unblocked. They can sign in again." };
  } catch (error) {
    return actionError(error);
  }
}

/**
 * Cancels paid membership by assigning the Free plan. Account stays active.
 */
export async function revokeUserMembershipAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let actor;
  try {
    ({ user: actor } = await requireAdminWithRateLimit());
  } catch (error) {
    return actionError(error);
  }

  const parsed = userIdSchema.safeParse({
    userId: formString(formData, "userId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid user.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const free = await getFreePlan();
    assertPlanCanBeAssigned(free);

    const userRows = await db
      .select({
        id: users.id,
        planId: users.planId,
      })
      .from(users)
      .where(eq(users.id, parsed.data.userId))
      .limit(1);
    const target = userRows[0];
    if (!target) {
      return { ok: false, message: "User not found." };
    }

    if (target.planId === free.id) {
      return { ok: true, message: "User is already on the Free plan." };
    }

    const fromPlanRows = await db
      .select({ slug: plans.slug, name: plans.name })
      .from(plans)
      .where(eq(plans.id, target.planId))
      .limit(1);
    const fromPlan = fromPlanRows[0];

    await db
      .update(users)
      .set({ planId: free.id })
      .where(eq(users.id, target.id));

    await writeAdminAuditLog({
      actorUserId: actor.id,
      action: "user.membership_revoked",
      targetType: "user",
      targetId: target.id,
      metadata: {
        fromPlanId: target.planId,
        fromSlug: fromPlan?.slug ?? null,
        fromName: fromPlan?.name ?? null,
        toPlanId: free.id,
        toSlug: free.slug,
      },
    });

    revalidatePath(`/admin/users/${target.id}`);
    revalidatePath("/admin/users");
    return {
      ok: true,
      message: `Membership revoked. Plan set to ${free.name}.`,
    };
  } catch (error) {
    return actionError(error);
  }
}
