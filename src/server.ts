import cookieParser from 'cookie-parser';
import app from './app.js';
import config from './config/config.js';
app.use(cookieParser());
let server: ReturnType<typeof app.listen>;
const startServer = () => {
  try {
    server = app.listen(config.PORT, () => {
      console.log(`Server is running on port ${config.PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};
// Process Error Handlers
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION!  Shutting down...');
  console.error(err.name, err.message);

  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('UNHANDLED REJECTION!  Shutting down...');
  console.error(reason);

  if (server) {
    server.close(async () => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful Shutdown

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    process.exit(0);
  });
});

startServer();
