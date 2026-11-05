export type AttentionLevel = 'hot' | 'warm' | 'cold' | 'neutral';

export type ReviewTagType = 'fire' | 'warning' | 'tip' | 'delete';

export interface StarMetric {
  label: string;
  value: string;
  changeType?: 'positive' | 'neutral' | 'highlight';
}

export interface WorkExperience {
  id: string;
  company: string;
  companyUrl?: string;
  role: string;
  period: string;
  location: string;
  summary: string;
  starBullets: string[];
  metrics: StarMetric[];
  techStack: string[];
  isCurrent?: boolean;
}

export interface PetProject {
  id: string;
  title: string;
  tagline: string;
  description: string;
  techStack: string[];
  liveDemoUrl?: string;
  githubUrl?: string;
  metrics?: string;
  stars?: number;
  highlightedArchitecture?: string;
}

export interface SkillCategory {
  category: string;
  skills: { name: string; level: number; highlighted?: boolean }[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  period: string;
  details?: string;
}

export interface TargetCampaign {
  id: string;
  slug: string;
  companyName: string;
  roleTitle: string;
  customGreeting?: string;
  prioritizedSection?: 'experience' | 'petProjects' | 'skills';
  accentColor?: string;
  customNotes?: string;
  viewsCount: number;
  lastViewedAt?: string;
  status: 'active' | 'interview_scheduled' | 'reviewing' | 'archived';
}

export interface VoiceComment {
  id: string;
  sectionId: string;
  sectionTitle: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  timestamp: string;
  audioDurationSeconds: number;
  tag: ReviewTagType;
  tagLabel: string;
  transcription: string;
  suggestedRewrite?: string;
  accepted?: boolean;
}

export interface TelemetryEvent {
  t: number; // millisecond offset from session start
  type: 'mouse' | 'scroll' | 'click' | 'hover' | 'dwell';
  x?: number; // percentage 0-100
  y?: number; // percentage 0-100
  scrollY?: number; // pixels
  sectionId?: string;
  dwellMs?: number;
}

export interface RecruiterSession {
  id: string;
  company: string;
  recruiterTitle: string;
  recruiterAvatar?: string;
  device: string;
  location: string;
  startedAt: string;
  durationSeconds: number;
  scrollDepth: number; // 0-100%
  topSectionsDwell: { sectionId: string; title: string; seconds: number }[];
  clickedLinks: string[];
  status: 'watching_now' | 'completed' | 'interview_invited';
  events: TelemetryEvent[];
  insight: string;
}

export interface BragsheetEntry {
  id: string;
  date: string;
  rawInput: string;
  corporateTitle: string;
  situation: string;
  action: string;
  result: string;
  performanceBullet: string;
  category: 'Architecture' | 'Reliability' | 'Cost Optimization' | 'Delivery' | 'Leadership';
  scoreBonus: string;
  tags: string[];
}

export interface CandidateResume {
  id: string;
  slug: string;
  fullName: string;
  title: string;
  avatarUrl: string;
  location: string;
  email: string;
  telegram: string;
  github: string;
  linkedin: string;
  statusBadge: string;
  pitch: string;
  campaigns: TargetCampaign[];
  skills: SkillCategory[];
  experience: WorkExperience[];
  petProjects: PetProject[];
  education: EducationItem[];
  voiceComments: VoiceComment[];
}
