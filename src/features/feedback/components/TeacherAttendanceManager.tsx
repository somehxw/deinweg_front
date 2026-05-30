import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getTeacherClassStudents,
  getTeacherLessonAttendance,
  getTeacherLessonFeedback,
  patchTeacherLessonAttendance,
  upsertTeacherLessonAttendance
} from "../../../shared/api/teacherApi";
import { ApiError } from "../../../shared/api/httpClient";
import { localizeAttendanceStatus } from "../../../shared/i18n/backendLabels";
import { TranslationKey } from "../../../shared/i18n/translations";
import { TeacherAttendanceDto, TeacherClassStudentDto, TeacherLessonDto } from "../../../shared/types/teacher";

interface TeacherAttendanceManagerProps {
  lessons: TeacherLessonDto[];
  isLessonsLoading: boolean;
  lessonsError: string | null;
  t: (key: TranslationKey) => string;
}

type AttendanceStatus = "present" | "absent" | "late" | "excused";

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

function formatLessonLabel(lesson: TeacherLessonDto): string {
  const startsAt = lesson.starts_at ? formatDateTime(lesson.starts_at) : "-";
  const className = lesson.class_name || lesson.school_class || "-";
  const topic = lesson.topic || "-";
  return `${startsAt} · ${className} · ${topic}`;
}

