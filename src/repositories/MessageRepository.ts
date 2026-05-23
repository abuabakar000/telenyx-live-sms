import db from '@/lib/db';

export class MessageRepository {
  static async findById(id: string) {
    return db.message.findUnique({
      where: { id },
    });
  }

  static async findByTelnyxId(telnyxId: string) {
    return db.message.findUnique({
      where: { telnyxId },
    });
  }

  static async findByConversationId(conversationId: string) {
    return db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async create(data: {
    conversationId: string;
    direction: 'INBOUND' | 'OUTBOUND';
    body: string;
    telnyxId?: string | null;
    status: string;
  }) {
    return db.message.create({
      data,
    });
  }

  static async updateStatus(id: string, status: string) {
    return db.message.update({
      where: { id },
      data: { status },
    });
  }

  static async updateStatusByTelnyxId(telnyxId: string, status: string) {
    return db.message.update({
      where: { telnyxId },
      data: { status },
    });
  }

  // Analytics Helpers
  static async countSentToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return db.message.count({
      where: {
        direction: 'OUTBOUND',
        createdAt: { gte: today },
      },
    });
  }

  static async countReceivedToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return db.message.count({
      where: {
        direction: 'INBOUND',
        createdAt: { gte: today },
      },
    });
  }

  static async getDeliveryStats() {
    const totalOutbound = await db.message.count({
      where: { direction: 'OUTBOUND' },
    });

    const deliveredOutbound = await db.message.count({
      where: {
        direction: 'OUTBOUND',
        status: { in: ['delivered', 'sent'] },
      },
    });

    return {
      totalOutbound,
      deliveredOutbound,
      rate: totalOutbound > 0 ? (deliveredOutbound / totalOutbound) * 100 : 100,
    };
  }

  static async getRecentActivity(limit = 10) {
    return db.message.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        conversation: {
          include: { contact: true },
        },
      },
    });
  }
}
