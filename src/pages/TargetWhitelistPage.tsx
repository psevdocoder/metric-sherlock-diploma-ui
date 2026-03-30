import { useEffect, useState } from 'react';
import {
  deleteTargetWhitelist,
  listTargetWhitelist,
  upsertTargetWhitelist,
} from '../api/metricSherlockApi';
import { useAuth } from '../auth/useAuth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/PageState';
import type { TargetWhitelistItem } from '../types/contracts';

interface TargetWhitelistFormState {
  target_group: string;
  env: string;
  metric_name_length: boolean;
  label_name_length: boolean;
  label_value_length: boolean;
  cardinality: boolean;
  histogram_buckets: boolean;
  response_weight: boolean;
}

interface PendingTargetDelete {
  target_group: string;
  env: string;
}

const emptyForm: TargetWhitelistFormState = {
  target_group: '',
  env: '',
  metric_name_length: false,
  label_name_length: false,
  label_value_length: false,
  cardinality: false,
  histogram_buckets: false,
  response_weight: false,
};

function toFormState(item: TargetWhitelistItem): TargetWhitelistFormState {
  return {
    target_group: item.target_group ?? '',
    env: item.env ?? '',
    metric_name_length: Boolean(item.checks?.metric_name_length),
    label_name_length: Boolean(item.checks?.label_name_length),
    label_value_length: Boolean(item.checks?.label_value_length),
    cardinality: Boolean(item.checks?.cardinality),
    histogram_buckets: Boolean(item.checks?.histogram_buckets),
    response_weight: Boolean(item.checks?.response_weight),
  };
}

export function TargetWhitelistPage() {
  const auth = useAuth();
  const [filters, setFilters] = useState({ target_group: '', env: '' });
  const [form, setForm] = useState<TargetWhitelistFormState>(emptyForm);
  const [items, setItems] = useState<TargetWhitelistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingTargetDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  async function loadItems() {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.refreshToken();
      const response = await listTargetWhitelist(token, filters);
      setItems(response.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить исключения групп объектов');
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

  function openEditModal(item: TargetWhitelistItem) {
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
      await deleteTargetWhitelist(token, pendingDelete);
      setMessage('Правило исключения удалено.');
      setPendingDelete(null);
      await loadItems();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Не удалось удалить правило исключения группы объектов',
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
                    <th>Отключенные проверки</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const checks = item.checks;
                    const enabledChecks = [
                      checks?.metric_name_length ? 'длина имени метрики' : null,
                      checks?.label_name_length ? 'длина имени метки' : null,
                      checks?.label_value_length ? 'длина значения метки' : null,
                      checks?.cardinality ? 'кардинальность' : null,
                      checks?.histogram_buckets ? 'количество бакетов в гистограмме' : null,
                      checks?.response_weight ? 'размер ответа' : null,
                    ]
                      .filter(Boolean)
                      .join(', ');

                    return (
                      <tr key={`${item.target_group}-${item.env}`}>
                        <td>{item.target_group || '—'}</td>
                        <td>{item.env || '—'}</td>
                        <td>{enabledChecks || 'Ни одна проверка не отключена'}</td>
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
                              if (!item.target_group || !item.env) {
                                return;
                              }
                              setPendingDelete({
                                target_group: item.target_group,
                                env: item.env,
                              });
                            }}
                            type="button"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
                    ? 'Измените список проверок, исключенных для выбранной группы объектов.'
                    : 'Выберите проверки, которые нужно исключить для группы объектов.'}
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
                    await upsertTargetWhitelist(token, {
                      item: {
                        target_group: form.target_group,
                        env: form.env,
                        checks: {
                          metric_name_length: form.metric_name_length,
                          label_name_length: form.label_name_length,
                          label_value_length: form.label_value_length,
                          cardinality: form.cardinality,
                          histogram_buckets: form.histogram_buckets,
                          response_weight: form.response_weight,
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
                      saveError instanceof Error
                        ? saveError.message
                        : 'Не удалось сохранить исключение группы объектов',
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

              <div className="checkbox-grid field-full">
                {[
                  ['metric_name_length', 'Длина имени метрики'],
                  ['label_name_length', 'Длина имени метки'],
                  ['label_value_length', 'Длина значения метки'],
                  ['cardinality', 'Кардинальность'],
                  ['histogram_buckets', 'Количество бакетов в гистограмме'],
                  ['response_weight', 'Размер ответа'],
                ].map(([fieldName, label]) => (
                  <label className="checkbox-card" key={fieldName}>
                    <input
                      checked={form[fieldName as keyof TargetWhitelistFormState] as boolean}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [fieldName]: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

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
            ? `Правило для группы объектов ${pendingDelete.target_group}/${pendingDelete.env} будет удалено без возможности восстановления.`
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
