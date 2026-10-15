import React from 'react';
import { UserGuideModal } from './UserGuideModal';

/**
 * Backwards compatibility shim: delegates to UserGuideModal
 */
export const T40GuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = (props) => {
  return <UserGuideModal {...props} />;
};
