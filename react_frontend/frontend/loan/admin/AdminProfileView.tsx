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

interface AdminProfileViewProps {
  state: PlatformState;
  user: PlatformUser;
  balanceMasked: boolean;
  initialFocus?: ProfileFocusTarget | null;
  onSectionChange?: (section: 'account' | 'tickets') => void;
  onCompleteBoostTask: (taskId: string) => void;
  onOpenAddChannel: () => void;
  onOpenChangePin: () => void;
  onOpenEditProfile: () => void;
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

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  state,
  user,
  balanceMasked,
  initialFocus,
  onSectionChange,
  onCompleteBoostTask,
  onOpenAddChannel,
  onOpenChangePin,
  onOpenEditProfile,
  onSubmitTicketOrFeedback,
  onReplyTicket,
  onResetDemo,
  onLogout,
}) => {
  return (
    <ProfileView
      state={state}
      user={user}
      balanceMasked={balanceMasked}
      initialFocus={initialFocus}
      onSectionChange={onSectionChange}
      onCompleteBoostTask={onCompleteBoostTask}
      onSetDefaultChannel={() => {}}
      onRemoveChannel={() => {}}
      onOpenAddChannel={onOpenAddChannel}
      onOpenChangePin={onOpenChangePin}
      onOpenEditProfile={onOpenEditProfile}
      onChangeStatementDay={() => {}}
      onSubmitTicketOrFeedback={onSubmitTicketOrFeedback}
      onReplyTicket={onReplyTicket}
      onResetDemo={onResetDemo}
      onLogout={onLogout}
    />
  );
};
