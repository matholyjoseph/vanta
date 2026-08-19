"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedOrGuestUser } from "@/lib/guest-auth";
import { supportService } from "@/lib/support/support-service";

export async function createSupportTicketAction(data: {
  workspaceId?: string;
  category: string;
  priority?: string;
  subject: string;
  message: string;
}) {
  const user = await getAuthenticatedOrGuestUser();
  const ticket = await supportService.createTicket(user.id, data);
  revalidatePath("/support");
  return ticket;
}

export async function getUserSupportTicketsAction() {
  const user = await getAuthenticatedOrGuestUser();
  return supportService.getUserTickets(user.id);
}
