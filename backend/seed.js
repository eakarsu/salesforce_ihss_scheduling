console.error('The legacy destructive seed has been retired. Run explicit migrations, then use backend/db/fixtures.js only against an empty disposable database.');
process.exitCode = 2;
