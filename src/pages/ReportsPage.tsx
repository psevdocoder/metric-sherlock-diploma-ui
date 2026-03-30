import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTargetGroups } from '../api/metricSherlockApi';
import { useAuth } from '../auth/useAuth';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/PageState';
import type { TargetGroupSummary, ViolationStats } from '../types/contracts';
import { formatNumber, formatTimestamp, normalizeText, toDate } from '../utils/format';
import { useDebouncedValue } from '../utils/useDebouncedValue';

interface ReportsFilterState {
  service_search: string;
  team_search: string;
}

function countFailedChecks(stats: ViolationStats | undefined): number {
  const checks = [
    stats?.metric_name_too_long ?? 0,
    stats?.label_name_too_long ?? 0,
    stats?.label_value_too_long ?? 0,
    stats?.cardinality ?? 0,
    stats?.histogram_buckets ?? 0,
    Number(stats?.response_weight ?? 0) > 0 ? 1 : 0,
  ];

  return checks.filter((value) => value > 0).length;
}

const initialFilters: ReportsFilterState = {
  service_search: '',
  team_search: '',
};

export function ReportsPage() {
  const auth = useAuth();
  const ownTeamName = auth.user?.team_name ?? '';
  const [scope, setScope] = useState<'mine' | 'all'>('all');
  const [scopeInitialized, setScopeInitialized] = useState(false);
  const [filters, setFilters] = useState<ReportsFilterState>(initialFilters);
  const [reloadKey, setReloadKey] = useState(0);
  const [targetGroups, setTargetGroups] = useState<TargetGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedServiceSearch = useDebouncedValue(filters.service_search, 250);
  const debouncedTeamSearch = useDebouncedValue(filters.team_search, 350);

  useEffect(() => {
    if (auth.status !== 'authenticated' || scopeInitialized) {
      return;
    }

    setScope(ownTeamName ? 'mine' : 'all');
    setScopeInitialized(true);
  }, [auth.status, ownTeamName, scopeInitialized]);

  useEffect(() => {
    if (!scopeInitialized) {
      return;
    }

    const abortController = new AbortController();
    let disposed = false;
    const teamFilter = scope === 'mine' ? ownTeamName : debouncedTeamSearch.trim();

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await auth.refreshToken();
        const response = await listTargetGroups(
          token,
          {
            team_name: teamFilter,
          },
          abortController.signal,
        );

        if (disposed) {
          return;
        }

        const items = [...(response.target_groups ?? [])];
        items.sort((left, right) => {
          const leftDate = toDate(left.last_check)?.getTime() ?? 0;
          const rightDate = toDate(right.last_check)?.getTime() ?? 0;
          return rightDate - leftDate;
        });

        setTargetGroups(items);
      } catch (loadError) {
        if (disposed || abortController.signal.aborted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить список групп объектов');
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    })();

    return () => {
      disposed = true;
      abortController.abort();
    };
  }, [debouncedTeamSearch, ownTeamName, reloadKey, scope, scopeInitialized]);

  const normalizedServiceSearch = normalizeText(debouncedServiceSearch);
  const normalizedTeamSearch = normalizeText(debouncedTeamSearch);

  const filteredTargetGroups = targetGroups.filter((targetGroup) => {
    const serviceHaystack = [targetGroup.name, targetGroup.job].map(normalizeText).join(' ');
    const teamValue = normalizeText(targetGroup.team_name);

    if (normalizedServiceSearch && !serviceHaystack.includes(normalizedServiceSearch)) {
      return false;
    }

    if (scope === 'mine') {
      return true;
    }

    if (normalizedTeamSearch && !teamValue.includes(normalizedTeamSearch)) {
      return false;
    }

    return true;
  });

  const groupsWithViolations = filteredTargetGroups.filter((item) => countFailedChecks(item.violation_stats) > 0).length;
  const healthyGroups = filteredTargetGroups.length - groupsWithViolations;
  const totalFailedChecks = filteredTargetGroups.reduce(
    (sum, item) => sum + countFailedChecks(item.violation_stats),
    0,
  );
  const totalViolations = filteredTargetGroups.reduce((sum, item) => sum + (item.violation_stats?.total ?? 0), 0);

  return (
    <section className="page-stack">
      <section className="panel panel-compact">
        <div className="filter-toolbar">
          <div className="filter-toolbar-head">
            {ownTeamName ? (
              <div className="segmented-control" aria-label="Область просмотра сервисов" role="tablist">
                <button
                  className={`segmented-button${scope === 'mine' ? ' is-active' : ''}`}
                  onClick={() => setScope('mine')}
                  role="tab"
                  type="button"
                >
                  Мои сервисы
                </button>
                <button
                  className={`segmented-button${scope === 'all' ? ' is-active' : ''}`}
                  onClick={() => setScope('all')}
                  role="tab"
                  type="button"
                >
                  Все сервисы
                </button>
              </div>
            ) : (
              <div />
            )}

            <button
              aria-label="Обновить список отчетов"
              className="icon-button"
              disabled={loading}
              onClick={() => setReloadKey((value) => value + 1)}
              title="Обновить"
              type="button"
            >
              <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
                <path
                  d="M13 8a5 5 0 1 1-1.28-3.35"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
                <path
                  d="M10.75 2.75H13v2.25"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          </div>

          <div className="search-grid">
            <label className="field">
              <span>Поиск по сервису</span>
              <input
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    service_search: event.target.value,
                  }))
                }
                placeholder="service / job"
                type="text"
                value={filters.service_search}
              />
            </label>

            <label className="field">
              <span>Поиск по команде</span>
              <input
                disabled={scope === 'mine'}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    team_search: event.target.value,
                  }))
                }
                placeholder={scope === 'mine' ? ownTeamName || 'team_name из токена' : 'team_name'}
                type="text"
                value={scope === 'mine' ? ownTeamName : filters.team_search}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="stats-grid stats-grid-compact">
        <article className="stat-card">
          <span>Всего сервисов</span>
          <strong>{formatNumber(filteredTargetGroups.length)}</strong>
        </article>
        <article className="stat-card">
          <span>Без нарушений</span>
          <strong className="metric-good">{formatNumber(healthyGroups)}</strong>
        </article>
        <article className="stat-card">
          <span>С нарушениями</span>
          <strong className="metric-bad">{formatNumber(groupsWithViolations)}</strong>
        </article>
        <article className="stat-card">
          <span>Непройденных проверок</span>
          <strong>{formatNumber(totalFailedChecks)}</strong>
        </article>
        <article className="stat-card">
          <span>Всего нарушений</span>
          <strong>{formatNumber(totalViolations)}</strong>
        </article>
      </section>

      {loading ? <LoadingBlock title="Загрузка сервисов" description="Обновляем список групп объектов." /> : null}
      {!loading && error ? (
        <ErrorBlock message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : null}
      {!loading && !error && filteredTargetGroups.length === 0 ? (
        <EmptyBlock
          description="Попробуйте очистить строку поиска или переключить режим отображения сервисов."
          title="Сервисы не найдены"
        />
      ) : null}

      {!loading && !error && filteredTargetGroups.length > 0 ? (
        <section className="services-stack">
          {filteredTargetGroups.map((targetGroup) => {
            const failedChecks = countFailedChecks(targetGroup.violation_stats);
            const hasViolations = failedChecks > 0;
            const totalViolationsForService = targetGroup.violation_stats?.total ?? 0;
            const id = String(targetGroup.id ?? '');

            return (
              <Link
                className={`service-row${hasViolations ? ' is-alert' : ' is-healthy'}`}
                key={id || `${targetGroup.name}-${targetGroup.env}-${targetGroup.cluster}`}
                to={`/reports/${id}`}
              >
                <div className="service-row-main">
                  <div className="service-row-heading">
                    <h3>{targetGroup.name || '—'}</h3>
                    <span className={`status-badge${hasViolations ? ' is-alert' : ' is-ok'}`}>
                      {hasViolations ? 'Есть нарушения' : 'Проверки пройдены'}
                    </span>
                  </div>

                  <p className="service-row-meta">
                    {[targetGroup.job, targetGroup.team_name, targetGroup.env, targetGroup.cluster]
                      .filter(Boolean)
                      .join(' · ') || 'Метаданные отсутствуют'}
                  </p>
                </div>

                <div className="service-row-metrics">
                  <div className="metric-box">
                    <span>Проверки не пройдены</span>
                    <strong className={hasViolations ? 'metric-bad' : 'metric-good'}>
                      {formatNumber(failedChecks)}
                    </strong>
                  </div>

                  <div className="metric-box">
                    <span>Всего нарушений</span>
                    <strong>{formatNumber(totalViolationsForService)}</strong>
                  </div>

                  <div className="metric-box">
                    <span>Последняя проверка</span>
                    <strong>{formatTimestamp(targetGroup.last_check)}</strong>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      ) : null}
    </section>
  );
}
