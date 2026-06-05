import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (k) process.env[k] = v;
  }
}

loadEnv();

import { User } from './modules/auth/entities/user.entity';
import { Event } from './modules/events/entities/event.entity';
import { Ticket } from './modules/tickets/entities/ticket.entity';
import { Reminder } from './modules/notifications/entities/reminder.entity';
import { Role } from './modules/auth/enums/role.enum';

const CREATORS = [
  { email: 'aminu@techbauchi.ng', password: 'password123', name: 'Aminu Bakori' },
  { email: 'zainab@kanohub.ng', password: 'password123', name: 'Zainab Ado Kurawa' },
  { email: 'musa@arewadev.ng', password: 'password123', name: 'Musa Aliyu' },
  { email: 'aisha@husa.ng', password: 'password123', name: 'Aisha Suleiman' },
];

const EVENTS = [
  {
    title: 'Bauchi Tech Summit 2026',
    description: 'Babban taron fasaha na shekara a Bauchi. Muna tattaro masu fasaha, entrepreneurs, da innovators daga Arewacin Najeriya domin tattaunawa kan software development, fintech, da digital transformation a yankin.',
    venue: 'Zaranda Hotel, Bauchi',
    date: '2026-09-12T09:00:00.000Z',
    price: 8000,
    capacity: 300,
    category: 'CONFERENCE',
    creatorEmail: 'aminu@techbauchi.ng',
  },
  {
    title: 'Kano Code Fest 2026',
    description: 'Kano ta zamo cibiyar tech a Arewa. Taron na shekara na masu coding a Kano — Python, JavaScript, da mobile app development. Workshops, networking, da hackathon a cikin tsohon birni.',
    venue: 'Tahir Guest Palace, Kano',
    date: '2026-10-03T10:00:00.000Z',
    price: 10000,
    capacity: 400,
    category: 'FESTIVAL',
    creatorEmail: 'zainab@kanohub.ng',
  },
  {
    title: 'Arewa AI Conference',
    description: 'Taron farko na Artificial Intelligence a Arewacin Najeriya. Muna magana kan AI applications a agriculture, health, da education. Hausa language NLP projects, machine learning, da data science workshops.',
    venue: 'Bilkisu International Hotel, Kaduna',
    date: '2026-08-22T09:00:00.000Z',
    price: 12000,
    capacity: 250,
    category: 'CONFERENCE',
    creatorEmail: 'musa@arewadev.ng',
  },
  {
    title: 'Jos DevOps Meetup',
    description: 'Monthly DevOps gathering on the Plateau. This edition features containerization with Docker, Kubernetes on bare-metal, CI/CD pipelines for teams, and infrastructure as code demos.',
    venue: 'Rayfield Resort, Jos, Plateau State',
    date: '2026-07-18T14:00:00.000Z',
    price: 3000,
    capacity: 80,
    category: 'WORKSHOP',
    creatorEmail: 'aisha@husa.ng',
  },
  {
    title: 'Abuja CyberSecure Summit',
    description: 'Security conference focused on securing government and enterprise infrastructure in Nigeria. Zero-trust architecture, incident response, and compliance frameworks for African organizations.',
    venue: 'Transcorp Hilton, Abuja',
    date: '2026-11-07T09:00:00.000Z',
    price: 35000,
    capacity: 300,
    category: 'CONFERENCE',
    creatorEmail: 'musa@arewadev.ng',
  },
  {
    title: 'Kano Fintech Hackathon',
    description: '48-hour hackathon building financial solutions for the unbanked in Northern Nigeria. Focus on mobile money, agent banking, and Sharia-compliant fintech products.',
    venue: 'Kano Digital Hub, Kano',
    date: '2026-08-15T08:00:00.000Z',
    price: 5000,
    capacity: 150,
    category: 'WORKSHOP',
    creatorEmail: 'zainab@kanohub.ng',
  },
  {
    title: 'Hausa NLP Workshop',
    description: 'Natural language processing for Hausa language. Building datasets, training models for Hausa text, speech recognition, and machine translation. Open-source tools for African languages.',
    venue: 'Abubakar Tafawa Balewa University, Bauchi',
    date: '2026-09-28T10:00:00.000Z',
    price: 5000,
    capacity: 120,
    category: 'WORKSHOP',
    creatorEmail: 'aminu@techbauchi.ng',
  },
  {
    title: 'Arewa Digital Entrepreneurship',
    description: 'Taron kasuwanci na dijital a Arewa. Muna koyar da yadda ake amfani da tech don haɓaka kasuwanci — e-commerce, digital marketing, da financial literacy ga matasa Arewa.',
    venue: 'Arewa House, Kaduna',
    date: '2026-10-15T09:00:00.000Z',
    price: 7000,
    capacity: 200,
    category: 'WORKSHOP',
    creatorEmail: 'zainab@kanohub.ng',
  },
  {
    title: 'React JS Abuja',
    description: 'One-day React conference featuring talks on Next.js, server components, state management, and building performant UIs for African markets with limited bandwidth.',
    venue: 'Shehu Musa Yar\'Adua Centre, Abuja',
    date: '2026-07-26T09:00:00.000Z',
    price: 15000,
    capacity: 200,
    category: 'CONFERENCE',
    creatorEmail: 'musa@arewadev.ng',
  },
  {
    title: 'Women in Tech Arewa',
    description: 'Taron mata masu fasaha a Arewacin Najeriya. Mentorship workshops, career guidance, coding classes, da networking don mata Hausawa da suke son shiga tech industry.',
    venue: 'Jos Business School, Jos',
    date: '2026-09-05T09:00:00.000Z',
    price: 4000,
    capacity: 150,
    category: 'WORKSHOP',
    creatorEmail: 'aisha@husa.ng',
  },
  {
    title: 'AgriTech Northern Nigeria',
    description: 'Leveraging technology for agriculture in the North. IoT sensors for dry-season farming, drone monitoring for crops, marketplace platforms, and climate-resilient farming solutions.',
    venue: 'Federal University of Agriculture Zuru, Kebbi State',
    date: '2026-10-25T09:00:00.000Z',
    price: 8000,
    capacity: 250,
    category: 'CONFERENCE',
    creatorEmail: 'aminu@techbauchi.ng',
  },
  {
    title: 'Open Source na Arewa',
    description: 'Contributing to open source from Northern Nigeria. Git/GitHub workshops, finding your first issue, maintaining projects, and building portfolios through open-source contributions.',
    venue: 'Gidan Makama Museum, Kano',
    date: '2026-08-08T10:00:00.000Z',
    price: 2000,
    capacity: 100,
    category: 'WORKSHOP',
    creatorEmail: 'zainab@kanohub.ng',
  },
  {
    title: 'Cloud Native Kaduna',
    description: 'Cloud computing and serverless architectures for Nigerian startups. AWS Lambda, Cloudflare Workers, database scaling, and cost optimization for bootstrapped teams.',
    venue: 'Umaru Musa Yar\'Adua Memorial Centre, Kaduna',
    date: '2026-11-15T09:00:00.000Z',
    price: 12000,
    capacity: 180,
    category: 'CONFERENCE',
    creatorEmail: 'musa@arewadev.ng',
  },
  {
    title: 'Tafawa Balewa Tech Week',
    description: 'Makon fasaha a Bauchi. Jerin taron kwanaki biyar — coding bootcamp, career fair, panel discussions, da pitching competition ga matasa masu fasaha a jihar Bauchi.',
    venue: 'ATBU Conference Hall, Bauchi',
    date: '2026-07-07T09:00:00.000Z',
    price: 3000,
    capacity: 500,
    category: 'FESTIVAL',
    creatorEmail: 'aminu@techbauchi.ng',
  },
  {
    title: 'Jos Creative Tech Fest',
    description: 'Where technology meets Plateau creativity. Game development, animation, digital art, and UI/UX design workshops inspired by the vibrant arts culture of Jos.',
    venue: 'Jos Wildlife Park Event Centre, Jos',
    date: '2026-10-08T10:00:00.000Z',
    price: 6000,
    capacity: 200,
    category: 'FESTIVAL',
    creatorEmail: 'aisha@husa.ng',
  },
  {
    title: 'Blockchain da Web3 Arewa',
    description: 'Fahimtar blockchain technology da Web3 a cikin Hausa. Smart contracts, cryptocurrency, NFTs, da yadda za a yi amfani da wannan fasaha a kasuwancin Arewacin Najeriya.',
    venue: 'Kano State Library Complex, Kano',
    date: '2026-11-28T10:00:00.000Z',
    price: 5000,
    capacity: 150,
    category: 'WORKSHOP',
    creatorEmail: 'aisha@husa.ng',
  },
];

