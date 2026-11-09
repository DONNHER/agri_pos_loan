import React from 'react';
import {
  PlatformState,
  PlatformUser,
  SupportTicketItem,
} from '../shared/creditData';
import {
  ProfileFocusTarget,
  ProfileView,
} from '../shared/components/ProfileView';

interface ShareholderProfileViewProps {
  state: PlatformState;
  user: PlatformUser;
  balanceMasked: boolean;
  initialFocus?: ProfileFocusTarget | null;
  onSectionChange?: (section: 'account' | 'tickets') => void;
  onCompleteBoostTask: (taskId: string) => void;
  onSetDefaultChannel: (channelId: string) => void;
  onRemoveChannel: (channelId: string) => void;
  onOpenAddChannel: () => void;
  onOpenChangePin: () => void;
  onOpenEditProfile: () => void;
  onRelaunchOnboarding: () => void;
  onChangeStatementDay: (day: 15 | 30) => void;
  onSubmitTicketOrFeedback: (payload: {
    kind: 'TICKET' | 'FEEDBACK';
    category: SupportTicketItem['category'];
    priority: SupportTicketItem['priority'];
    rating?: number;
    subject: string;
    description: string;
    relatedLoanRef?: string;
  }) => void;
  onReplyTicket: (ticketId: string, message: string) => void;
  onResetDemo: () => void;
  onLogout: () => void;
}

export const ShareholderProfileView: React.FC<ShareholderProfileViewProps> = (
  props
) => {
  return <ProfileView {...props} />;
};
