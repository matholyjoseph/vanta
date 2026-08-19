import { db } from "@/lib/db";

export class SupportService {
  public async createTicket(userId: string, data: {
    workspaceId?: string;
    category: string;
    priority?: string;
    subject: string;
    message: string;
  }) {
    const ticket = await db.supportTicket.create({
      data: {
        userId,
        workspaceId: data.workspaceId || null,
        category: data.category,
        priority: data.priority || "NORMAL",
        subject: data.subject,
        message: data.message,
        status: "OPEN",
      },
    });

    return ticket;
  }

  public async getUserTickets(userId: string) {
    return db.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  public async getAllTicketsAdmin() {
    return db.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}

export const supportService = new SupportService();
