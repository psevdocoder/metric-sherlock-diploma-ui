import { useEffect, useState } from 'react';
import { getMetricCheckLimits, updateMetricCheckLimits } from '../api/metricSherlockApi';
import { useAuth } from '../auth/useAuth';
import { ErrorBlock, LoadingBlock } from '../components/PageState';

const byteUnits = ['B', 'KB', 'MB', 'GB'] as const;

type ByteUnit = (typeof byteUnits)[number];

interface LimitsFormState {
  max_metric_name_len: string;
  max_label_name_len: string;
  max_label_value_len: string;
  max_metric_cardinality: string;
  max_histogram_buckets: string;
  max_bytes_weight_value: string;
  max_bytes_weight_unit: ByteUnit;
}

const emptyForm: LimitsFormState = {
  max_metric_name_len: '0',
  max_label_name_len: '0',
  max_label_value_len: '0',
  max_metric_cardinality: '0',
  max_histogram_buckets: '0',
  max_bytes_weight_value: '0',
  max_bytes_weight_unit: 'B',
};

const byteUnitFactors: Record<ByteUnit, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
};

function formatEditableByteValue(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  const digits =
    value >= 100 ? 1 :
    value >= 10 ? 2 :
    value >= 1 ? 3 :
    value >= 0.1 ? 4 :
    value >= 0.01 ? 5 :
    6;
  return value.toFixed(digits).replace(/\.?0+$/, '');
}

function toByteInput(bytes: number | string | null | undefined): Pick<LimitsFormState, 'max_bytes_weight_value' | 'max_bytes_weight_unit'> {
  const normalized = Number(bytes ?? 0);

  if (!Number.isFinite(normalized) || normalized <= 0) {
    return {
      max_bytes_weight_value: '0',
      max_bytes_weight_unit: 'B',
    };
  }

  let unit: ByteUnit = 'B';

  if (normalized >= byteUnitFactors.GB) {
    unit = 'GB';
  } else if (normalized >= byteUnitFactors.MB) {
    unit = 'MB';
  } else if (normalized >= byteUnitFactors.KB) {
    unit = 'KB';
  }

  return {
    max_bytes_weight_value: formatEditableByteValue(normalized / byteUnitFactors[unit]),
    max_bytes_weight_unit: unit,
  };
}

function toBytes(value: string, unit: ByteUnit): number {
  const normalized = Number(value);

  if (!Number.isFinite(normalized) || normalized <= 0) {
    return 0;
  }

  return Math.round(normalized * byteUnitFactors[unit]);
}

export function LimitsPage() {
  const auth = useAuth();
  const [form, setForm] = useState<LimitsFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadLimits() {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.refreshToken();
      const response = await getMetricCheckLimits(token);
      const limits = response.limits;

      setForm({
        max_metric_name_len: String(limits?.max_metric_name_len ?? 0),
        max_label_name_len: String(limits?.max_label_name_len ?? 0),
        max_label_value_len: String(limits?.max_label_value_len ?? 0),
        max_metric_cardinality: String(limits?.max_metric_cardinality ?? 0),
        max_histogram_buckets: String(limits?.max_histogram_buckets ?? 0),
        ...toByteInput(limits?.max_bytes_weight),
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить лимиты');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLimits();
  }, []);

  return (
    <section className="page-stack">
      {loading ? <LoadingBlock /> : null}
      {!loading && error ? <ErrorBlock message={error} onRetry={() => void loadLimits()} /> : null}

      {!loading && !error ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>Пороговые значения</h2>
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
                  await updateMetricCheckLimits(token, {
                    limits: {
                      max_metric_name_len: Number(form.max_metric_name_len || 0),
                      max_label_name_len: Number(form.max_label_name_len || 0),
                      max_label_value_len: Number(form.max_label_value_len || 0),
                      max_metric_cardinality: Number(form.max_metric_cardinality || 0),
                      max_histogram_buckets: Number(form.max_histogram_buckets || 0),
                      max_bytes_weight: toBytes(form.max_bytes_weight_value, form.max_bytes_weight_unit),
                    },
                  });

                  setMessage('Лимиты сохранены.');
                } catch (saveError) {
                  setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить лимиты');
                } finally {
                  setSaving(false);
                }
              })();
            }}
          >
            <label className="field">
              <span>Макс. длина имени метрики</span>
              <input
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, max_metric_name_len: event.target.value }))}
                type="number"
                value={form.max_metric_name_len}
              />
            </label>
            <label className="field">
              <span>Макс. длина имени метки</span>
              <input
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, max_label_name_len: event.target.value }))}
                type="number"
                value={form.max_label_name_len}
              />
            </label>
            <label className="field">
              <span>Макс. длина значения метки</span>
              <input
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, max_label_value_len: event.target.value }))}
                type="number"
                value={form.max_label_value_len}
              />
            </label>
            <label className="field">
              <span>Макс. кардинальность</span>
              <input
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, max_metric_cardinality: event.target.value }))}
                type="number"
                value={form.max_metric_cardinality}
              />
            </label>
            <label className="field">
              <span>Макс. количество бакетов в гистограмме</span>
              <input
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, max_histogram_buckets: event.target.value }))}
                type="number"
                value={form.max_histogram_buckets}
              />
            </label>
            <label className="field">
              <span>Макс. размер ответа</span>
              <div className="input-combo">
                <input
                  min="0"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      max_bytes_weight_value: event.target.value,
                    }))
                  }
                  step="any"
                  type="number"
                  value={form.max_bytes_weight_value}
                />
                <select
                  onChange={(event) => {
                    const nextUnit = event.target.value as ByteUnit;

                    setForm((current) => {
                      if (current.max_bytes_weight_value.trim() === '') {
                        return {
                          ...current,
                          max_bytes_weight_unit: nextUnit,
                        };
                      }

                      const bytes = toBytes(current.max_bytes_weight_value, current.max_bytes_weight_unit);
                      return {
                        ...current,
                        max_bytes_weight_unit: nextUnit,
                        max_bytes_weight_value: formatEditableByteValue(bytes / byteUnitFactors[nextUnit]),
                      };
                    });
                  }}
                  value={form.max_bytes_weight_unit}
                >
                  {byteUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <div className="actions-row actions-row-bottom">
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