export function TeacherAttendanceManager({
  lessons,
  isLessonsLoading,
  lessonsError,
  t
}: TeacherAttendanceManagerProps): JSX.Element {
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [items, setItems] = useState<TeacherAttendanceDto[]>([]);
  const [feedbackStudents, setFeedbackStudents] = useState<string[]>([]);
  const [classStudents, setClassStudents] = useState<TeacherClassStudentDto[]>([]);
  const [newStudentIds, setNewStudentIds] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>("present");
  const [newComment, setNewComment] = useState("");
  const [editStatusByStudentId, setEditStatusByStudentId] = useState<Record<string, AttendanceStatus>>({});
  const [editCommentByStudentId, setEditCommentByStudentId] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const lessonOptions = useMemo(() => lessons.filter((lesson) => Boolean(lesson.id)), [lessons]);

  useEffect(() => {
    if (!selectedLessonId && lessonOptions.length > 0) {
      setSelectedLessonId(lessonOptions[0].id);
    }
  }, [lessonOptions, selectedLessonId]);

  useEffect(() => {
    if (!selectedLessonId) {
      setItems([]);
      setClassStudents([]);
      setEditStatusByStudentId({});
      setEditCommentByStudentId({});
      return;
    }

    let cancelled = false;

    async function loadAttendance(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const selectedLesson = lessonOptions.find((lesson) => lesson.id === selectedLessonId) ?? null;
        const [response, feedback] = await Promise.all([
          getTeacherLessonAttendance(selectedLessonId),
          getTeacherLessonFeedback(selectedLessonId)
        ]);
        if (cancelled) {
          return;
        }
        setItems(response);
        setFeedbackStudents(
          Array.from(new Set(feedback.map((item) => item.student).filter((value) => Boolean(value))))
        );
        if (!selectedLesson?.school_class) {
          setClassStudents([]);
        } else {
          try {
            const students = await getTeacherClassStudents(selectedLesson.school_class);
            if (!cancelled) {
              setClassStudents(students);
            }
          } catch {
            if (!cancelled) {
              setClassStudents([]);
            }
          }
        }
        const statusMap: Record<string, AttendanceStatus> = {};
        const commentMap: Record<string, string> = {};
        response.forEach((item) => {
          statusMap[item.student] = item.status;
          commentMap[item.student] = item.comment ?? "";
        });
        setEditStatusByStudentId(statusMap);
        setEditCommentByStudentId(commentMap);
      } catch (loadError) {
        if (!cancelled) {
          if (loadError instanceof ApiError) {
            setError(`${t("teacherAttendanceLoadError")} (${loadError.status})`);
          } else {
            setError(t("teacherAttendanceLoadError"));
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAttendance();
    return () => {
      cancelled = true;
    };
  }, [lessonOptions, selectedLessonId, t]);

  async function reloadCurrentLesson(): Promise<void> {
    if (!selectedLessonId) {
      return;
    }
    const response = await getTeacherLessonAttendance(selectedLessonId);
    const feedback = await getTeacherLessonFeedback(selectedLessonId);
    setItems(response);
    setFeedbackStudents(
      Array.from(new Set(feedback.map((item) => item.student).filter((value) => Boolean(value))))
    );
    const statusMap: Record<string, AttendanceStatus> = {};
    const commentMap: Record<string, string> = {};
    response.forEach((item) => {
      statusMap[item.student] = item.status;
      commentMap[item.student] = item.comment ?? "";
    });
    setEditStatusByStudentId(statusMap);
    setEditCommentByStudentId(commentMap);
  }

  async function onCreateAttendance(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedLessonId || newStudentIds.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await upsertTeacherLessonAttendance(selectedLessonId, {
        items: [
          ...newStudentIds.map((studentId) => ({
            student_id: studentId.trim(),
            status: newStatus,
            comment: newComment.trim() || undefined
          }))
        ]
      });
      setNewStudentIds([]);
      setNewComment("");
      setNewStatus("present");
      setSuccess(t("teacherAttendanceCreateSuccess"));
      await reloadCurrentLesson();
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(`${t("teacherAttendanceCreateError")} (${submitError.status})`);
      } else {
        setError(t("teacherAttendanceCreateError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const studentOptions = useMemo(() => {
    const unique = new Set<string>();
    const labels = new Map<string, string>();
    classStudents.forEach((student) => {
      if (!student.id) return;
      unique.add(student.id);
      const fullName = `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim();
      labels.set(student.id, fullName ? `${fullName} (${student.id})` : student.id);
    });
    items.forEach((item) => {
      if (!item.student) return;
      unique.add(item.student);
      if (!labels.has(item.student)) {
        labels.set(item.student, item.student);
      }
    });
    feedbackStudents.forEach((studentId) => {
      if (!studentId) return;
      unique.add(studentId);
      if (!labels.has(studentId)) {
        labels.set(studentId, studentId);
      }
    });
    return Array.from(unique).map((id) => ({
      id,
      label: labels.get(id) ?? id
    }));
  }, [classStudents, feedbackStudents, items]);

  const unmarkedStudentOptions = useMemo(() => {
    const markedStudentIds = new Set(items.map((item) => item.student));
    return studentOptions.filter((student) => !markedStudentIds.has(student.id));
  }, [items, studentOptions]);

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>();
    classStudents.forEach((student) => {
      if (!student.id) return;
      const fullName = `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim();
      if (fullName) {
        map.set(student.id, fullName);
      }
    });
    return map;
  }, [classStudents]);

  const originalAttendanceByStudentId = useMemo(() => {
    const map = new Map<string, TeacherAttendanceDto>();
    items.forEach((item) => {
      map.set(item.student, item);
    });
    return map;
  }, [items]);

  function isAttendanceRowDirty(studentId: string): boolean {
    const original = originalAttendanceByStudentId.get(studentId);
    if (!original) {
      return false;
    }

    const nextStatus = editStatusByStudentId[studentId] ?? original.status;
    const nextComment = (editCommentByStudentId[studentId] ?? "").trim();
    const originalComment = (original.comment ?? "").trim();

    return nextStatus !== original.status || nextComment !== originalComment;
  }

  useEffect(() => {
    if (unmarkedStudentOptions.length === 0) {
      setNewStudentIds([]);
      return;
    }
    setNewStudentIds((previous) => {
      const allowedIds = new Set(unmarkedStudentOptions.map((option) => option.id));
      const next = previous.filter((studentId) => allowedIds.has(studentId));
      if (next.length > 0) {
        return next;
      }
      return [unmarkedStudentOptions[0].id];
    });
  }, [unmarkedStudentOptions]);

  async function onSaveAttendance(studentId: string): Promise<void> {
    if (!selectedLessonId) {
      return;
    }

    const status = editStatusByStudentId[studentId] ?? "present";
    const comment = (editCommentByStudentId[studentId] ?? "").trim();

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await patchTeacherLessonAttendance(selectedLessonId, studentId, {
        status,
        comment: comment || undefined
      });
      setSuccess(t("teacherAttendanceUpdateSuccess"));
      await reloadCurrentLesson();
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(`${t("teacherAttendanceUpdateError")} (${submitError.status})`);
      } else {
        setError(t("teacherAttendanceUpdateError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel cabinet-section">
      <h2 className="section-heading">{t("teacherAttendanceSectionTitle")}</h2>
      <p className="subline">{t("teacherAttendanceSectionDescription")}</p>

      <div className="form-grid attendance-form-grid">
        <label className="field">
          <span>{t("teacherFeedbackLessonLabel")}</span>
          <select
            value={selectedLessonId}
            onChange={(event) => setSelectedLessonId(event.target.value)}
            disabled={isLessonsLoading || lessonOptions.length === 0}
          >
            {lessonOptions.length === 0 ? <option value="">{t("listEmpty")}</option> : null}
            {lessonOptions.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {formatLessonLabel(lesson)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {lessonsError ? <p className="error-text">{lessonsError}</p> : null}

      <form className="form-grid attendance-form-grid" onSubmit={(event) => void onCreateAttendance(event)}>
        <div className="form-row attendance-bulk-row">
          <label className="field">
            <span>{t("teacherAttendanceStudentIdsLabel")}</span>
            <select
              value={newStudentIds}
              onChange={(event) => {
                const selectedValues = Array.from(event.target.selectedOptions, (option) => option.value);
                setNewStudentIds(selectedValues);
              }}
              disabled={unmarkedStudentOptions.length === 0}
              className="attendance-bulk-students-select"
              multiple
              size={Math.min(8, Math.max(4, unmarkedStudentOptions.length))}
            >
              {unmarkedStudentOptions.length === 0 ? (
                <option value="">{t("teacherFeedbackStudentSelectEmpty")}</option>
              ) : null}
              {unmarkedStudentOptions.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.label}
                </option>
              ))}
            </select>
            <small className="field-hint">{t("teacherAttendanceBulkHint")}</small>
          </label>
          <label className="field">
            <span>{t("teacherAttendanceStatusLabel")}</span>
            <select
              value={newStatus}
              onChange={(event) => setNewStatus(event.target.value as AttendanceStatus)}
            >
              <option value="present">{localizeAttendanceStatus("present", t)}</option>
              <option value="absent">{localizeAttendanceStatus("absent", t)}</option>
              <option value="late">{localizeAttendanceStatus("late", t)}</option>
              <option value="excused">{localizeAttendanceStatus("excused", t)}</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>{t("tableComment")}</span>
          <textarea
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            rows={3}
            placeholder={t("teacherAttendanceCommentPlaceholder")}
          />
        </label>
        <div className="actions">
          <button
            type="submit"
            className="button"
            disabled={isSubmitting || !selectedLessonId || newStudentIds.length === 0}
          >
            {isSubmitting ? t("formSubmitting") : t("teacherAttendanceMarkPresentAction")}
          </button>
        </div>
      </form>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p>{success}</p> : null}

      {!isLoading && !error ? (
        items.length === 0 ? (
          <p>{t("teacherAttendanceEmpty")}</p>
        ) : (
          <div className="table-wrap attendance-table-wrap">
            <table className="data-table attendance-data-table">
              <thead>
                <tr>
                  <th>{t("tableStudentId")}</th>
                  <th>{t("teacherAttendanceStatusLabel")}</th>
                  <th>{t("tableComment")}</th>
                  <th>{t("tableActions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.lesson}-${item.student}`}>
                    <td>
                      <div className="attendance-student-cell">
                        <span className="attendance-student-name">
                          {studentNameById.get(item.student) ?? item.student}
                        </span>
                        {studentNameById.get(item.student) ? (
                          <span className="attendance-student-id">{item.student}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <select
                        className="attendance-status-select"
                        value={editStatusByStudentId[item.student] ?? item.status}
                        onChange={(event) =>
                          setEditStatusByStudentId((prev) => ({
                            ...prev,
                            [item.student]: event.target.value as AttendanceStatus
                          }))
                        }
                      >
                        <option value="present">{localizeAttendanceStatus("present", t)}</option>
                        <option value="absent">{localizeAttendanceStatus("absent", t)}</option>
                        <option value="late">{localizeAttendanceStatus("late", t)}</option>
                        <option value="excused">{localizeAttendanceStatus("excused", t)}</option>
                      </select>
                    </td>
                    <td>
                      <textarea
                        className="attendance-comment-input"
                        value={editCommentByStudentId[item.student] ?? ""}
                        onChange={(event) =>
                          setEditCommentByStudentId((prev) => ({
                            ...prev,
                            [item.student]: event.target.value
                          }))
                        }
                        rows={2}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="button secondary attendance-save-button"
                        onClick={() => void onSaveAttendance(item.student)}
                        disabled={isSubmitting || !isAttendanceRowDirty(item.student)}
                      >
                        {t("saveAction")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </section>
  );
}
