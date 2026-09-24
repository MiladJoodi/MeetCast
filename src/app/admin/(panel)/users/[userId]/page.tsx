import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AssignPlanForm } from "@/components/admin/assign-plan-form";
import { BlockUserForm } from "@/components/admin/block-user-form";
import { ChangeRoleForm } from "@/components/admin/change-role-form";
import { DeleteUserForm } from "@/components/admin/delete-user-form";
import { RevokeMembershipForm } from "@/components/admin/revoke-membership-form";
import { RevokeSessionsForm } from "@/components/admin/revoke-sessions-form";
import { BackLink } from "@/components/meetcast/back-link";
import { requireAdmin } from "@/lib/admin/authorization";
import { getAdminUserDetail } from "@/lib/admin/queries";
import { FREE_PLAN_SLUG } from "@/lib/plans/constants";
import { getActivePlans, getPlanById } from "@/lib/plans/queries";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const detail = await getAdminUserDetail(userId);
  return { title: detail ? `Admin · ${detail.user.name}` : "User" };
}

function MetaChip({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string | number;
  capitalize?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border/70 bg-surface-elevated px-3 py-2">
      <p className="text-[0.7rem] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-semibold tabular-nums",
          capitalize && "capitalize",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ActionRow({
  label,
  value,
  action,
  danger,
}: {
  label: string;
  value?: ReactNode;
  action: ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border/70 py-3.5 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        danger && "border-danger/20",
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p
          className={cn(
            "text-sm font-medium",
            danger ? "text-danger" : "text-foreground",
          )}
        >
          {label}
        </p>
        {value ? (
          <div className="text-sm text-muted-foreground">{value}</div>
        ) : null}
      </div>
      <div className="w-full shrink-0 sm:w-auto">{action}</div>
    </div>
  );
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { user: actor } = await requireAdmin();
  const { userId } = await params;
  const detail = await getAdminUserDetail(userId);
  if (!detail) {
    notFound();
  }

  const { user, hostedRoomCount, activeSessionCount } = detail;
  const isSelf = actor.id === user.id;
  const [currentPlan, activePlans] = await Promise.all([
    getPlanById(user.planId),
    getActivePlans(),
  ]);

  const createdLabel = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(user.createdAt);

  const planOptions = activePlans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
  }));

  if (
    currentPlan &&
    !planOptions.some((plan) => plan.id === currentPlan.id)
  ) {
    planOptions.unshift({
      id: currentPlan.id,
      name: `${currentPlan.name} (inactive)`,
      slug: currentPlan.slug,
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <BackLink href="/admin/users" label="Users" />
          <h2 className="truncate text-xl font-semibold tracking-tight">
            {user.name}
            {isSelf ? (
              <span className="ml-2 align-middle text-xs font-medium text-brand">
                You
              </span>
            ) : null}
            {user.blockedAt ? (
              <span className="ml-2 align-middle rounded-md bg-danger/15 px-1.5 py-0.5 text-xs font-medium text-danger">
                Blocked
              </span>
            ) : null}
          </h2>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
        <p className="shrink-0 pt-6 text-right text-sm text-muted-foreground">
          Created
          <span className="mt-0.5 block font-medium text-foreground">
            {createdLabel}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <MetaChip label="Role" value={user.role} capitalize />
        <MetaChip label="Plan" value={currentPlan?.name ?? "—"} />
        <MetaChip
          label="Status"
          value={user.blockedAt ? "Blocked" : "Active"}
        />
        <MetaChip label="Rooms" value={hostedRoomCount} />
        <MetaChip label="Sessions" value={activeSessionCount} />
      </div>

      <section className="rounded-xl border border-border/80 bg-surface-elevated px-4">
        <ActionRow
          label="Role"
          value={<span className="capitalize">{user.role}</span>}
          action={
            <ChangeRoleForm
              userId={user.id}
              currentRole={user.role}
              isSelf={isSelf}
            />
          }
        />
        <ActionRow
          label="Plan"
          value={currentPlan?.name ?? "Unknown"}
          action={
            <AssignPlanForm
              userId={user.id}
              currentPlanId={user.planId}
              plans={planOptions}
            />
          }
        />
        <ActionRow
          label="Membership"
          value={
            currentPlan?.slug === FREE_PLAN_SLUG
              ? "Free plan — nothing to revoke"
              : `Currently on ${currentPlan?.name ?? "a paid plan"}`
          }
          action={
            <RevokeMembershipForm
              userId={user.id}
              userName={user.name}
              planName={currentPlan?.name ?? "current plan"}
              alreadyFree={currentPlan?.slug === FREE_PLAN_SLUG}
            />
          }
        />
        <ActionRow
          label="Access"
          value={
            user.blockedAt
              ? "Blocked — cannot sign in"
              : "Active — can sign in"
          }
          danger={!user.blockedAt}
          action={
            <BlockUserForm
              userId={user.id}
              userName={user.name}
              blocked={Boolean(user.blockedAt)}
              disabled={isSelf}
            />
          }
        />
        <ActionRow
          label="Sessions"
          value={`${activeSessionCount} active`}
          action={<RevokeSessionsForm userId={user.id} />}
        />
        <ActionRow
          label="Delete account"
          value="Removes hosted rooms too"
          danger
          action={
            <DeleteUserForm
              userId={user.id}
              userName={user.name}
              disabled={isSelf}
            />
          }
        />
      </section>
    </div>
  );
}
