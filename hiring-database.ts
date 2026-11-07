import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import initSqlJs, { type Database as SqlDatabase } from 'sql.js';

const require = createRequire(import.meta.url);

export type HiringVacancy = {
  id: string;
  title: string;
  companyName: string;
  description: string;
  requiredCriteria: string[];
  preferredCriteria: string[];
  createdAt: string;
};

export type HiringEvidence = {
  criterion: string;
  status: 'confirmed' | 'not_confirmed';
  evidence: string;
};

export type HiringApplication = {
  id: string;
  vacancyId: string;
  candidateName: string;
  email: string;
  questions: string[];
  answers: string[];
  decision: 'advance' | 'reject';
  explanation: string;
  evidence: HiringEvidence[];
  submittedAt: string;
  durationSeconds: number;
};

type SqlValue = string | number | Uint8Array | null;

function rowString(row: SqlValue[], index: number): string {
  const value = row[index];
  if (typeof value !== 'string') throw new Error(`Unexpected value in SQLite text column ${index}.`);
  return value;
}

function rowStringArray(row: SqlValue[], index: number): string[] {
  const value: unknown = JSON.parse(rowString(row, index));
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`Invalid JSON string array in SQLite column ${index}.`);
  }
  return value;
}

function rowEvidenceArray(row: SqlValue[], index: number): HiringEvidence[] {
  const value: unknown = JSON.parse(rowString(row, index));
  if (!Array.isArray(value) || !value.every((item) => (
    item && typeof item.criterion === 'string'
    && (item.status === 'confirmed' || item.status === 'not_confirmed')
    && typeof item.evidence === 'string'
  ))) {
    throw new Error(`Invalid evidence list in SQLite column ${index}.`);
  }
  return value;
}

function rowDecision(row: SqlValue[], index: number): HiringApplication['decision'] {
  const value = rowString(row, index);
  if (value !== 'advance' && value !== 'reject') throw new Error('Invalid hiring decision in SQLite.');
  return value;
}

function rowNumber(row: SqlValue[], index: number): number {
  const value = row[index];
  if (typeof value !== 'number') throw new Error(`Unexpected value in SQLite numeric column ${index}.`);
  return value;
}

export class HiringDatabase {
  private constructor(
    private readonly database: SqlDatabase,
    readonly filePath: string,
  ) {}

  static async open(filePath: string): Promise<HiringDatabase> {
    const resolvedPath = path.resolve(filePath);
    mkdirSync(path.dirname(resolvedPath), { recursive: true });
    const SQL = await initSqlJs({
      locateFile: (filename) => path.join(path.dirname(require.resolve('sql.js')), filename),
    });
    const database = new SQL.Database(existsSync(resolvedPath) ? readFileSync(resolvedPath) : undefined);
    database.run('PRAGMA foreign_keys = ON');
    database.run(`
      CREATE TABLE IF NOT EXISTS vacancies (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company_name TEXT NOT NULL,
        description TEXT NOT NULL,
        required_criteria_json TEXT NOT NULL,
        preferred_criteria_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        vacancy_id TEXT NOT NULL REFERENCES vacancies(id),
        candidate_name TEXT NOT NULL,
        email TEXT NOT NULL,
        questions_json TEXT NOT NULL,
        answers_json TEXT NOT NULL,
        decision TEXT NOT NULL CHECK (decision IN ('advance', 'reject')),
        explanation TEXT NOT NULL,
        evidence_json TEXT NOT NULL,
        submitted_at TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS applications_vacancy_submitted
        ON applications(vacancy_id, submitted_at DESC);
    `);
    const store = new HiringDatabase(database, resolvedPath);
    store.persist();
    return store;
  }

  seedVacancy(vacancy: HiringVacancy): void {
    if (this.query('SELECT id FROM vacancies WHERE id = ?', [vacancy.id]).length) return;
    this.insertVacancy(vacancy);
  }

  listVacancies(): HiringVacancy[] {
    return this.query(`
      SELECT id, title, company_name, description, required_criteria_json,
        preferred_criteria_json, created_at
      FROM vacancies ORDER BY created_at DESC
    `).map((row) => this.mapVacancy(row));
  }

  getVacancy(id: string): HiringVacancy | undefined {
    const row = this.query(`
      SELECT id, title, company_name, description, required_criteria_json,
        preferred_criteria_json, created_at
      FROM vacancies WHERE id = ?
    `, [id])[0];
    return row ? this.mapVacancy(row) : undefined;
  }

  insertVacancy(vacancy: HiringVacancy): void {
    this.database.run(`
      INSERT INTO vacancies (
        id, title, company_name, description, required_criteria_json,
        preferred_criteria_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      vacancy.id,
      vacancy.title,
      vacancy.companyName,
      vacancy.description,
      JSON.stringify(vacancy.requiredCriteria),
      JSON.stringify(vacancy.preferredCriteria),
      vacancy.createdAt,
    ]);
    this.persist();
  }

  listApplications(vacancyId: string): HiringApplication[] {
    return this.query(`
      SELECT id, vacancy_id, candidate_name, email, questions_json, answers_json,
        decision, explanation, evidence_json, submitted_at, duration_seconds
      FROM applications WHERE vacancy_id = ? ORDER BY submitted_at DESC
    `, [vacancyId]).map((row) => this.mapApplication(row));
  }

  insertApplication(application: HiringApplication): void {
    this.database.run(`
      INSERT INTO applications (
        id, vacancy_id, candidate_name, email, questions_json, answers_json,
        decision, explanation, evidence_json, submitted_at, duration_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      application.id,
      application.vacancyId,
      application.candidateName,
      application.email,
      JSON.stringify(application.questions),
      JSON.stringify(application.answers),
      application.decision,
      application.explanation,
      JSON.stringify(application.evidence),
      application.submittedAt,
      application.durationSeconds,
    ]);
    this.persist();
  }

  close(): void {
    this.database.close();
  }

  private query(sql: string, params: (string | number | null)[] = []): SqlValue[][] {
    return this.database.exec(sql, params)[0]?.values ?? [];
  }

  private mapVacancy(row: SqlValue[]): HiringVacancy {
    return {
      id: rowString(row, 0),
      title: rowString(row, 1),
      companyName: rowString(row, 2),
      description: rowString(row, 3),
      requiredCriteria: rowStringArray(row, 4),
      preferredCriteria: rowStringArray(row, 5),
      createdAt: rowString(row, 6),
    };
  }

  private mapApplication(row: SqlValue[]): HiringApplication {
    return {
      id: rowString(row, 0),
      vacancyId: rowString(row, 1),
      candidateName: rowString(row, 2),
      email: rowString(row, 3),
      questions: rowStringArray(row, 4),
      answers: rowStringArray(row, 5),
      decision: rowDecision(row, 6),
      explanation: rowString(row, 7),
      evidence: rowEvidenceArray(row, 8),
      submittedAt: rowString(row, 9),
      durationSeconds: rowNumber(row, 10),
    };
  }

  private persist(): void {
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    try {
      writeFileSync(temporaryPath, this.database.export());
      renameSync(temporaryPath, this.filePath);
    } finally {
      if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
    }
  }
}
