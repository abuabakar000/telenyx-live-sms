import db from '@/lib/db';

export class ConversationRepository {
  static async findById(id: string) {
    return db.conversation.findUnique({
      where: { id },
      include: { contact: { include: { tags: true } } },
    });
  }

  static async findByContactId(contactId: string) {
    return db.conversation.findUnique({
      where: { contactId },
      include: { contact: { include: { tags: true } } },
    });
  }

  static async findAll(params?: { search?: string }) {
    const where: any = {};

    if (params?.search) {
      where.contact = {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { phoneNumber: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    return db.conversation.findMany({
      where,
      include: {
        contact: {
          include: { tags: true },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });
  }

  static async create(contactId: string, lastMessage?: string) {
    return db.conversation.create({
      data: {
        contactId,
        lastMessage: lastMessage || null,
        lastMessageAt: new Date(),
        unreadCount: 0,
      },
      include: { contact: { include: { tags: true } } },
    });
  }

  static async update(
    id: string,
    data: {
      lastMessage?: string;
      lastMessageAt?: Date;
      unreadCount?: number;
    }
  ) {
    return db.conversation.update({
      where: { id },
      data,
      include: { contact: { include: { tags: true } } },
    });
  }

  static async incrementUnread(id: string, lastMessage: string) {
    return db.conversation.update({
      where: { id },
      data: {
        lastMessage,
        lastMessageAt: new Date(),
        unreadCount: {
          increment: 1,
        },
      },
      include: { contact: { include: { tags: true } } },
    });
  }

  static async resetUnread(id: string) {
    return db.conversation.update({
      where: { id },
      data: {
        unreadCount: 0,
      },
      include: { contact: { include: { tags: true } } },
    });
  }
}
