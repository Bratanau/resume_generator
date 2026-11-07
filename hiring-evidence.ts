type EvidenceToken = {
  value: string;
  start: number;
  end: number;
};

function getEvidenceTokens(text: string): EvidenceToken[] {
  const tokens: EvidenceToken[] = [];
  const pattern = /[\p{L}\p{N}]+/gu;
  for (const match of text.matchAll(pattern)) {
    const value = match[0].toLocaleLowerCase().replace(/ё/g, 'е');
    tokens.push({ value, start: match.index, end: match.index + match[0].length });
  }
  return tokens;
}

export function findVerifiedEvidence(source: string, citation: string): string | null {
  const sourceTokens = getEvidenceTokens(source);
  const citationTokens = getEvidenceTokens(citation);
  if (!sourceTokens.length || !citationTokens.length) return null;

  let bestMatch: { start: number; end: number; length: number } | null = null;
  for (let citationIndex = 0; citationIndex < citationTokens.length; citationIndex += 1) {
    for (let sourceIndex = 0; sourceIndex < sourceTokens.length; sourceIndex += 1) {
      let length = 0;
      while (
        citationIndex + length < citationTokens.length
        && sourceIndex + length < sourceTokens.length
        && citationTokens[citationIndex + length].value === sourceTokens[sourceIndex + length].value
      ) {
        length += 1;
      }

      const matchedValues = citationTokens
        .slice(citationIndex, citationIndex + length)
        .map((token) => token.value);
      const hasNumericAnchor = matchedValues.some((value) => /^\d+$/.test(value));
      const minimumLength = hasNumericAnchor ? 2 : 3;
      const hasExactLongToken = length === 1 && matchedValues[0].length >= 4
        && /\d/.test(matchedValues[0]);
      if (length < minimumLength && !hasExactLongToken) continue;

      const citationNumbers = citationTokens
        .map((token) => token.value)
        .filter((value) => /^\d+$/.test(value));
      if (citationNumbers.some((number) => !sourceTokens.some((token) => token.value === number))) continue;

      if (!bestMatch || length > bestMatch.length) {
        bestMatch = {
          start: sourceTokens[sourceIndex].start,
          end: sourceTokens[sourceIndex + length - 1].end,
          length,
        };
      }
    }
  }

  return bestMatch ? source.slice(bestMatch.start, bestMatch.end) : null;
}

export function buildClarificationQuestion(criterion: string): string {
  return `Расскажите, пожалуйста, какой у вас опыт по требованию «${criterion}»? Приведите короткий пример из своей практики.`;
}

export function findMinimumExperienceEvidence(
  criterion: string,
  answers: { question: string; answer: string }[],
): string | null {
  const minimumMatch = criterion.match(/(\d+(?:[.,]\d+)?)\s*\+?\s*(лет|год(?:а|ов)?|years?)/iu);
  if (!minimumMatch || !/(?:опыт|стаж|experience)/iu.test(criterion)) return null;
  const minimumYears = Number(minimumMatch[1].replace(',', '.'));
  const genericTerms = new Set([
    'опыт', 'опыта', 'опытом', 'стаж', 'стажа', 'работа', 'работы', 'работе',
    'от', 'не', 'менее', 'минимум', 'год', 'года', 'лет', 'years', 'year', 'experience',
  ]);
  const topicTerms = getEvidenceTokens(criterion)
    .map((token) => token.value)
    .filter((token) => !/^\d+$/.test(token) && !genericTerms.has(token));

  for (const pair of answers) {
    if (!/(?:опыт|стаж|лет|года|год|years?|experience)/iu.test(pair.question)) continue;
    const pairTokens = new Set(getEvidenceTokens(`${pair.question} ${pair.answer}`).map((token) => token.value));
    if (topicTerms.some((term) => !pairTokens.has(term))) continue;
    const answerMatch = pair.answer.match(/(\d+(?:[.,]\d+)?)\s*(лет|год(?:а|ов|у)?|years?)/iu);
    if (!answerMatch || Number(answerMatch[1].replace(',', '.')) < minimumYears) continue;
    return answerMatch[0];
  }
  return null;
}
