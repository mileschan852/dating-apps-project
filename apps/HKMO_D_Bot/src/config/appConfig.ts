// apps/HKMO_D_Bot/src/config/appConfig.ts

import React from 'react';

export const appConfig = {
  // === TopBar ===
  logo: (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-400 text-xs font-bold text-white">
      HK
    </div>
  ),
  appName: "HKMOD",

  // === Extra Cycling Tips ===
  extraTips: [
    "Join @HKMembersOnlyChat +1 row",
    "Boost to unlock more rows temporarily",
    "Purchase extra rows with Stars",
  ],

  // === Preference Filters (App Specific) ===
  preferenceFilters: {
    role: {
      type: 'role',
      inputType: 'slider',
      label: 'Role',
      unlocked: false,
      allowAll: { label: 'Any' },
      colour: '#FF6B6B',
      default: 0.5,
      options: [
        { value: 'side', label: 'Side', colour: '#A78BFA' },
      ],
    },

    safety: {
      type: 'tags',
      inputType: 'tag',
      label: 'Safety',
      unlocked: false,
      allowAll: { label: 'Any' },
      colour: '#4ECDC4',
      default: 'raw',
      options: [
        { value: 'raw', label: 'Raw', colour: '#FF6B6B' },
        { value: 'safe', label: 'Safe', colour: '#4ECDC4' },
      ],
    },

    drug: {
      type: 'tags',
      inputType: 'tag',
      label: 'Drug',
      unlocked: false,
      allowAll: { label: 'Party' },           // "All" renamed to "Party"
      colour: '#FFD93D',
      default: 'party',
      options: [
        { value: 'clean', label: 'Clean', unlocked: false, colour: '#6BCB77' },
        { value: 'party', label: 'Party', unlocked: true, colour: '#FFD93D' },
        { value: 'party_check', label: 'Party✓', unlocked: true, colour: '#FF9F43' },
      ],
      groupBehavior: 'party_group',           // Party covers Party + Party✓ only
    },

    meetup: {
      type: 'tags',
      inputType: 'tag',
      label: 'Meetup',
      unlocked: false,
      allowAll: { label: 'Any' },
      colour: '#FF9F43',
      default: '1on1',
      options: [
        { value: '1on1', label: '1on1', colour: '#FF9F43' },
        { value: 'group', label: 'Group', colour: '#FF6B6B' },
      ],
      groupBehavior: 'meetup_asymmetric',     // Group must match 1on1, but not vice versa
    },

    where: {
      type: 'tags',
      inputType: 'tag',
      label: 'Where',
      unlocked: true,                         // Only this one stays unlocked
      allowAll: { label: 'Anywhere' },
      colour: '#A78BFA',
      default: 'any',
      options: [
        { value: 'travel', label: 'Travel', colour: '#A78BFA' },
        { value: 'host', label: 'Host', colour: '#A78BFA' },
        { value: 'outdoor', label: 'Outdoor', colour: '#A78BFA' },
        { value: 'sauna', label: 'Sauna', colour: '#A78BFA' },
      ],
    },
  },
};