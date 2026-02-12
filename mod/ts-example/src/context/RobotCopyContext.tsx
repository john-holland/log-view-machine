import React, { createContext, useContext, useMemo } from 'react';
import { createFishBurgerRobotCopy, type FishBurgerRobotCopy } from '../fish-burger-robotcopy';

const RobotCopyContext = createContext<FishBurgerRobotCopy | null>(null);

export function RobotCopyProvider({ children }: { children: React.ReactNode }) {
  const robotCopy = useMemo(() => createFishBurgerRobotCopy(), []);
  return (
    <RobotCopyContext.Provider value={robotCopy}>
      {children}
    </RobotCopyContext.Provider>
  );
}

export function useRobotCopy(): FishBurgerRobotCopy {
  const ctx = useContext(RobotCopyContext);
  if (!ctx) throw new Error('useRobotCopy must be used within RobotCopyProvider');
  return ctx;
}
