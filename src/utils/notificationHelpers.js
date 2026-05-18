export function applicationStatusMessage(app, status) {
  const title = app.scholarshipTitle || 'your scholarship program';
  switch (status) {
    case 'approved':
      return {
        title: 'Application approved',
        message: `Congratulations! Your application for "${title}" has been approved by the administration.`,
      };
    case 'rejected':
      return {
        title: 'Application declined',
        message: `Your application for "${title}" was declined by the administration. Check your applications for details.`,
      };
    case 'pending':
      return {
        title: 'Application with administration',
        message: `Your application for "${title}" has been forwarded to the administration for final review.`,
      };
    default:
      return {
        title: 'Application updated',
        message: `Your application for "${title}" status is now: ${status}.`,
      };
  }
}

export function fundStatusMessage(app, fundStatus) {
  const title = app.scholarshipTitle || 'your scholarship program';
  if (fundStatus === 'sent') {
    return {
      title: 'Scholarship fund sent',
      message: `Funds for "${title}" have been sent to your registered bank account. Please confirm receipt when received.`,
    };
  }
  return null;
}
