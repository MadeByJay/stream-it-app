import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { databasePool } from '../../src/db/databasePool';

dotenv.config();

async function runSql(directoryLabel: string, directoryPath: string) {
  if (!fs.existsSync(directoryPath)) {
    console.warn(
      `Directory for ${directoryLabel} does not exist: ${directoryPath}`,
    );
    return;
  }

  const fileNames = fs
    .readdirSync(directoryPath)
    .filter((filename) => filename.endsWith('.sql'))
    .sort();

  if (fileNames.length === 0) {
    console.log(`No ${directoryLabel} files found in ${directoryPath}`);
    return;
  }

  console.log(`Running ${directoryLabel} from ${directoryPath}`);

  for (const fileName of fileNames) {
    const filePath = path.join(directoryPath, fileName);
    const sqlText = fs.readFileSync(filePath, { encoding: 'utf-8' });

    if (!sqlText.trim()) {
      console.log(`Skipping empty ${directoryLabel} file: ${fileName}`);
      continue;
    }

    console.log(`Running ${directoryLabel} file: ${fileName}`);

    try {
      await databasePool.query(sqlText);
      console.log(`Completed ${fileName}`);
    } catch (error) {
      console.error(`Error executing ${fileName}`);
      throw error;
    }
  }
}

async function runDatabaseSetup() {
  console.log('Starting database setup (migrations and seeding)');

  const migrationsDirectoryPath = path.resolve(
    __dirname,
    '../../db/migrations',
  );
  const seedsDirectoryPath = path.resolve(__dirname, '../../db/seeds');

  await runSql('migrations', migrationsDirectoryPath);
  await runSql('seeds', seedsDirectoryPath);

  console.log('Database setup complete');
}

runDatabaseSetup()
  .then(async () => {
    await databasePool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Database setup failed', error);
    await databasePool.end();
    process.exit(1);
  });
