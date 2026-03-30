export function ForbiddenPage() {
  return (
    <section className="state-page">
      <div className="state-card state-card-error">
        <p className="page-eyebrow">403</p>
        <h1>Недостаточно прав</h1>
        <p>Для этого раздела нужна роль `admin`. Доступ к просмотру отчетов остается в разделе `Отчеты`.</p>
      </div>
    </section>
  );
}
