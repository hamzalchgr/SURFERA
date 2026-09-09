import concurrently from 'concurrently';

concurrently([
   {
      name: 'server',
      cwd: 'packages/server',
      command: 'bun run dev',
      prefixColor: 'cyan',
   },
   {
      name: 'client',
      cwd: 'packages/client',
      command: 'bun run dev',
      prefixColor: 'green',
   }
])