async function bootstrap() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DB_URL,
    entities: [User, Event, Ticket, Reminder],
    synchronize: true,
  });

  await ds.initialize();
  console.log('Database connected.\n');

  const userRepo = ds.getRepository(User);
  const eventRepo = ds.getRepository(Event);

  const createdUsers = new Map<string, User>();
  for (const c of CREATORS) {
    let user = await userRepo.findOneBy({ email: c.email });
    if (user) {
      createdUsers.set(c.email, user);
      console.log(`Skipped existing user: ${c.email}`);
      continue;
    }
    const hash = await bcrypt.hash(c.password, 10);
    user = userRepo.create({ email: c.email, passwordHash: hash, role: Role.CREATOR, name: c.name });
    user = await userRepo.save(user);
    createdUsers.set(c.email, user);
    console.log(`Created user: ${c.email} (CREATOR)`);
  }

  console.log('');

  let created = 0;
  let skipped = 0;
  for (const e of EVENTS) {
    const existing = await eventRepo.findOneBy({ title: e.title });
    if (existing) {
      skipped++;
      continue;
    }
    const creator = createdUsers.get(e.creatorEmail);
    if (!creator) {
      console.error(`Creator not found: ${e.creatorEmail}`);
      continue;
    }
    const event = eventRepo.create({
      title: e.title,
      description: e.description,
      venue: e.venue,
      date: new Date(e.date),
      price: e.price,
      capacity: e.capacity,
      category: e.category,
      creatorId: creator.id,
    });
    await eventRepo.save(event);
    created++;
    console.log(`Created event: ${e.title}`);
  }

  console.log(`\nDone. ${created} events created, ${skipped} skipped (already exist).`);
  await ds.destroy();
}

bootstrap().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
