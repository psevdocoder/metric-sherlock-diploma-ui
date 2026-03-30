import { type ReactNode, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getTargetGroup,
  listMetricWhitelist,
  listTargetWhitelist,
  upsertMetricWhitelist,
  upsertTargetWhitelist,
} from '../api/metricSherlockApi';
import { useAuth } from '../auth/useAuth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/PageState';
import { PageHeader } from '../components/PageHeader';
import type {
  CardinalityViolation,
  CheckMetric,
  HistogramBucketsViolation,
  LabelNameViolation,
  LabelValueViolation,
  MetricNameViolation,
  TargetGroupDetails,
} from '../types/contracts';
import { formatBytes, formatNumber, formatTimestamp, toNumber } from '../utils/format';

type CheckSectionKey =
  | 'metric_name_length'
  | 'label_name_length'
  | 'label_value_length'
  | 'cardinality'
  | 'histogram_buckets'
  | 'response_weight';

type MetricWhitelistCheckKey = Exclude<CheckSectionKey, 'response_weight'>;

interface CheckSectionDefinition {
  key: CheckSectionKey;
  label: string;
  check: CheckMetric | undefined;
  failed: boolean;
  issue_count: number;
  max_description?: string;
  details: ReactNode;
}

interface MetricWhitelistDraft {
  check_key: MetricWhitelistCheckKey;
  label: string;
  metric_name: string;
  limit: string;
}

