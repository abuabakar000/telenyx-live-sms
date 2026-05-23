import { TemplateRepository } from '@/repositories/TemplateRepository';

export class TemplateService {
  static async listTemplates(params?: { category?: string }) {
    return TemplateRepository.findAll(params);
  }

  static async getTemplateById(id: string) {
    return TemplateRepository.findById(id);
  }

  static async createTemplate(data: { title: string; body: string; category: string }) {
    if (!data.title || !data.body || !data.category) {
      throw new Error('Title, body, and category are required.');
    }
    return TemplateRepository.create(data);
  }

  static async updateTemplate(id: string, data: { title?: string; body?: string; category?: string }) {
    return TemplateRepository.update(id, data);
  }

  static async deleteTemplate(id: string) {
    return TemplateRepository.delete(id);
  }

  static async listCategories() {
    return TemplateRepository.getCategories();
  }
}
