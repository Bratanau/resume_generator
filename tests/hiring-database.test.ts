import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import initSqlJs from 'sql.js';
import { HiringDatabase, type HiringApplication, type HiringVacancy } from '../hiring-database.ts';

test('persists hiring vacancies and applications across database reopen', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'cvision-sqlite-'));
  const databasePath = path.join(directory, 'test.sqlite');
  const vacancy: HiringVacancy = {
    id: 'vacancy-1',
    title: 'Инженер БПЛА',
    companyName: 'Demo',
    companyWebsite: 'https://example.test',
    description: 'Работа с ROS2',
    location: 'Удалённо',
    employmentType: 'Полная занятость',
    salaryRange: '150 000–220 000 ₽',
    requiredCriteria: ['Знание ROS2'],
    preferredCriteria: [],
    createdAt: '2026-11-07T10:00:00.000Z',
  };
  const application: HiringApplication = {
    id: 'application-1',
    vacancyId: vacancy.id,
    candidateName: 'Тестовый кандидат',
    email: 'candidate@example.test',
    candidateRole: 'Инженер БПЛА',
    profileSummary: 'Опыт разработки ПО и работы с ROS2.',
    resumeText: 'Резюме: инженер БПЛА, GitHub: github.com/candidate.',
    profileLinks: [{ label: 'GitHub', url: 'https://github.com/candidate' }],
    profilePhoto: 'data:image/png;base64,aGVsbG8=',
    questions: ['Сколько лет опыта?'],
    answers: ['7 лет опыта'],
    decision: 'advance',
    explanation: 'Подтверждён минимальный стаж.',
    evidence: [{ criterion: 'Опыт от 5 лет', status: 'confirmed', evidence: '7 лет опыта' }],
    submittedAt: '2026-11-07T10:05:00.000Z',
    durationSeconds: 300,
  };

  try {
    const firstOpen = await HiringDatabase.open(databasePath);
    firstOpen.seedVacancy(vacancy);
    firstOpen.insertApplication(application);
    const updatedVacancy = { ...vacancy, title: 'Старший инженер БПЛА', salaryRange: '200 000–280 000 ₽' };
    assert.equal(firstOpen.updateVacancy(updatedVacancy), true);
    assert.equal(firstOpen.updateVacancy({ ...vacancy, id: 'missing-vacancy' }), false);
    firstOpen.close();

    const secondOpen = await HiringDatabase.open(databasePath);
    assert.deepEqual(secondOpen.getVacancy(vacancy.id), updatedVacancy);
    assert.deepEqual(secondOpen.listApplications(vacancy.id), [application]);
    secondOpen.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('adds candidate profile fields to an existing SQLite database without losing applications', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'cvision-sqlite-migration-'));
  const databasePath = path.join(directory, 'legacy.sqlite');
  try {
    const SQL = await initSqlJs();
    const legacy = new SQL.Database();
    legacy.run(`
      CREATE TABLE vacancies (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, company_name TEXT NOT NULL,
        description TEXT NOT NULL, required_criteria_json TEXT NOT NULL,
        preferred_criteria_json TEXT NOT NULL, created_at TEXT NOT NULL
      );
      CREATE TABLE applications (
        id TEXT PRIMARY KEY, vacancy_id TEXT NOT NULL, candidate_name TEXT NOT NULL,
        email TEXT NOT NULL, questions_json TEXT NOT NULL, answers_json TEXT NOT NULL,
        decision TEXT NOT NULL, explanation TEXT NOT NULL, evidence_json TEXT NOT NULL,
        submitted_at TEXT NOT NULL, duration_seconds INTEGER NOT NULL
      );
      CREATE INDEX applications_vacancy_submitted ON applications(vacancy_id, submitted_at DESC);
      INSERT INTO vacancies VALUES ('old-vacancy', 'Вакансия', 'Компания', 'Описание', '[]', '[]', '2026-01-01');
      INSERT INTO applications VALUES ('old-application', 'old-vacancy', 'Старый кандидат', 'old@example.test', '[]', '[]', 'advance', 'Решение', '[]', '2026-01-02', 60);
    `);
    writeFileSync(databasePath, legacy.export());
    legacy.close();

    const migrated = await HiringDatabase.open(databasePath);
    const applications = migrated.listApplications('old-vacancy');
    assert.equal(applications.length, 1);
    assert.equal(applications[0].candidateName, 'Старый кандидат');
    assert.equal(applications[0].resumeText, '');
    assert.deepEqual(applications[0].profileLinks, []);
    assert.equal(migrated.getVacancy('old-vacancy')?.companyWebsite, '');
    assert.equal(migrated.getVacancy('old-vacancy')?.location, '');
    migrated.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
