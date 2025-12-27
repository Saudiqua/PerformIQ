import concurrently from 'concurrently';

const backendPort = process.env.BACKEND_PORT || '5001';
const frontendPort = process.env.PORT || '5000';

console.log(`Starting PerformIQ development server...`);
console.log(`Backend API: http://localhost:${backendPort}`);
console.log(`Frontend UI: http://localhost:${frontendPort}`);

concurrently([
  {
    command: `PORT=${backendPort} tsx watch src/index.ts`,
    name: 'api',
    prefixColor: 'blue',
  },
  {
    command: `cd client && npx vite --port ${frontendPort} --host 0.0.0.0`,
    name: 'web',
    prefixColor: 'green',
  },
], {
  prefix: 'name',
  killOthers: ['failure', 'success'],
  restartTries: 3,
});
