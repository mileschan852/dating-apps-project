import React from 'react';
import { buildGridList } from '@dating/core';

// Example updated usage in app-base

function App() {
  // ...
  const { matching, nonMatching } = buildGridList({
    ownProfile,
    allUsers: users,
    filters,
    appConfig,
    isRecentlyActive,
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
