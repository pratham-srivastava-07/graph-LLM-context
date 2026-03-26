import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from "path"
import fs from 'fs';
import { createSchema } from './services/db';
import { seed } from './data/seed';
import graphRouter from './routes/graph';
import queryRouter from './routes/query';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// Request logging
app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/graph', graphRouter);
app.use('/query', queryRouter);

// Health check
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Schema info endpoint
app.get('/schema', (_req: express.Request, res: express.Response) => {
  res.json({
    tables: ['customers', 'addresses', 'products', 'orders', 'order_items', 'deliveries', 'invoices', 'payments'],
    relationships: [
      'Order → PLACED_BY → Customer',
      'Order → SHIPS_TO → Address',
      'Order → HAS_ITEM → OrderItem',
      'OrderItem → CONTAINS → Product',
      'Delivery → FULFILLS → Order',
      'Delivery → DELIVERED_TO → Address',
      'Invoice → BILLED_FOR → Order',
      'Payment → SETTLED_BY → Invoice',
    ]
  });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

function bootstrap(): void {
  const dataDir = path.join(__dirname, '../data');
  const dbPath = path.join(dataDir, 'o2c.db');

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(dbPath)) {
    console.log('🗄️  First run: creating schema and seeding data...');
    createSchema();
    seed();
  } else {
    console.log('🗄️  Database found, ensuring schema...');
    createSchema();
  }

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║   SAP O2C Graph Query API                 ║
║   Running on http://localhost:${PORT}     ║
╚═══════════════════════════════════════════╝
    `);
  });
}

bootstrap();

export default app;