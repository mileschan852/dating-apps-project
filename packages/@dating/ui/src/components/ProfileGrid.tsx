import React from 'react';

export const ProfileGrid = ({ users, currentUser, dividingBarIndex, filters, config, onUserClick }: any) => {
  return (
    <div className="grid grid-cols-5 gap-1 p-2">
      {users.map((user: any, index: number) => {
        const isOwn = currentUser && user.id === currentUser.id;
        const isAboveBar = index < dividingBarIndex;
        return (
          <div key={user.id} onClick={() => onUserClick?.(user)} className={`aspect-square rounded-lg overflow-hidden ${!isAboveBar ? 'opacity-40 grayscale' : ''}`}>
            <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
          </div>
        );
      })}
    </div>
  );
};
