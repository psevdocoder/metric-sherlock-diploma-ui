import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="state-page">
      <div className="state-card">
        <p className="page-eyebrow">404</p>
        <h1>Страница не найдена</h1>
        <p>Маршрут отсутствует. Вернитесь к списку отчетов.</p>
        <Link className="button" to="/reports">
          К отчетам
        </Link>
      </div>
    </section>
  );
}
