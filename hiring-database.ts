import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import initSqlJs, { type Database as SqlDatabase } from 'sql.js';
import type { CandidateLink } from './candidate-profile.ts';

const require = createRequire(import.meta.url);

export type HiringVacancy = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string;
  description: string;
  location: string;
  employmentType: string;
  salaryRange: string;
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
  candidateRole: string;
  profileSummary: string;
  resumeText: string;
  profileLinks: CandidateLink[];
  profilePhoto: string;
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

function rowLinkArray(row: SqlValue[], index: number): CandidateLink[] {
  const value: unknown = JSON.parse(rowString(row, index));
  if (!Array.isArray(value) || !value.every((item) => (
    item && typeof item.label === 'string'
    && typeof item.url === 'string'
    && (/^https?:\/\//iu.test(item.url) || /^tel:\+?\d{9,15}$/u.test(item.url))
  ))) {
    throw new Error(`Invalid profile link list in SQLite column ${index}.`);
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
    const applicationColumns = new Set(
      database.exec('PRAGMA table_info(applications)')[0]?.values.map((row) => row[1]) ?? [],
    );
    for (const [column, definition] of [
      ['candidate_role', "TEXT NOT NULL DEFAULT ''"],
      ['profile_summary', "TEXT NOT NULL DEFAULT ''"],
      ['resume_text', "TEXT NOT NULL DEFAULT ''"],
      ['profile_links_json', "TEXT NOT NULL DEFAULT '[]'"],
      ['profile_photo', "TEXT NOT NULL DEFAULT ''"],
    ]) {
      if (!applicationColumns.has(column)) {
        database.run(`ALTER TABLE applications ADD COLUMN ${column} ${definition}`);
      }
    }
    const vacancyColumns = new Set(
      database.exec('PRAGMA table_info(vacancies)')[0]?.values.map((row) => row[1]) ?? [],
    );
    for (const [column, definition] of [
      ['company_website', "TEXT NOT NULL DEFAULT ''"],
      ['location', "TEXT NOT NULL DEFAULT ''"],
      ['employment_type', "TEXT NOT NULL DEFAULT ''"],
      ['salary_range', "TEXT NOT NULL DEFAULT ''"],
    ]) {
      if (!vacancyColumns.has(column)) {
        database.run(`ALTER TABLE vacancies ADD COLUMN ${column} ${definition}`);
      }
    }
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
      SELECT id, title, company_name, company_website, description, location,
        employment_type, salary_range, required_criteria_json,
        preferred_criteria_json, created_at
      FROM vacancies ORDER BY created_at DESC
    `).map((row) => this.mapVacancy(row));
  }

  getVacancy(id: string): HiringVacancy | undefined {
    const row = this.query(`
      SELECT id, title, company_name, company_website, description, location,
        employment_type, salary_range, required_criteria_json,
        preferred_criteria_json, created_at
      FROM vacancies WHERE id = ?
    `, [id])[0];
    return row ? this.mapVacancy(row) : undefined;
  }

  insertVacancy(vacancy: HiringVacancy): void {
    this.database.run(`
      INSERT INTO vacancies (
        id, title, company_name, company_website, description, location,
        employment_type, salary_range, required_criteria_json,
        preferred_criteria_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      vacancy.id,
      vacancy.title,
      vacancy.companyName,
      vacancy.companyWebsite,
      vacancy.description,
      vacancy.location,
      vacancy.employmentType,
      vacancy.salaryRange,
      JSON.stringify(vacancy.requiredCriteria),
      JSON.stringify(vacancy.preferredCriteria),
      vacancy.createdAt,
    ]);
    this.persist();
  }

  updateVacancy(vacancy: HiringVacancy): boolean {
    this.database.run(`
      UPDATE vacancies SET
        title = ?, company_name = ?, company_website = ?, description = ?,
        location = ?, employment_type = ?, salary_range = ?,
        required_criteria_json = ?, preferred_criteria_json = ?
      WHERE id = ?
    `, [
      vacancy.title,
      vacancy.companyName,
      vacancy.companyWebsite,
      vacancy.description,
      vacancy.location,
      vacancy.employmentType,
      vacancy.salaryRange,
      JSON.stringify(vacancy.requiredCriteria),
      JSON.stringify(vacancy.preferredCriteria),
      vacancy.id,
    ]);
    if (!this.database.getRowsModified()) return false;
    this.persist();
    return true;
  }

  listApplications(vacancyId: string): HiringApplication[] {
    return this.query(`
      SELECT id, vacancy_id, candidate_name, email, questions_json, answers_json,
        decision, explanation, evidence_json, submitted_at, duration_seconds,
        candidate_role, profile_summary, resume_text, profile_links_json, profile_photo
      FROM applications WHERE vacancy_id = ? ORDER BY submitted_at DESC
    `, [vacancyId]).map((row) => this.mapApplication(row));
  }

  insertApplication(application: HiringApplication): void {
    this.database.run(`
      INSERT INTO applications (
        id, vacancy_id, candidate_name, email, questions_json, answers_json,
        decision, explanation, evidence_json, submitted_at, duration_seconds,
        candidate_role, profile_summary, resume_text, profile_links_json, profile_photo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      application.candidateRole,
      application.profileSummary,
      application.resumeText,
      JSON.stringify(application.profileLinks),
      application.profilePhoto,
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
      companyWebsite: rowString(row, 3),
      description: rowString(row, 4),
      location: rowString(row, 5),
      employmentType: rowString(row, 6),
      salaryRange: rowString(row, 7),
      requiredCriteria: rowStringArray(row, 8),
      preferredCriteria: rowStringArray(row, 9),
      createdAt: rowString(row, 10),
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
      candidateRole: rowString(row, 11),
      profileSummary: rowString(row, 12),
      resumeText: rowString(row, 13),
      profileLinks: rowLinkArray(row, 14),
      profilePhoto: rowString(row, 15),
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
