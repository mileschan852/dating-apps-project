import React, { useState, useEffect } from 'react';
import { buildGridList } from '@dating/core';
import { useGridFilters } from './hooks/useGridFilters';

function App() {
  const [users, setUsers] = useState([]);
  const [ownProfile, setOwnProfile] = useState(null);
  const [unlockedSlots, setUnlockedSlots] = useState(3);

  const { filters, setOnlineOnly, setHasPicOnly, resetFilters, hasActiveFilters } = useGridFilters();

  // ... load users logic ...

  const { matching, nonMatching } = buildGridList({
    ownProfile,
    allUsers: users,
    filters: {
      onlineOnly: filters.onlineOnly,
      hasPic: filters.hasPicOnly,
      ...filters.prefFilters,
    },
    // ... other params
  });

  return (
    <ProfileGrid
      matchingUsers={matching}
      nonMatchingUsers={nonMatching}
      unlockedSlots={unlockedSlots}
      onPromptUnlock={() => {}}
      // other props
    />
  );
}
