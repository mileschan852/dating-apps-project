import React from 'react';

// Updated ProfileGrid with dividing bar logic

export function ProfileGrid({
  matchingUsers,
  nonMatchingUsers,
  unlockedSlots,
  onPromptUnlock,
  // ... other props
}: any) {
  const allUsers = [...matchingUsers, ...nonMatchingUsers];
  const unlocked = allUsers.slice(0, unlockedSlots);
  const locked = allUsers.slice(unlockedSlots);

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {/* Unlocked users */}
      {unlocked.map((user, idx) => (
        <div key={user.id}> {/* render tile */} </div>
      ))}

      {/* Dividing Bar */}
      {unlockedSlots < 100 && (
        <div className="col-span-full" onClick={onPromptUnlock}>
          Tap to unlock more rows
        </div>
      )}

      {/* Locked users (greyed) */}
      {locked.map((user) => (
        <div key={user.id} className="opacity-30"> {/* render tile */} </div>
      ))}
    </div>
  );
}
