import React from 'react';
import { Camera, CameraOff, Circle } from 'lucide-react';

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  activeIcon?: React.ReactNode;
  inactiveIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'xs';
  className?: string;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  isActive,
  onClick,
  activeIcon,
  inactiveIcon,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'text-xs px-2 py-1',
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-3 py-2',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border transition whitespace-nowrap ${sizeClasses[size]} ${ 
        isActive 
          ? 'bg-[#5AC8FA] text-black border-[#5AC8FA]' 
          : 'bg-[#1F1F23] text-white border-[#2C2C2E] hover:bg-[#2C2C2E]' 
      } ${className}`}
    >
      {isActive ? activeIcon : inactiveIcon}
      <span>{label}</span>
    </button>
  );
};

// Pre-configured versions for common filters
export const OnlineFilter = (props: Omit<FilterButtonProps, 'label' | 'activeIcon' | 'inactiveIcon'>) => (
  <FilterButton
    label={props.isActive ? 'Online' : 'Offline'}
    activeIcon={<Circle className="w-3 h-3 fill-green-500 text-green-500" />}
    inactiveIcon={<Circle className="w-3 h-3 fill-gray-500 text-gray-500" />}
    {...props}
  />
);

export const PicFilter = (props: Omit<FilterButtonProps, 'label' | 'activeIcon' | 'inactiveIcon'>) => (
  <FilterButton
    label={props.isActive ? 'Has pic' : 'No pic'}
    activeIcon={<Camera className="w-3.5 h-3.5" />}
    inactiveIcon={<CameraOff className="w-3.5 h-3.5 opacity-60" />}
    {...props}
  />
);
