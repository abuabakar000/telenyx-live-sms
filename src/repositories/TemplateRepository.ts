import db from '@/lib/db';

export class TemplateRepository {
  static async findById(id: string) {
    return db.messageTemplate.findUnique({
      where: { id },
    });
  }

  static async findAll(params?: { category?: string }) {
    const where: any = {};
    if (params?.category) {
      where.category = params.category;
    }
    return db.messageTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(data: { title: string; body: string; category: string }) {
    return db.messageTemplate.create({
      data,
    });
  }

  static async update(id: string, data: { title?: string; body?: string; category?: string }) {
    return db.messageTemplate.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return db.messageTemplate.delete({
      where: { id },
    });
  }

  static async getCategories() {
    const templates = await db.messageTemplate.findMany({
      select: { category: true },
    });
    // Return distinct categories manually (cleaner for MongoDB Prisma integration)
    const categories = new Set(templates.map((t: any) => t.category));
    return Array.from(categories);
  }
}
