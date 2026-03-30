import { useEffect, useState } from 'react';
import { getScrapeTasksSchedule, updateScrapeTasksSchedule } from '../api/metricSherlockApi';
import { useAuth } from '../auth/useAuth';
import { ErrorBlock, LoadingBlock } from '../components/PageState';

export function SchedulePage() {
  const auth = useAuth();
  const [cronExpr, setCronExpr] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadSchedule() {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.refreshToken();
      const response = await getScrapeTasksSchedule(token);
      setCronExpr(response.cron_expr ?? '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить расписание');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSchedule();
  }, []);

  return (
    <section className="page-stack">
      {loading ? <LoadingBlock /> : null}
      {!loading && error ? <ErrorBlock message={error} onRetry={() => void loadSchedule()} /> : null}

      {!loading && !error ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>Расписание запуска</h2>
          </div>

          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              setSaving(true);
              setError(null);
              setMessage(null);

              void (async () => {
                try {
                  const token = await auth.refreshToken();
                  await updateScrapeTasksSchedule(token, {
                    cron_expr: cronExpr,
                  });

                  setMessage('Cron-выражение сохранено.');
                } catch (saveError) {
                  setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить расписание');
                } finally {
                  setSaving(false);
                }
              })();
            }}
          >
            <label className="field field-full">
              <span>Cron-выражение</span>
              <input
                onChange={(event) => setCronExpr(event.target.value)}
                placeholder="*/15 * * * *"
                type="text"
                value={cronExpr}
              />
            </label>

            <div className="actions-row">
              <button className="button" disabled={saving} type="submit">
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </form>

          {message ? <p className="inline-message">{message}</p> : null}
        </section>
      ) : null}
    </section>
  );
}
