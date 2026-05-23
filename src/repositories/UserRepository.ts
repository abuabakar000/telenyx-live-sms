import db from '@/lib/db';

export class UserRepository {
  static async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
    });
  }

  static async findById(id: string) {
    return db.user.findUnique({
      where: { id },
    });
  }

  static async create(data: { name?: string; email: string; passwordHash: string }) {
    return db.user.create({
      data,
    });
  }
}
