import { ContactRepository } from '@/repositories/ContactRepository';
import Papa from 'papaparse';

export class ContactService {
  /**
   * Cleans a phone number into E.164 format.
   * Strips all non-digit characters and prepends '+' if needed.
   * If it's a 10-digit US number, prepends '+1'.
   */
  static cleanPhoneNumber(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return `+${digitsOnly}`;
    }
    return phone.startsWith('+') ? phone : `+${digitsOnly}`;
  }

  static async getContactById(id: string) {
    return ContactRepository.findById(id);
  }

  static async getContactByPhoneNumber(phone: string) {
    const cleanPhone = this.cleanPhoneNumber(phone);
    return ContactRepository.findByPhoneNumber(cleanPhone);
  }

  static async listContacts(params?: { search?: string; tagId?: string }) {
    return ContactRepository.findAll(params);
  }

  static async createContact(data: {
    name: string;
    phoneNumber: string;
    email?: string;
    companyName?: string;
    notes?: string;
    tagIds?: string[];
  }) {
    const cleanPhone = this.cleanPhoneNumber(data.phoneNumber);
    const existing = await ContactRepository.findByPhoneNumber(cleanPhone);
    if (existing) {
      throw new Error(`A contact with phone number ${cleanPhone} already exists.`);
    }

    return ContactRepository.create({
      ...data,
      phoneNumber: cleanPhone,
    });
  }

  static async updateContact(
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
    if (data.phoneNumber) {
      const cleanPhone = this.cleanPhoneNumber(data.phoneNumber);
      const existing = await ContactRepository.findByPhoneNumber(cleanPhone);
      if (existing && existing.id !== id) {
        throw new Error(`A contact with phone number ${cleanPhone} already exists.`);
      }
      data.phoneNumber = cleanPhone;
    }

    return ContactRepository.update(id, data);
  }

  static async deleteContact(id: string) {
    return ContactRepository.delete(id);
  }

  // Tags CRUD
  static async listTags() {
    return ContactRepository.findAllTags();
  }

  static async createTag(name: string, color?: string) {
    const existing = await ContactRepository.findTagByName(name);
    if (existing) return existing;
    return ContactRepository.createTag(name, color);
  }

  /**
   * Imports contacts from a CSV string using PapaParse.
   * CSV headers: Name, Phone, Email, Company, Notes, Tags
   * Tags are comma-separated names, e.g. "Lead, VIP"
   */
  static async importContactsFromCSV(csvContent: string): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    return new Promise((resolve) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          let imported = 0;
          let failed = 0;
          const errors: string[] = [];

          for (const row of results.data as any) {
            try {
              const name = row.Name || row.name || row.FullName || row.fullName;
              const phone = row.Phone || row.phone || row.PhoneNumber || row.phoneNumber;
              const email = row.Email || row.email;
              const company = row.Company || row.company || row.CompanyName || row.companyName;
              const notes = row.Notes || row.notes || row.Note || row.note;
              const tagsString = row.Tags || row.tags;

              if (!name || !phone) {
                failed++;
                errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
                continue;
              }

              const cleanPhone = this.cleanPhoneNumber(phone);

              // Process tags
              const tagIds: string[] = [];
              if (tagsString) {
                const tagNames = tagsString
                  .split(',')
                  .map((t: string) => t.trim())
                  .filter(Boolean);
                for (const tagName of tagNames) {
                  const tag = await this.createTag(tagName);
                  tagIds.push(tag.id);
                }
              }

              // Create or update contact
              const existing = await ContactRepository.findByPhoneNumber(cleanPhone);
              if (existing) {
                // Update contact details
                await ContactRepository.update(existing.id, {
                  name,
                  email: (email || existing.email) ?? undefined,
                  companyName: (company || existing.companyName) ?? undefined,
                  notes: (notes ? `${existing.notes || ''}\n${notes}`.trim() : existing.notes) ?? undefined,
                  tagIds: tagIds.length > 0 ? Array.from(new Set([...existing.tagIds, ...tagIds])) : existing.tagIds,
                });
              } else {
                // Create new contact
                await ContactRepository.create({
                  name,
                  phoneNumber: cleanPhone,
                  email: email || undefined,
                  companyName: company || undefined,
                  notes: notes || undefined,
                  tagIds,
                });
              }

              imported++;
            } catch (err: any) {
              failed++;
              errors.push(`Error importing row ${JSON.stringify(row)}: ${err.message}`);
            }
          }

          resolve({ imported, failed, errors });
        },
        error: (err: any) => {
          resolve({ imported: 0, failed: 1, errors: [err.message] });
        },
      });
    });
  }
}
