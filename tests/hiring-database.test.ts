import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { HiringDatabase, type HiringApplication, type HiringVacancy } from '../hiring-database.ts';

test('persists hiring vacancies and applications across database reopen', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'cvision-sqlite-'));
  const databasePath = path.join(directory, 'test.sqlite');
  const vacancy: HiringVacancy = {
    id: 'vacancy-1',
    title: 'Инженер БПЛА',
    companyName: 'Demo',
    description: 'Работа с ROS2',
    requiredCriteria: ['Знание ROS2'],
    preferredCriteria: [],
    createdAt: '2026-11-07T10:00:00.000Z',
  };
  const application: HiringApplication = {
    id: 'application-1',
    vacancyId: vacancy.id,
    candidateName: 'Тестовый кандидат',
    email: 'candidate@example.test',
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
    firstOpen.close();

    const secondOpen = await HiringDatabase.open(databasePath);
    assert.deepEqual(secondOpen.getVacancy(vacancy.id), vacancy);
    assert.deepEqual(secondOpen.listApplications(vacancy.id), [application]);
    secondOpen.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
