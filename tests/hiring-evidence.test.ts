import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildClarificationQuestion,
  findMinimumExperienceEvidence,
  findVerifiedEvidence,
} from '../hiring-evidence.ts';

test('accepts a source quote when the model adds explanatory wording', () => {
  assert.equal(
    findVerifiedEvidence('В ответе кандидата: 7 лет опыта', 'Кандидат сообщил, что у него 7 лет опыта'),
    '7 лет опыта',
  );
});

test('does not accept a mismatched numeric claim', () => {
  assert.equal(
    findVerifiedEvidence('В ответе кандидата: 7 лет опыта', 'Кандидат сообщил, что у него 5 лет опыта'),
    null,
  );
});

test('validates short technology names and rejects a different version', () => {
  assert.equal(findVerifiedEvidence('Использовал ROS2 в проектах', 'Есть опыт с ROS2'), 'ROS2');
  assert.equal(findVerifiedEvidence('Использовал ROS2 в проектах', 'Есть опыт с ROS1'), null);
});

test('builds a clarification question when the model omits one', () => {
  assert.match(buildClarificationQuestion('знание ROS2'), /знание ROS2/);
});

test('confirms an explicit experience duration above the required minimum', () => {
  assert.equal(
    findMinimumExperienceEvidence('От 5 лет опыта', [{
      question: 'Сколько лет опыта у вас в инженерии БПЛА?',
      answer: '7 лет опыта',
    }]),
    '7 лет',
  );
});

test('does not confirm an insufficient duration or a different stated specialty', () => {
  assert.equal(
    findMinimumExperienceEvidence('От 5 лет опыта', [{
      question: 'Сколько лет опыта у вас?',
      answer: '3 года',
    }]),
    null,
  );
  assert.equal(
    findMinimumExperienceEvidence('От 5 лет опыта в ROS2', [{
      question: 'Сколько лет опыта в инженерии БПЛА?',
      answer: '7 лет',
    }]),
    null,
  );
});
