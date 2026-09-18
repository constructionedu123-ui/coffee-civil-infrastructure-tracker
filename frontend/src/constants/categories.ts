import { ProjectCategory, ProjectStatus } from '../types/project';

export interface CategoryMeta {
  label: string;
  color: string; // Hex for Leaflet markers
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  iconName: 'truck' | 'zap' | 'droplet' | 'home' | 'landmark' | 'building';
}

export const CATEGORY_CONFIG: Record<ProjectCategory, CategoryMeta> = {
  Transport: {
    label: 'Transport',
    color: '#3B82F6', // Slate Blue
    bgClass: 'bg-blue-500/10 hover:bg-blue-500/15',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
    badgeClass: 'bg-blue-950/40 text-blue-300 border-blue-800/50',
    iconName: 'truck',
  },
  Energy: {
    label: 'Energy',
    color: '#D97706', // Warm Muted Amber
    bgClass: 'bg-amber-500/10 hover:bg-amber-500/15',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    badgeClass: 'bg-amber-950/40 text-amber-300 border-amber-800/50',
    iconName: 'zap',
  },
  Water: {
    label: 'Water & Sanitation',
    color: '#0D9488', // Teal
    bgClass: 'bg-teal-500/10 hover:bg-teal-500/15',
    textClass: 'text-teal-400',
    borderClass: 'border-teal-500/30',
    badgeClass: 'bg-teal-950/40 text-teal-300 border-teal-800/50',
    iconName: 'droplet',
  },
  Housing: {
    label: 'Housing',
    color: '#64748B', // Neutral Slate
    bgClass: 'bg-slate-500/10 hover:bg-slate-500/15',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/30',
    badgeClass: 'bg-slate-900 text-slate-300 border-slate-700',
    iconName: 'home',
  },
  IKN: {
    label: 'IKN Nusantara',
    color: '#64748B', // Neutral Slate / Specific zone
    bgClass: 'bg-slate-500/10 hover:bg-slate-500/15',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/30',
    badgeClass: 'bg-slate-900 text-slate-300 border-slate-700',
    iconName: 'landmark',
  },
  'Commercial & Private': {
    label: 'Commercial & Private',
    color: '#8B5CF6', // Royal Violet
    bgClass: 'bg-purple-500/10 hover:bg-purple-500/15',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
    badgeClass: 'bg-purple-950/40 text-purple-300 border-purple-800/50',
    iconName: 'building',
  },
};

export const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  Completed: {
    label: 'Completed',
    badgeClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
    dotClass: 'bg-emerald-400',
  },
  Operational: {
    label: 'Operational',
    badgeClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
    dotClass: 'bg-emerald-400',
  },
  Construction: {
    label: 'Under Construction',
    badgeClass: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
    dotClass: 'bg-amber-400',
  },
  Planning: {
    label: 'Planning & Prep',
    badgeClass: 'bg-blue-950/40 text-blue-300 border-blue-800/40',
    dotClass: 'bg-blue-400',
  },
  Unknown: {
    label: 'In Review',
    badgeClass: 'bg-neutral-900 text-neutral-400 border-neutral-800',
    dotClass: 'bg-neutral-500',
  },
};
