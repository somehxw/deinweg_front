import { useMemo } from "react";
import { TranslationKey } from "../../../shared/i18n/translations";
import { TeacherFeedbackDto } from "../../../shared/types/teacher";

interface ParentFeedbackTableProps {
  items: TeacherFeedbackDto[];
  t: (key: TranslationKey) => string;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function ParentFeedbackTable({ items, t }: ParentFeedbackTableProps): JSX.Element {
  const sortedItems = useMemo(() => {
    const next = [...items];
    next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return next;
  }, [items]);

  if (sortedItems.length === 0) {
    return <p>{t("parentFeedbackEmpty")}</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>{t("tableCreatedAt")}</th>
            <th>{t("tableLessonSubject")}</th>
            <th>{t("tableComment")}</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => (
            <tr key={item.id}>
              <td>{formatDateTime(item.created_at)}</td>
              <td>{item.lesson_topic || `#${item.lesson.slice(0, 8)}`}</td>
              <td>{item.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
