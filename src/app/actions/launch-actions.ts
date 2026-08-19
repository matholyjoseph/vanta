"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";
import { launchService } from "@/lib/launch/launch-service";

export async function getLaunchChecklistAction() {
  return launchService.getChecklist();
}

export async function updateLaunchCheckAction(key: string, status: string, notes?: string) {
  const user = await getAuthenticatedOrGuestUser();
  const check = await launchService.updateCheckStatus(key, status, notes, user.email || user.id);
  revalidatePath("/admin/launch");
  return check;
}
