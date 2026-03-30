import { useEffect, useState } from 'react';
import {
  deleteMetricWhitelist,
  listMetricWhitelist,
  upsertMetricWhitelist,
} from '../api/metricSherlockApi';
import { useAuth } from '../auth/useAuth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/PageState';
import type { MetricWhitelistItem } from '../types/contracts';
import { formatNumber } from '../utils/format';

interface MetricWhitelistFormState {
  target_group: string;
  env: string;
  metric_name: string;
  metric_name_length: string;
  label_name_length: string;
  label_value_length: string;
  cardinality: string;
  histogram_buckets: string;
}

interface PendingMetricDelete {
  target_group: string;
  env: string;
  metric_name: string;
}

const emptyForm: MetricWhitelistFormState = {
  target_group: '',
  env: '',
  metric_name: '',
  metric_name_length: '0',
  label_name_length: '0',
  label_value_length: '0',
  cardinality: '0',
  histogram_buckets: '0',
};

function toFormState(item: MetricWhitelistItem): MetricWhitelistFormState {
  return {
    target_group: item.target_group ?? '',
    env: item.env ?? '',
    metric_name: item.metric_name ?? '',
    metric_name_length: String(item.checks?.metric_name_length ?? 0),
    label_name_length: String(item.checks?.label_name_length ?? 0),
    label_value_length: String(item.checks?.label_value_length ?? 0),
    cardinality: String(item.checks?.cardinality ?? 0),
    histogram_buckets: String(item.checks?.histogram_buckets ?? 0),
  };
}

