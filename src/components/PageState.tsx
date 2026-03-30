interface LoadingBlockProps {
  title?: string;
  description?: string;
}

interface ErrorBlockProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

interface EmptyBlockProps {
  title: string;
  description: string;
}

export function LoadingBlock({
  title = 'Загрузка',
  description = 'Получаем данные и синхронизируем состояние приложения.',
}: LoadingBlockProps) {
  return (
    <div className="state-card">
      <div className="loading-spinner" />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function ErrorBlock({ title = 'Ошибка', message, onRetry }: ErrorBlockProps) {
  return (
    <div className="state-card state-card-error">
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry ? (
        <button className="button" onClick={onRetry} type="button">
          Повторить
        </button>
      ) : null}
    </div>
  );
}

export function EmptyBlock({ title, description }: EmptyBlockProps) {
  return (
    <div className="state-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
