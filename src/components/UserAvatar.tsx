import React from 'react';
import { ShieldCheck, UserCheck, Users, Crown, HardHat, Sparkles, User } from 'lucide-react';
import { VaiTroNguoiDung } from '../types';

export interface AvatarPreset {
  id: string;
  name: string;
  color: string;
  badgeBg: string;
  icon: React.ReactNode;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'preset-admin',
    name: 'Quản trị viên (Admin)',
    color: 'from-amber-500 to-orange-600 text-white',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: <Crown className="w-full h-full" />,
  },
  {
    id: 'preset-captain',
    name: 'Chỉ huy Đội trưởng',
    color: 'from-blue-600 to-indigo-700 text-white',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    icon: <UserCheck className="w-full h-full" />,
  },
  {
    id: 'preset-worker-kien',
    name: 'Tổ trưởng Bắt gà (Kiên)',
    color: 'from-emerald-500 to-teal-700 text-white',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icon: <HardHat className="w-full h-full" />,
  },
  {
    id: 'preset-worker-sang',
    name: 'Thợ Bắt Gà Chính (Sáng)',
    color: 'from-orange-500 to-red-600 text-white',
    badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
    icon: <Sparkles className="w-full h-full" />,
  },
  {
    id: 'preset-worker-vu',
    name: 'Thợ Bắt Gà Chính (Vũ)',
    color: 'from-indigo-500 to-purple-600 text-white',
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
    icon: <ShieldCheck className="w-full h-full" />,
  },
  {
    id: 'preset-worker-dat',
    name: 'Nhân viên Phụ (Đạt)',
    color: 'from-amber-400 to-yellow-600 text-stone-900',
    badgeBg: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    icon: <Users className="w-full h-full" />,
  },
  {
    id: 'preset-worker-toi',
    name: 'Nhân viên Phụ (Tỏi)',
    color: 'from-teal-400 to-emerald-600 text-white',
    badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
    icon: <User className="w-full h-full" />,
  },
];

interface UserAvatarProps {
  avatar?: string;
  name: string;
  role?: VaiTroNguoiDung;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name,
  role,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const iconPadding = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3',
  };

  // Check if avatar is custom image URL or Data URL
  if (avatar && (avatar.startsWith('data:image') || avatar.startsWith('http'))) {
    return (
      <div
        className={`relative rounded-full overflow-hidden flex-shrink-0 shadow-2xs border border-stone-200 ${sizeMap[size]} ${className}`}
      >
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Check if avatar matches a preset
  const preset = AVATAR_PRESETS.find(p => p.id === avatar);
  if (preset) {
    return (
      <div
        className={`relative rounded-full bg-gradient-to-br ${preset.color} flex items-center justify-center flex-shrink-0 shadow-2xs border border-white/20 ${sizeMap[size]} ${iconPadding[size]} ${className}`}
        title={name}
      >
        {preset.icon}
      </div>
    );
  }

  // Fallback styling based on role or initial
  let gradient = 'from-orange-500 to-amber-600 text-white';
  if (role === 'ADMIN') {
    gradient = 'from-amber-500 to-orange-600 text-white';
  } else if (role === 'DOI_TRUONG') {
    gradient = 'from-blue-600 to-indigo-700 text-white';
  } else if (role === 'NHAN_VIEN') {
    gradient = 'from-emerald-600 to-teal-700 text-white';
  }

  const initial = name ? name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${gradient} font-black flex items-center justify-center flex-shrink-0 shadow-2xs border border-white/30 select-none ${sizeMap[size]} ${className}`}
      title={name}
    >
      <span>{initial}</span>
    </div>
  );
};
