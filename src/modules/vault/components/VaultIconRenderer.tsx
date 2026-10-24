import React from 'react';
import {
  FileText,
  BookOpen,
  Folder,
  User,
  Briefcase,
  GraduationCap,
  DollarSign,
  Rocket,
  Lightbulb,
  Target,
  Sparkles,
  Star,
  Heart,
  Flame,
  Compass,
  Zap,
  Shield,
  Clock,
  Bookmark,
  Calendar,
  Layers,
  CheckCircle2,
  ListTodo,
  Terminal,
  Code,
  Tag,
  PenTool,
  Coffee,
  Smile,
  LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  BookOpen,
  Folder,
  User,
  Briefcase,
  GraduationCap,
  DollarSign,
  Rocket,
  Lightbulb,
  Target,
  Sparkles,
  Star,
  Heart,
  Flame,
  Compass,
  Zap,
  Shield,
  Clock,
  Bookmark,
  Calendar,
  Layers,
  CheckCircle2,
  ListTodo,
  Terminal,
  Code,
  Tag,
  PenTool,
  Coffee,
  Smile,
};

// Legacy emoji to Lucide fallback map
const EMOJI_FALLBACK: Record<string, LucideIcon> = {
  '📄': FileText,
  '📝': BookOpen,
  '📁': Folder,
  '👤': User,
  '💼': Briefcase,
  '🎓': GraduationCap,
  '💰': DollarSign,
  '🚀': Rocket,
  '💡': Lightbulb,
  '🎯': Target,
  '✨': Sparkles,
  '⭐': Star,
  '🔥': Flame,
};

interface VaultIconRendererProps {
  icon?: string;
  className?: string;
}

export const VaultIconRenderer: React.FC<VaultIconRendererProps> = ({ icon, className = 'w-4 h-4' }) => {
  if (!icon) {
    return <FileText className={className} />;
  }

  // 1. Check direct name match in ICON_MAP
  if (ICON_MAP[icon]) {
    const Component = ICON_MAP[icon];
    return <Component className={className} />;
  }

  // 2. Check legacy emoji fallback
  if (EMOJI_FALLBACK[icon]) {
    const Component = EMOJI_FALLBACK[icon];
    return <Component className={className} />;
  }

  return <FileText className={className} />;
};
