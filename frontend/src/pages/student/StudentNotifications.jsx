import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export default function StudentNotifications() {
  const { user } = useAuth();
  const {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    deleteAllNotifications,
    tick,
  } = useData();
  void tick;

  const notifications = getNotifications().filter((n) => n.userId === user.id);
  const hasUnread = notifications.some((n) => !n.read);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this notification?')) {
      deleteNotification(id);
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('Delete all notifications? This cannot be undone.')) {
      deleteAllNotifications(user.id);
    }
  };

  return (
    <div className="page">
      <div className="page-intro">
        <h2 className="page-title">Notifications</h2>
        <p className="page-subtitle">
          Messages from your institution and administration about applications and funds.
        </p>
        {notifications.length > 0 && (
          <div className="notification-toolbar">
            {hasUnread && (
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => markAllNotificationsRead(user.id)}
              >
                Mark all as read
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={handleDeleteAll}
            >
              Delete all
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card empty-state">
          <p className="empty-text">No notifications yet.</p>
        </div>
      ) : (
        <ul className="notification-list card">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`notification-item ${n.read ? '' : 'notification-item--unread'}`}
              onClick={() => !n.read && markNotificationRead(n.id)}
              onKeyDown={(e) => e.key === 'Enter' && !n.read && markNotificationRead(n.id)}
              role="button"
              tabIndex={0}
            >
              <div className="notification-item__header">
                <strong>{n.title}</strong>
                <time>{new Date(n.createdAt).toLocaleString()}</time>
              </div>
              <p>{n.message}</p>
              <div className="notification-item__actions">
                {!n.read && <span className="notification-item__badge">New</span>}
                <button
                  type="button"
                  className="btn btn-sm btn-danger notification-item__delete"
                  onClick={(e) => handleDelete(e, n.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
