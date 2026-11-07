import assert from 'node:assert/strict';
import test from 'node:test';
import { extractCandidateLinks, extractCandidatePhone } from '../candidate-profile.ts';

test('extracts GitHub and portfolio links as safe web URLs', () => {
  assert.deepEqual(extractCandidateLinks('GitHub: github.com/candidate\nПортфолио: https://portfolio.example/work.'), [
    { label: 'GitHub', url: 'https://github.com/candidate' },
    { label: 'Портфолио', url: 'https://portfolio.example/work' },
  ]);
});

test('ignores unsafe schemes and makes labelled phone contacts clickable', () => {
  assert.deepEqual(extractCandidateLinks('Сайт: javascript:alert(1)\nТелефон: +7 (999) 123-45-67'), [
    { label: 'Телефон', url: 'tel:+79991234567' },
  ]);
  assert.equal(extractCandidatePhone('Контактный телефон: +7 (999) 123-45-67'), '+7 (999) 123-45-67');
});
