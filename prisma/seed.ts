import { PrismaClient } from '../src/generated/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default admin user
  const email = 'admin@inexlabs.com';
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    const passwordHash = bcrypt.hashSync('password123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Inex Admin',
        email,
        passwordHash,
      },
    });
    console.log('Created default admin user:', user.email);
  } else {
    console.log('Admin user already exists.');
  }

  // Create default tags
  const defaultTags = [
    { name: 'Lead', color: '#10B981' },       // Green
    { name: 'VIP', color: '#F59E0B' },        // Amber
    { name: 'Follow-up', color: '#3B82F6' },  // Blue
    { name: 'Support', color: '#EF4444' },    // Red
  ];

  for (const tag of defaultTags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }
  console.log('Created/verified default tags.');

  // Create default message templates
  const defaultTemplates = [
    {
      title: 'Web Concept Presentation',
      body: "Hi,\n\nHere's the concept I put together for you:\n\n[link]",
      category: 'Presentation',
    },
    {
      title: 'Concept Follow-up',
      body: "Just checking in on the concept I sent over.\n\nHappy to make any changes you'd like.",
      category: 'Follow-up',
    },
    {
      title: 'Pricing & Maintenance',
      body: "For a site like this, it's $500 CAD, and hosting/maintenance is $80/month.",
      category: 'Pricing',
    },
  ];

  for (const t of defaultTemplates) {
    const existingTemplate = await prisma.messageTemplate.findFirst({
      where: { title: t.title },
    });
    if (!existingTemplate) {
      await prisma.messageTemplate.create({
        data: t,
      });
    }
  }
  console.log('Created/verified default message templates.');

  // ========================================================
  // Seed Demo Contacts, Conversations, and Message History
  // ========================================================
  console.log('Seeding demo contacts, conversations, and compliance message history...');

  // 1. Delta Plumbing (Active Lead)
  const contact1 = await prisma.contact.upsert({
    where: { phoneNumber: '+18005550101' },
    update: {},
    create: {
      name: 'Delta Plumbing',
      phoneNumber: '+18005550101',
      email: 'contact@deltaplumbing.com',
      companyName: 'Delta Plumbing & Heating',
      notes: 'Active lead from organic search campaign.',
      optedOut: false,
    }
  });

  const conv1 = await prisma.conversation.upsert({
    where: { contactId: contact1.id },
    update: {},
    create: {
      contactId: contact1.id,
      lastMessage: "Sure, let's schedule a call tomorrow morning.",
      lastMessageAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
      unreadCount: 1,
    }
  });

  // Delete existing messages to avoid duplicates on re-runs
  await prisma.message.deleteMany({
    where: { conversationId: conv1.id }
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        direction: 'OUTBOUND',
        body: 'Hello Delta Plumbing! Thanks for requesting a custom preview page.',
        status: 'delivered',
        telnyxId: 'seed_msg_101',
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        conversationId: conv1.id,
        direction: 'INBOUND',
        body: "Sure, let's schedule a call tomorrow morning.",
        status: 'received',
        telnyxId: 'seed_msg_102',
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 60 * 1000),
      }
    ]
  });

  // 2. Penberg Mechanical (Opted Out via STOP compliance keyword)
  const contact2 = await prisma.contact.upsert({
    where: { phoneNumber: '+18005550102' },
    update: {},
    create: {
      name: 'Penberg Mechanical',
      phoneNumber: '+18005550102',
      email: 'info@penbergmech.com',
      companyName: 'Penberg Mechanical',
      notes: 'Cold lead. Opted out via STOP compliance keyword.',
      optedOut: true,
    }
  });

  const conv2 = await prisma.conversation.upsert({
    where: { contactId: contact2.id },
    update: {},
    create: {
      contactId: contact2.id,
      lastMessage: 'Inex Labs: You have successfully opted out. No further messages will be sent.',
      lastMessageAt: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
      unreadCount: 0,
    }
  });

  await prisma.message.deleteMany({
    where: { conversationId: conv2.id }
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv2.id,
        direction: 'OUTBOUND',
        body: 'Hi Penberg! Check out your live mechanics dashboard here: preview.inexlabs.com/penberg-mechanical',
        status: 'delivered',
        telnyxId: 'seed_msg_201',
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        updatedAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        conversationId: conv2.id,
        direction: 'INBOUND',
        body: 'STOP',
        status: 'received',
        telnyxId: 'seed_msg_202',
        createdAt: new Date(Date.now() - 11 * 60 * 1000),
        updatedAt: new Date(Date.now() - 11 * 60 * 1000),
      },
      {
        conversationId: conv2.id,
        direction: 'OUTBOUND',
        body: 'Inex Labs: You have successfully opted out. No further messages will be sent.',
        status: 'delivered',
        telnyxId: 'seed_msg_203',
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 60 * 1000),
      }
    ]
  });

  // 3. Apex Heating (Failed/Carrier Blocked Link Campaign)
  const contact3 = await prisma.contact.upsert({
    where: { phoneNumber: '+18005550103' },
    update: {},
    create: {
      name: 'Apex Heating',
      phoneNumber: '+18005550103',
      email: 'sales@apexheating.com',
      companyName: 'Apex Heating & AC',
      notes: 'Cold campaign lead. Message with custom link was blocked by carriers.',
      optedOut: false,
    }
  });

  const conv3 = await prisma.conversation.upsert({
    where: { contactId: contact3.id },
    update: {},
    create: {
      contactId: contact3.id,
      lastMessage: 'Just resending our custom link: preview.inexlabs.com/apex-heating',
      lastMessageAt: new Date(Date.now() - 2 * 60 * 1000), // 2 mins ago
      unreadCount: 0,
    }
  });

  await prisma.message.deleteMany({
    where: { conversationId: conv3.id }
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv3.id,
        direction: 'OUTBOUND',
        body: 'Hi Apex! Let\'s chat about your heating system preview page: preview.inexlabs.com/apex-heating',
        status: 'filtered', // Carrier Filter Block!
        telnyxId: 'seed_msg_301',
        createdAt: new Date(Date.now() - 4 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 60 * 1000),
      },
      {
        conversationId: conv3.id,
        direction: 'OUTBOUND',
        body: 'Hello Apex! Your new dashboard is online at preview.inexlabs.com/apex-heating',
        status: 'filtered', // Carrier Filter Block!
        telnyxId: 'seed_msg_302',
        createdAt: new Date(Date.now() - 3 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 60 * 1000),
      },
      {
        conversationId: conv3.id,
        direction: 'OUTBOUND',
        body: 'Just resending our custom link: preview.inexlabs.com/apex-heating',
        status: 'filtered', // Carrier Filter Block! (Three filtered outbound messages globally trigger the health alert)
        telnyxId: 'seed_msg_303',
        createdAt: new Date(Date.now() - 2 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 1000),
      }
    ]
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
