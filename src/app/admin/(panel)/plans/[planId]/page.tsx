import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EditPlanForm } from "@/components/admin/edit-plan-form";
import { BackLink } from "@/components/meetcast/back-link";
import { countUsersOnPlan, getPlanById } from "@/lib/plans/queries";

type PageProps = {
  params: Promise<{ planId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { planId } = await params;
  const plan = await getPlanById(planId);
  return { title: plan ? `Admin · ${plan.name}` : "Plan" };
}

export default async function AdminPlanDetailPage({ params }: PageProps) {
  const { planId } = await params;
  const plan = await getPlanById(planId);
  if (!plan) {
    notFound();
  }
  const assignedUserCount = await countUsersOnPlan(plan.id);

  return (
    <div className="space-y-5">
      <div className="min-w-0 space-y-0.5">
        <BackLink href="/admin/plans" label="Plans" />
        <h2 className="truncate text-xl font-semibold tracking-tight">
          {plan.name}
        </h2>
        <p className="text-sm text-muted-foreground">{plan.slug}</p>
      </div>

      <EditPlanForm
        plan={{
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          maxConcurrentParticipants: plan.maxConcurrentParticipants,
          maxRoomDurationMinutes: plan.maxRoomDurationMinutes,
          priceAmount: plan.priceAmount,
          currency: plan.currency,
          isActive: plan.isActive,
          assignedUserCount,
        }}
      />
    </div>
  );
}
