import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

async function start() {
  await connectDB();
  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Server running in ${env.nodeEnv} mode on http://localhost:${env.port}`);
  });

  const shutdown = (signal) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => process.exit(0));
  };
  ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

  process.on('unhandledRejection', (err) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled Rejection:', err);
  });
}

start();
