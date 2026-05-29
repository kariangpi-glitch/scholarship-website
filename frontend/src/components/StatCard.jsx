export default function StatCard({ title, value, icon, color = 'blue' }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__content">
        <p className="stat-card__title">{title}</p>
        <h3 className="stat-card__value">{value}</h3>
      </div>
    </div>
  );
}
