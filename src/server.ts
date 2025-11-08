import app from './app';
import config from './config/env';
import prisma from './config/database';

const PORT = config.server.port;

// Start server
const server = app.listen(PORT, async () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║     WorkZen HRMS Backend Server       ║
  ╚════════════════════════════════════════╝
  
  🚀 Server running on port ${PORT}
  🌍 Environment: ${config.server.nodeEnv}
  📊 Database: Connected
  📝 API Documentation: http://localhost:${PORT}/api/health
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
});