interface PendingCheckExclusion {
  key: CheckSectionKey;
  label: string;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MetricNameViolationsTable({
  items,
  canManage = false,
  onAddToWhitelist,
}: {
  items: MetricNameViolation[];
  canManage?: boolean;
  onAddToWhitelist?: (item: MetricNameViolation) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Имя метрики</th>
            <th>Длина</th>
            {canManage ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.metric_name}-${index}`}>
              <td>{item.metric_name || '—'}</td>
              <td>{formatNumber(item.length)}</td>
              {canManage ? (
                <td className="table-actions">
                  <button className="button button-secondary" onClick={() => onAddToWhitelist?.(item)} type="button">
                    В whitelist
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LabelNameViolationsTable({
  items,
  canManage = false,
  onAddToWhitelist,
}: {
  items: LabelNameViolation[];
  canManage?: boolean;
  onAddToWhitelist?: (item: LabelNameViolation) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Имя метрики</th>
            <th>Имя метки</th>
            <th>Длина</th>
            {canManage ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.metric_name}-${item.label_name}-${index}`}>
              <td>{item.metric_name || '—'}</td>
              <td>{item.label_name || '—'}</td>
              <td>{formatNumber(item.length)}</td>
              {canManage ? (
                <td className="table-actions">
                  <button className="button button-secondary" onClick={() => onAddToWhitelist?.(item)} type="button">
                    В whitelist
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LabelValueViolationsTable({
  items,
  canManage = false,
  onAddToWhitelist,
}: {
  items: LabelValueViolation[];
  canManage?: boolean;
  onAddToWhitelist?: (item: LabelValueViolation) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Имя метрики</th>
            <th>Имя метки</th>
            <th>Значение</th>
            <th>Длина</th>
            {canManage ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.metric_name}-${item.label_name}-${index}`}>
              <td>{item.metric_name || '—'}</td>
              <td>{item.label_name || '—'}</td>
              <td>{item.value || '—'}</td>
              <td>{formatNumber(item.length)}</td>
              {canManage ? (
                <td className="table-actions">
                  <button className="button button-secondary" onClick={() => onAddToWhitelist?.(item)} type="button">
                    В whitelist
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardinalityViolationsTable({
  items,
  canManage = false,
  onAddToWhitelist,
}: {
  items: CardinalityViolation[];
  canManage?: boolean;
  onAddToWhitelist?: (item: CardinalityViolation) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Имя метрики</th>
            <th>Кардинальность</th>
            {canManage ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.metric_name}-${index}`}>
              <td>{item.metric_name || '—'}</td>
              <td>{formatNumber(item.value)}</td>
              {canManage ? (
                <td className="table-actions">
                  <button className="button button-secondary" onClick={() => onAddToWhitelist?.(item)} type="button">
                    В whitelist
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistogramViolationsTable({
  items,
  canManage = false,
  onAddToWhitelist,
}: {
  items: HistogramBucketsViolation[];
  canManage?: boolean;
  onAddToWhitelist?: (item: HistogramBucketsViolation) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Имя метрики</th>
            <th>Количество бакетов</th>
            {canManage ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.metric_name}-${index}`}>
              <td>{item.metric_name || '—'}</td>
              <td>{formatNumber(item.buckets)}</td>
              {canManage ? (
                <td className="table-actions">
                  <button className="button button-secondary" onClick={() => onAddToWhitelist?.(item)} type="button">
                    В whitelist
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyCheckDetails({ message }: { message: string }) {
  return <p className="accordion-empty">{message}</p>;
}

export function ReportDetailsPage() {
  const { id } = useParams();
  const auth = useAuth();
  const isAdmin = auth.roles.includes('admin');
  const [reloadKey, setReloadKey] = useState(0);
  const [details, setDetails] = useState<TargetGroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<CheckSectionKey[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [metricWhitelistDraft, setMetricWhitelistDraft] = useState<MetricWhitelistDraft | null>(null);
  const [metricWhitelistSaving, setMetricWhitelistSaving] = useState(false);
  const [metricWhitelistError, setMetricWhitelistError] = useState<string | null>(null);
  const [pendingCheckExclusion, setPendingCheckExclusion] = useState<PendingCheckExclusion | null>(null);
  const [checkExclusionSaving, setCheckExclusionSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Идентификатор группы объектов не передан в URL');
      return;
    }

    const abortController = new AbortController();
    let disposed = false;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await auth.refreshToken();
        const response = await getTargetGroup(token, id, abortController.signal);

        if (!disposed) {
          setDetails(response.target_group ?? null);
        }
      } catch (loadError) {
        if (disposed || abortController.signal.aborted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить детали отчета');
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
  }, [id, reloadKey]);

  const summary = details?.summary;
  const violations = details?.violations;
  const responseWeightLimit = toNumber(violations?.checks?.response_weight?.limit) ?? 0;
  const responseWeightCurrent = toNumber(violations?.checks?.response_weight?.current) ?? 0;

  useEffect(() => {
    if (!metricWhitelistDraft) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !metricWhitelistSaving) {
        closeMetricWhitelistDialog();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [metricWhitelistDraft, metricWhitelistSaving]);

  function closeMetricWhitelistDialog() {
    if (metricWhitelistSaving) {
      return;
    }

    setMetricWhitelistDraft(null);
    setMetricWhitelistError(null);
  }

  function openMetricWhitelistDialog(
    checkKey: MetricWhitelistCheckKey,
    label: string,
    metricName: string | undefined,
    limitValue: number | string | undefined,
  ) {
    if (!metricName) {
      return;
    }

    setMetricWhitelistDraft({
      check_key: checkKey,
      label,
      metric_name: metricName,
      limit: String(limitValue ?? 0),
    });
    setMetricWhitelistError(null);
  }

  async function saveMetricWhitelist() {
    if (!metricWhitelistDraft || !summary?.name || !summary?.env) {
      return;
    }

    setMetricWhitelistSaving(true);
    setMetricWhitelistError(null);
    setActionError(null);
    setActionMessage(null);

    try {
      const token = await auth.refreshToken();
      const response = await listMetricWhitelist(token, {
        target_group: summary.name,
        env: summary.env,
      });
      const existingItem = response.items?.find((item) => item.metric_name === metricWhitelistDraft.metric_name);
      const nextChecks: Record<MetricWhitelistCheckKey, number> = {
        metric_name_length: Number(existingItem?.checks?.metric_name_length ?? 0),
        label_name_length: Number(existingItem?.checks?.label_name_length ?? 0),
        label_value_length: Number(existingItem?.checks?.label_value_length ?? 0),
        cardinality: Number(existingItem?.checks?.cardinality ?? 0),
        histogram_buckets: Number(existingItem?.checks?.histogram_buckets ?? 0),
      };

      nextChecks[metricWhitelistDraft.check_key] = Number(metricWhitelistDraft.limit || 0);

      await upsertMetricWhitelist(token, {
        item: {
          target_group: summary.name,
          env: summary.env,
          metric_name: metricWhitelistDraft.metric_name,
          checks: nextChecks,
        },
      });

      setActionMessage(`Метрика ${metricWhitelistDraft.metric_name} добавлена в whitelist.`);
      setMetricWhitelistDraft(null);
    } catch (saveError) {
      setMetricWhitelistError(
        saveError instanceof Error ? saveError.message : 'Не удалось сохранить исключение для метрики',
      );
    } finally {
      setMetricWhitelistSaving(false);
    }
  }

  async function confirmCheckExclusion() {
    if (!pendingCheckExclusion || !summary?.name || !summary?.env) {
      return;
    }

    setCheckExclusionSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const token = await auth.refreshToken();
      const response = await listTargetWhitelist(token, {
        target_group: summary.name,
        env: summary.env,
      });
      const existingItem = response.items?.find(
        (item) => item.target_group === summary.name && item.env === summary.env,
      );
      const nextChecks: Record<CheckSectionKey, boolean> = {
        metric_name_length: Boolean(existingItem?.checks?.metric_name_length),
        label_name_length: Boolean(existingItem?.checks?.label_name_length),
        label_value_length: Boolean(existingItem?.checks?.label_value_length),
        cardinality: Boolean(existingItem?.checks?.cardinality),
        histogram_buckets: Boolean(existingItem?.checks?.histogram_buckets),
        response_weight: Boolean(existingItem?.checks?.response_weight),
      };

      nextChecks[pendingCheckExclusion.key] = true;

      await upsertTargetWhitelist(token, {
        item: {
          target_group: summary.name,
          env: summary.env,
          checks: nextChecks,
        },
      });

      setActionMessage(`Проверка "${pendingCheckExclusion.label}" добавлена в исключения.`);
      setPendingCheckExclusion(null);
    } catch (saveError) {
      setActionError(
        saveError instanceof Error ? saveError.message : 'Не удалось добавить проверку в исключения',
      );
      setPendingCheckExclusion(null);
    } finally {
      setCheckExclusionSaving(false);
    }
  }

  function formatCheckValue(sectionKey: CheckSectionKey, value: number | string | undefined) {
    return sectionKey === 'response_weight' ? formatBytes(value) : formatNumber(value);
  }

  const checkSections: CheckSectionDefinition[] = [
    {
      key: 'metric_name_length',
      label: 'Длина имени метрики',
      check: violations?.checks?.metric_name_length,
      failed: (violations?.metric_name_too_long?.length ?? 0) > 0,
      issue_count: violations?.metric_name_too_long?.length ?? 0,
      max_description: violations?.max?.metric_name_too_long
        ? `${violations.max.metric_name_too_long.metric_name || '—'} · ${formatNumber(violations.max.metric_name_too_long.length)}`
        : undefined,
      details:
        (violations?.metric_name_too_long?.length ?? 0) > 0 ? (
          <MetricNameViolationsTable
            canManage={isAdmin}
            items={violations?.metric_name_too_long ?? []}
            onAddToWhitelist={(item) =>
              openMetricWhitelistDialog('metric_name_length', 'Длина имени метрики', item.metric_name, item.length)
            }
          />
        ) : (
          <EmptyCheckDetails message="Нарушений по длине имени метрики нет." />
        ),
    },
    {
      key: 'label_name_length',
      label: 'Длина имени метки',
      check: violations?.checks?.label_name_length,
      failed: (violations?.label_name_too_long?.length ?? 0) > 0,
      issue_count: violations?.label_name_too_long?.length ?? 0,
      max_description: violations?.max?.label_name_too_long
        ? `${violations.max.label_name_too_long.label_name || '—'} · ${formatNumber(violations.max.label_name_too_long.length)}`
        : undefined,
      details:
        (violations?.label_name_too_long?.length ?? 0) > 0 ? (
          <LabelNameViolationsTable
            canManage={isAdmin}
            items={violations?.label_name_too_long ?? []}
            onAddToWhitelist={(item) =>
              openMetricWhitelistDialog('label_name_length', 'Длина имени метки', item.metric_name, item.length)
            }
          />
        ) : (
          <EmptyCheckDetails message="Нарушений по длине имени метки нет." />
        ),
    },
    {
      key: 'label_value_length',
      label: 'Длина значения метки',
      check: violations?.checks?.label_value_length,
      failed: (violations?.label_value_too_long?.length ?? 0) > 0,
      issue_count: violations?.label_value_too_long?.length ?? 0,
      max_description: violations?.max?.label_value_too_long
        ? `${violations.max.label_value_too_long.value || '—'} · ${formatNumber(violations.max.label_value_too_long.length)}`
        : undefined,
      details:
        (violations?.label_value_too_long?.length ?? 0) > 0 ? (
          <LabelValueViolationsTable
            canManage={isAdmin}
            items={violations?.label_value_too_long ?? []}
            onAddToWhitelist={(item) =>
              openMetricWhitelistDialog('label_value_length', 'Длина значения метки', item.metric_name, item.length)
            }
          />
        ) : (
          <EmptyCheckDetails message="Нарушений по длине значений метки нет." />
        ),
    },
    {
      key: 'cardinality',
      label: 'Кардинальность',
      check: violations?.checks?.cardinality,
      failed: (violations?.cardinality?.length ?? 0) > 0,
      issue_count: violations?.cardinality?.length ?? 0,
      max_description: violations?.max?.cardinality
        ? `${violations.max.cardinality.metric_name || '—'} · ${formatNumber(violations.max.cardinality.value)}`
        : undefined,
      details:
        (violations?.cardinality?.length ?? 0) > 0 ? (
          <CardinalityViolationsTable
            canManage={isAdmin}
            items={violations?.cardinality ?? []}
            onAddToWhitelist={(item) =>
              openMetricWhitelistDialog('cardinality', 'Кардинальность', item.metric_name, item.value)
            }
          />
        ) : (
          <EmptyCheckDetails message="Нарушений по cardinality нет." />
        ),
    },
    {
      key: 'histogram_buckets',
      label: 'Количество бакетов в гистограмме',
      check: violations?.checks?.histogram_buckets,
      failed: (violations?.histogram_buckets?.length ?? 0) > 0,
      issue_count: violations?.histogram_buckets?.length ?? 0,
      max_description: violations?.max?.histogram_buckets
        ? `${violations.max.histogram_buckets.metric_name || '—'} · ${formatNumber(violations.max.histogram_buckets.buckets)}`
        : undefined,
      details:
        (violations?.histogram_buckets?.length ?? 0) > 0 ? (
          <HistogramViolationsTable
            canManage={isAdmin}
            items={violations?.histogram_buckets ?? []}
            onAddToWhitelist={(item) =>
              openMetricWhitelistDialog(
                'histogram_buckets',
                'Количество бакетов в гистограмме',
                item.metric_name,
                item.buckets,
              )
            }
          />
        ) : (
          <EmptyCheckDetails message="Нарушений по количеству бакетов в гистограмме нет." />
        ),
    },
    {
      key: 'response_weight',
      label: 'Размер ответа',
      check: violations?.checks?.response_weight,
      failed: responseWeightCurrent > responseWeightLimit,
      issue_count: responseWeightCurrent > responseWeightLimit ? 1 : 0,
      max_description: undefined,
      details: (
        <div className="accordion-response">
          <SummaryRow label="Лимит" value={formatBytes(responseWeightLimit)} />
          <SummaryRow label="Текущее значение" value={formatBytes(responseWeightCurrent)} />
          <SummaryRow label="Размер ответа" value={formatBytes(violations?.response_weight)} />
        </div>
      ),
    },
  ];

  useEffect(() => {
    setOpenSections(checkSections.filter((section) => section.failed).map((section) => section.key));
  }, [details]);

  const failedSections = checkSections.filter((section) => section.failed).length;

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Детали отчета"
        title={summary?.name || `Группа объектов #${id ?? 'unknown'}`}
        leading={
          <Link aria-label="Назад к отчетам" className="page-back-link" to="/reports">
            <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
              <path
                d="M9.75 3.5L5.25 8l4.5 4.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.6"
              />
            </svg>
          </Link>
        }
      />

      {loading ? <LoadingBlock title="Загрузка отчета" description="Получаем детальную информацию по группе объектов." /> : null}
      {!loading && error ? (
        <ErrorBlock message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : null}
      {!loading && !error && !details ? (
        <EmptyBlock
          description="Бэкенд не вернул `target_group` в ответе. Проверьте корректность id и маршрут `/api/v1/target-groups/{id}`."
          title="Данные не найдены"
        />
      ) : null}

      {!loading && !error && details ? (
        <>
          <section className="panel panel-compact">
            <div className="service-detail-header">
              <div className="service-detail-title">
                <span className={`status-badge${failedSections > 0 ? ' is-alert' : ' is-ok'}`}>
                  {failedSections > 0 ? `Проверки не пройдены: ${failedSections}` : 'Все проверки пройдены'}
                </span>
                <p className="subtle-note">
                  Всего нарушений: {formatNumber(summary?.violation_stats?.total)}. Откройте конкретную проверку, чтобы увидеть детали.
                </p>
                {actionMessage ? <p className="inline-message">{actionMessage}</p> : null}
                {actionError ? <p className="inline-error">{actionError}</p> : null}
              </div>

              <div className="summary-grid summary-grid-compact">
                <SummaryRow label="Команда" value={summary?.team_name || '—'} />
                <SummaryRow label="Окружение" value={summary?.env || '—'} />
                <SummaryRow label="Кластер" value={summary?.cluster || '—'} />
                <SummaryRow label="Job" value={summary?.job || '—'} />
                <SummaryRow label="Последняя проверка" value={formatTimestamp(summary?.last_check)} />
                <SummaryRow label="Отчет сформирован" value={formatTimestamp(details.report_created_at)} />
              </div>
            </div>
          </section>

          <section className="accordion-stack">
            {checkSections.map((section) => {
              const isOpen = openSections.includes(section.key);
              const currentValue = toNumber(section.check?.current) ?? 0;
              const limitValue = toNumber(section.check?.limit) ?? 0;
              const isOverLimit = currentValue > limitValue;

              return (
                <article className={`check-card${section.failed ? ' is-alert' : ' is-ok'}${isOpen ? ' is-open' : ''}`} key={section.key}>
                  <button
                    aria-expanded={isOpen}
                    className="check-button"
                    onClick={() =>
                      setOpenSections((current) =>
                        current.includes(section.key)
                          ? current.filter((key) => key !== section.key)
                          : [...current, section.key],
                      )
                    }
                    type="button"
                  >
                    <div className="check-button-main">
                      <div className="check-button-heading">
                        <h2>{section.label}</h2>
                        <span className={`status-badge${section.failed ? ' is-alert' : ' is-ok'}`}>
                          {section.failed ? 'Не пройдена' : 'Пройдена'}
                        </span>
                      </div>

                      <p className="check-button-meta">
                        {section.failed
                          ? `Нарушений: ${formatNumber(section.issue_count)}`
                          : 'Нарушений нет'}
                        {section.max_description ? ` · Макс. значение: ${section.max_description}` : ''}
                      </p>
                    </div>

                    <div className="check-button-summary">
                      <strong className={`check-status-value${isOverLimit ? ' is-alert' : ' is-ok'}`}>
                        Статус: {formatCheckValue(section.key, section.check?.current)} /{' '}
                        {formatCheckValue(section.key, section.check?.limit)}
                      </strong>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="check-details">
                      {isAdmin && section.failed ? (
                        <div className="inline-actions check-admin-actions">
                          <button
                            className="button button-secondary"
                            onClick={() =>
                              setPendingCheckExclusion({
                                key: section.key,
                                label: section.label,
                              })
                            }
                            type="button"
                          >
                            Добавить проверку в исключения
                          </button>
                        </div>
                      ) : null}

                      {section.details}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        </>
      ) : null}

      {metricWhitelistDraft ? (
        <div className="modal-overlay" onClick={closeMetricWhitelistDialog} role="presentation">
          <section
            aria-modal="true"
            className="modal-card modal-card-small"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-header">
              <div>
                <h2>Добавить метрику в whitelist</h2>
                <p className="subtle-note">
                  Для метрики уже заполнены группа объектов, окружение и имя. Нужно указать только новый лимит.
                </p>
              </div>

              <button
                aria-label="Закрыть окно"
                className="icon-button"
                onClick={closeMetricWhitelistDialog}
                type="button"
              >
                <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
            </div>

            <form
              className="modal-body modal-body-stack"
              onSubmit={(event) => {
                event.preventDefault();
                void saveMetricWhitelist();
              }}
            >
              <div className="summary-grid summary-grid-compact">
                <SummaryRow label="Группа объектов" value={summary?.name || '—'} />
                <SummaryRow label="Окружение" value={summary?.env || '—'} />
                <SummaryRow label="Метрика" value={metricWhitelistDraft.metric_name} />
              </div>

              <label className="field">
                <span>{metricWhitelistDraft.label}</span>
                <input
                  autoFocus
                  min="0"
                  onChange={(event) =>
                    setMetricWhitelistDraft((current) =>
                      current ? { ...current, limit: event.target.value } : current,
                    )
                  }
                  type="number"
                  value={metricWhitelistDraft.limit}
                />
              </label>

              {metricWhitelistError ? <p className="inline-error">{metricWhitelistError}</p> : null}

              <div className="actions-row">
                <button className="button" disabled={metricWhitelistSaving} type="submit">
                  {metricWhitelistSaving ? 'Сохраняем...' : 'Сохранить'}
                </button>
                <button
                  className="button button-secondary"
                  onClick={closeMetricWhitelistDialog}
                  type="button"
                >
                  Отмена
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        cancelLabel="Отмена"
        confirmLabel="Добавить"
        description={
          pendingCheckExclusion && summary?.name && summary?.env
            ? `Проверка "${pendingCheckExclusion.label}" будет добавлена в исключения для группы объектов ${summary.name}/${summary.env}.`
            : ''
        }
        loading={checkExclusionSaving}
        onCancel={() => {
          if (!checkExclusionSaving) {
            setPendingCheckExclusion(null);
          }
        }}
        onConfirm={() => void confirmCheckExclusion()}
        open={Boolean(pendingCheckExclusion)}
        title="Добавить проверку в исключения?"
      />
    </section>
  );
}
