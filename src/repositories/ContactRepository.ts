import db from '@/lib/db';

export class ContactRepository {
  static async findById(id: string) {
    return db.contact.findUnique({
      where: { id },
      include: { tags: true },
    });
  }

  static async findByPhoneNumber(phoneNumber: string) {
    return db.contact.findUnique({
      where: { phoneNumber },
      include: { tags: true },
    });
  }

  static async findAll(params?: { search?: string; tagId?: string }) {
    const where: any = {};

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { phoneNumber: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { companyName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params?.tagId) {
      where.tagIds = { has: params.tagId };
    }

    return db.contact.findMany({
      where,
      include: { tags: true },
      orderBy: { name: 'asc' },
    });
  }

  static async create(data: {
    name: string;
    phoneNumber: string;
    email?: string;
    companyName?: string;
    notes?: string;
    tagIds?: string[];
  }) {
    return db.contact.create({
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        email: data.email || null,
        companyName: data.companyName || null,
        notes: data.notes || null,
        tagIds: data.tagIds || [],
      },
      include: { tags: true },
    });
  }

  static async update(
    id: string,
    data: {
      name?: string;
      phoneNumber?: string;
      email?: string;
      companyName?: string;
      notes?: string;
      tagIds?: string[];
    }
  ) {
    return db.contact.update({
      where: { id },
      data,
      include: { tags: true },
    });
  }

  static async delete(id: string) {
    return db.contact.delete({
      where: { id },
    });
  }

  // Tags Helper Queries
  static async findAllTags() {
    return db.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async findTagByName(name: string) {
    return db.tag.findUnique({
      where: { name },
    });
  }

  static async createTag(name: string, color?: string) {
    return db.tag.create({
      data: { name, color: color || '#3B82F6' },
    });
  }
}
