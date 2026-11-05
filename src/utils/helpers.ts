import confetti from 'canvas-confetti';
import { CandidateResume } from '../types';

export function triggerConfetti() {
  try {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
    });
  } catch (e) {
    // ignore if canvas-confetti fails in test env
  }
}

export function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function exportToJsonResume(candidate: CandidateResume): string {
  const jsonResume = {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: candidate.fullName,
      label: candidate.title,
      image: candidate.avatarUrl,
      email: candidate.email,
      summary: candidate.pitch,
      location: {
        city: candidate.location,
      },
      profiles: [
        { network: 'Telegram', url: candidate.telegram },
        { network: 'GitHub', url: candidate.github },
        { network: 'LinkedIn', url: candidate.linkedin },
      ],
    },
    work: candidate.experience.map((exp) => ({
      name: exp.company,
      position: exp.role,
      startDate: exp.period.split('—')[0]?.trim() || '',
      endDate: exp.isCurrent ? 'Present' : exp.period.split('—')[1]?.trim() || '',
      summary: exp.summary,
      highlights: exp.starBullets,
      metrics: exp.metrics,
      keywords: exp.techStack,
    })),
    projects: candidate.petProjects.map((p) => ({
      name: p.title,
      description: p.description,
      highlights: [p.metrics || '', p.highlightedArchitecture || ''],
      keywords: p.techStack,
      url: p.liveDemoUrl,
    })),
    skills: candidate.skills.map((s) => ({
      name: s.category,
      keywords: s.skills.map((sk) => sk.name),
    })),
    education: candidate.education.map((edu) => ({
      institution: edu.institution,
      area: edu.degree,
      studyType: 'Higher Education',
      startDate: edu.period.split('—')[0]?.trim() || '',
      endDate: edu.period.split('—')[1]?.trim() || '',
    })),
    meta: {
      canonical: `https://cvision.app/cv/${candidate.slug}`,
      version: 'v1.0.0',
      lastModified: new Date().toISOString(),
    },
  };

  return JSON.stringify(jsonResume, null, 2);
}

export function exportToMarkdown(candidate: CandidateResume): string {
  let md = `# ${candidate.fullName}\n`;
  md += `**${candidate.title}** | ${candidate.location}\n`;
  md += `Contacts: ${candidate.email} | ${candidate.telegram} | ${candidate.github}\n\n`;
  md += `> ${candidate.pitch}\n\n`;
  
  md += `## 🚀 Опыт работы (STAR-методология)\n\n`;
  for (const exp of candidate.experience) {
    md += `### ${exp.role} @ ${exp.company} (${exp.period})\n`;
    md += `*${exp.summary}*\n\n`;
    for (const b of exp.starBullets) {
      md += `- ${b}\n`;
    }
    md += `\n**Стек**: ${exp.techStack.join(', ')}\n\n`;
  }

  md += `## 💻 Пет-проекты & Open Source\n\n`;
  for (const p of candidate.petProjects) {
    md += `### ${p.title}\n`;
    md += `*${p.tagline}*\n\n`;
    md += `${p.description}\n`;
    if (p.metrics) md += `- Метрика: **${p.metrics}**\n`;
    if (p.highlightedArchitecture) md += `- Архитектура: **${p.highlightedArchitecture}**\n`;
    md += `\n`;
  }

  return md;
}