export function MetricWhitelistPage() {
  const auth = useAuth();
  const [filters, setFilters] = useState({ target_group: '', env: '' });
  const [form, setForm] = useState<MetricWhitelistFormState>(emptyForm);
  const [items, setItems] = useState<MetricWhitelistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [pendingDelete, setPendingDelete] = useState<PendingMetricDelete | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadItems() {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.refreshToken();
      const response = await listMetricWhitelist(token, filters);
      setItems(response.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить исключения метрик');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) {
        setIsModalOpen(false);
        setFormError(null);
        setForm(emptyForm);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen, saving]);

  function closeModal() {
    if (saving) {
      return;
    }

    setIsModalOpen(false);
    setFormError(null);
    setForm(emptyForm);
  }

  function openCreateModal() {
    setModalMode('create');
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(item: MetricWhitelistItem) {
    setModalMode('edit');
    setForm(toFormState(item));
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeDeleteDialog() {
    if (deleting) {
      return;
    }

    setPendingDelete(null);
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setError(null);
    setMessage(null);

    try {
      const token = await auth.refreshToken();
      await deleteMetricWhitelist(token, pendingDelete);
      setMessage('Правило исключения удалено.');
      setPendingDelete(null);
      await loadItems();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Не удалось удалить правило исключения метрики',
      );
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>Фильтр</h2>
        </div>

        <form
          className="form-grid form-grid-inline"
          onSubmit={(event) => {
            event.preventDefault();
            void loadItems();
          }}
        >
          <label className="field">
            <span>Группа объектов</span>
            <input
              onChange={(event) => setFilters((current) => ({ ...current, target_group: event.target.value }))}
              type="text"
              value={filters.target_group}
            />
          </label>
          <label className="field">
            <span>Окружение</span>
            <input
              onChange={(event) => setFilters((current) => ({ ...current, env: event.target.value }))}
              type="text"
              value={filters.env}
            />
          </label>
          <div className="actions-row">
            <button className="button" type="submit">
              Найти
            </button>
          </div>
        </form>
      </section>

      {loading ? <LoadingBlock /> : null}
      {!loading && error ? <ErrorBlock message={error} onRetry={() => void loadItems()} /> : null}

      {!loading && !error ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>Список правил</h2>
            <button className="button" onClick={openCreateModal} type="button">
              Добавить правило
            </button>
          </div>

          {message ? <p className="inline-message">{message}</p> : null}

          {items.length === 0 ? (
            <EmptyBlock description="Для выбранных фильтров нет записей." title="Список пуст" />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Группа объектов</th>
                    <th>Окружение</th>
                    <th>Метрика</th>
                    <th>Длина имени метрики</th>
                    <th>Длина имени метки</th>
                    <th>Длина значения метки</th>
                    <th>Кардинальность</th>
                    <th>Количество бакетов в гистограмме</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={`${item.target_group}-${item.env}-${item.metric_name}`}>
                      <td>{item.target_group || '—'}</td>
                      <td>{item.env || '—'}</td>
                      <td>{item.metric_name || '—'}</td>
                      <td>{formatNumber(item.checks?.metric_name_length)}</td>
                      <td>{formatNumber(item.checks?.label_name_length)}</td>
                      <td>{formatNumber(item.checks?.label_value_length)}</td>
                      <td>{formatNumber(item.checks?.cardinality)}</td>
                      <td>{formatNumber(item.checks?.histogram_buckets)}</td>
                      <td className="table-actions">
                        <button
                          className="button button-secondary"
                          onClick={() => openEditModal(item)}
                          type="button"
                        >
                          Редактировать
                        </button>
                        <button
                          className="button button-danger"
                          onClick={() => {
                            if (!item.target_group || !item.env || !item.metric_name) {
                              return;
                            }
                            setPendingDelete({
                              target_group: item.target_group,
                              env: item.env,
                              metric_name: item.metric_name,
                            });
                          }}
                          type="button"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {isModalOpen ? (
        <div className="modal-overlay" onClick={closeModal} role="presentation">
          <section
            aria-modal="true"
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-header">
              <div>
                <h2>{modalMode === 'edit' ? 'Редактирование правила' : 'Новое правило'}</h2>
                <p className="subtle-note">
                  {modalMode === 'edit'
                    ? 'Измените параметры исключения для выбранной метрики.'
                    : 'Заполните параметры исключения для метрики.'}
                </p>
              </div>

              <button
                aria-label="Закрыть окно"
                className="icon-button"
                onClick={closeModal}
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
              className="modal-body form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                setSaving(true);
                setFormError(null);
                setMessage(null);

                void (async () => {
                  try {
                    const token = await auth.refreshToken();
                    await upsertMetricWhitelist(token, {
                      item: {
                        target_group: form.target_group,
                        env: form.env,
                        metric_name: form.metric_name,
                        checks: {
                          metric_name_length: Number(form.metric_name_length || 0),
                          label_name_length: Number(form.label_name_length || 0),
                          label_value_length: Number(form.label_value_length || 0),
                          cardinality: Number(form.cardinality || 0),
                          histogram_buckets: Number(form.histogram_buckets || 0),
                        },
                      },
                    });

                    setMessage(
                      modalMode === 'edit'
                        ? 'Правило исключения обновлено.'
                        : 'Правило исключения создано.',
                    );
                    setIsModalOpen(false);
                    setForm(emptyForm);
                    await loadItems();
                  } catch (saveError) {
                    setFormError(
                      saveError instanceof Error ? saveError.message : 'Не удалось сохранить исключение метрики',
                    );
                  } finally {
                    setSaving(false);
                  }
                })();
              }}
            >
              <label className="field">
                <span>Группа объектов</span>
                <input
                  disabled={modalMode === 'edit'}
                  onChange={(event) => setForm((current) => ({ ...current, target_group: event.target.value }))}
                  required
                  type="text"
                  value={form.target_group}
                />
              </label>
              <label className="field">
                <span>Окружение</span>
                <input
                  disabled={modalMode === 'edit'}
                  onChange={(event) => setForm((current) => ({ ...current, env: event.target.value }))}
                  required
                  type="text"
                  value={form.env}
                />
              </label>
              <label className="field">
                <span>Имя метрики</span>
                <input
                  disabled={modalMode === 'edit'}
                  onChange={(event) => setForm((current) => ({ ...current, metric_name: event.target.value }))}
                  required
                  type="text"
                  value={form.metric_name}
                />
              </label>
              <label className="field">
                <span>Длина имени метрики</span>
                <input
                  min="0"
                  onChange={(event) => setForm((current) => ({ ...current, metric_name_length: event.target.value }))}
                  type="number"
                  value={form.metric_name_length}
                />
              </label>
              <label className="field">
                <span>Длина имени метки</span>
                <input
                  min="0"
                  onChange={(event) => setForm((current) => ({ ...current, label_name_length: event.target.value }))}
                  type="number"
                  value={form.label_name_length}
                />
              </label>
              <label className="field">
                <span>Длина значения метки</span>
                <input
                  min="0"
                  onChange={(event) => setForm((current) => ({ ...current, label_value_length: event.target.value }))}
                  type="number"
                  value={form.label_value_length}
                />
              </label>
              <label className="field">
                <span>Кардинальность</span>
                <input
                  min="0"
                  onChange={(event) => setForm((current) => ({ ...current, cardinality: event.target.value }))}
                  type="number"
                  value={form.cardinality}
                />
              </label>
              <label className="field">
                <span>Количество бакетов в гистограмме</span>
                <input
                  min="0"
                  onChange={(event) => setForm((current) => ({ ...current, histogram_buckets: event.target.value }))}
                  type="number"
                  value={form.histogram_buckets}
                />
              </label>

              {formError ? <p className="inline-error field-full">{formError}</p> : null}

              <div className="actions-row actions-row-bottom">
                <button className="button" disabled={saving} type="submit">
                  {saving ? 'Сохраняем...' : modalMode === 'edit' ? 'Сохранить' : 'Создать'}
                </button>
                <button className="button button-secondary" onClick={closeModal} type="button">
                  Отмена
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        cancelLabel="Оставить"
        confirmLabel="Удалить"
        description={
          pendingDelete
            ? `Правило для ${pendingDelete.target_group}/${pendingDelete.env}/${pendingDelete.metric_name} будет удалено без возможности восстановления.`
            : ''
        }
        loading={deleting}
        onCancel={closeDeleteDialog}
        onConfirm={() => void confirmDelete()}
        open={Boolean(pendingDelete)}
        title="Удалить правило?"
      />
    </section>
  );
}
