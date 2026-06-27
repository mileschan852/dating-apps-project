import React from 'react';

export function ProfileGrid({ matchingUsers, nonMatchingUsers, unlockedSlots, onPromptUnlock, ...props }) {
  const allUsers = [...matchingUsers, ...nonMatchingUsers];
  const unlocked = allUsers.slice(0, unlockedSlots);
  const locked = allUsers.slice(unlockedSlots);

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {/* Unlocked users */}
      {unlocked.map((user, idx) => <div key={user.id}>Tile</div>)}

      {/* Dividing Bar */}
      {unlockedSlots < 100 && (
        <div className="col-span-full" onClick={onPromptUnlock}>
          Tap to unlock more rows
        </div>
      )}

      {/* Locked users */}
      {locked.map((user) => <div key={user.id} className="opacity-30">Tile</div>)}
    </div>
  );
}
