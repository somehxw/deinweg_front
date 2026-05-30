import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createTeacherLessonFeedback,
  getTeacherClassStudents,
  getTeacherLessonAttendance,
  getTeacherLessonFeedback,
  updateTeacherFeedback
} from "../../../shared/api/teacherApi";
import { ApiError } from "../../../shared/api/httpClient";
import { TranslationKey } from "../../../shared/i18n/translations";
import {
  TeacherAttendanceDto,
  TeacherClassStudentDto,
  TeacherFeedbackDto,
  TeacherFeedbackUpdateDto,
  TeacherLessonDto
} from "../../../shared/types/teacher";

interface TeacherFeedbackManagerProps {
  lessons: TeacherLessonDto[];
  isLessonsLoading: boolean;
  lessonsError: string | null;
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

function formatLessonLabel(lesson: TeacherLessonDto): string {
  const startsAt = lesson.starts_at ? formatDateTime(lesson.starts_at) : "-";
  const className = lesson.class_name || lesson.school_class || "-";
  const topic = lesson.topic || "-";
  return `${startsAt} · ${className} · ${topic}`;
}

export function TeacherFeedbackManager({
  lessons,
  isLessonsLoading,
  lessonsError,
  t
}: TeacherFeedbackManagerProps): JSX.Element {
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [feedbackList, setFeedbackList] = useState<TeacherFeedbackDto[]>([]);
  const [attendanceList, setAttendanceList] = useState<TeacherAttendanceDto[]>([]);
  const [classStudents, setClassStudents] = useState<TeacherClassStudentDto[]>([]);
  const [studentId, setStudentId] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const lessonOptions = useMemo(
    () => lessons.filter((lesson) => Boolean(lesson.id)),
    [lessons]
  );

  useEffect(() => {
    if (!selectedLessonId && lessonOptions.length > 0) {
      setSelectedLessonId(lessonOptions[0].id);
    }
  }, [lessonOptions, selectedLessonId]);

  useEffect(() => {
    if (!selectedLessonId) {
      setFeedbackList([]);
      setAttendanceList([]);
      setClassStudents([]);
      return;
    }

    let cancelled = false;

    async function loadFeedback(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const selectedLesson = lessonOptions.find((lesson) => lesson.id === selectedLessonId) ?? null;
        const [feedbackResponse, attendanceResponse] = await Promise.all([
          getTeacherLessonFeedback(selectedLessonId),
          getTeacherLessonAttendance(selectedLessonId)
        ]);
        if (!cancelled) {
          setFeedbackList(feedbackResponse);
          setAttendanceList(attendanceResponse);
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
        }
      } catch (loadError) {
        if (!cancelled) {
          if (loadError instanceof ApiError) {
            setError(`${t("teacherFeedbackLoadError")} (${loadError.status})`);
          } else {
            setError(t("teacherFeedbackLoadError"));
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFeedback();
    return () => {
      cancelled = true;
    };
  }, [lessonOptions, selectedLessonId, t]);

  const studentOptions = useMemo(() => {
    const unique = new Set<string>();
    const labels = new Map<string, string>();
    classStudents.forEach((student) => {
      if (!student.id) return;
      unique.add(student.id);
      const fullName = `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim();
      labels.set(student.id, fullName ? `${fullName} (${student.id})` : student.id);
    });
    attendanceList.forEach((item) => {
      if (!item.student) return;
      unique.add(item.student);
      if (!labels.has(item.student)) {
        labels.set(item.student, item.student);
      }
    });
    feedbackList.forEach((item) => {
      if (!item.student) return;
      unique.add(item.student);
      if (!labels.has(item.student)) {
        labels.set(item.student, item.student);
      }
    });
    return Array.from(unique).map((id) => ({
      id,
      label: labels.get(id) ?? id
    }));
  }, [attendanceList, classStudents, feedbackList]);

  useEffect(() => {
    if (studentOptions.length === 0) {
      setStudentId("");
      return;
    }
    if (!studentOptions.some((option) => option.id === studentId)) {
      setStudentId(studentOptions[0].id);
    }
  }, [studentId, studentOptions]);

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>();
    classStudents.forEach((student) => {
      const fullName = `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim();
      if (student.id && fullName) {
        map.set(student.id, fullName);
      }
    });
    return map;
  }, [classStudents]);

  async function onCreateFeedback(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedLessonId || !studentId.trim() || !feedbackText.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createTeacherLessonFeedback(selectedLessonId, {
        lesson: selectedLessonId,
        student: studentId.trim(),
        text: feedbackText.trim()
      });
      setFeedbackText("");
      setSuccess(t("teacherFeedbackCreateSuccess"));
      setFeedbackList(await getTeacherLessonFeedback(selectedLessonId));
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(`${t("teacherFeedbackCreateError")} (${submitError.status})`);
      } else {
        setError(t("teacherFeedbackCreateError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSaveEdit(feedbackId: string): Promise<void> {
    const payload: TeacherFeedbackUpdateDto = {
      text: editingText.trim()
    };
    if (!payload.text) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await updateTeacherFeedback(feedbackId, payload);
      setEditingFeedbackId(null);
      setEditingText("");
      setSuccess(t("teacherFeedbackUpdateSuccess"));
      if (selectedLessonId) {
        setFeedbackList(await getTeacherLessonFeedback(selectedLessonId));
      }
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(`${t("teacherFeedbackUpdateError")} (${submitError.status})`);
      } else {
        setError(t("teacherFeedbackUpdateError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel cabinet-section">
      <h2 className="section-heading">{t("teacherFeedbackSectionTitle")}</h2>
      <p className="subline">{t("teacherFeedbackSectionDescription")}</p>

      <div className="form-grid">
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

      <form className="form-grid" onSubmit={(event) => void onCreateFeedback(event)}>
        <div className="form-row">
          <label className="field">
            <span>{t("teacherFeedbackStudentIdLabel")}</span>
            <select
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              disabled={studentOptions.length === 0}
            >
              {studentOptions.length === 0 ? (
                <option value="">{t("teacherFeedbackStudentSelectEmpty")}</option>
              ) : null}
              {studentOptions.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.label}
                </option>
              ))}
            </select>
            {studentOptions.length === 0 ? (
              <span className="field-hint">{t("teacherFeedbackStudentIdPlaceholder")}</span>
            ) : null}
          </label>
        </div>
        <label className="field">
          <span>{t("teacherFeedbackTextLabel")}</span>
          <textarea
            value={feedbackText}
            onChange={(event) => setFeedbackText(event.target.value)}
            rows={4}
            placeholder={t("teacherFeedbackTextPlaceholder")}
          />
        </label>
        <div className="actions">
          <button type="submit" className="button" disabled={isSubmitting || !selectedLessonId}>
            {isSubmitting ? t("formSubmitting") : t("teacherFeedbackCreateAction")}
          </button>
        </div>
      </form>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p>{success}</p> : null}

      {!isLoading && !error ? (
        feedbackList.length === 0 ? (
          <p>{t("teacherFeedbackEmpty")}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("tableCreatedAt")}</th>
                  <th>{t("tableStudentId")}</th>
                  <th>{t("tableComment")}</th>
                  <th>{t("tableActions")}</th>
                </tr>
              </thead>
              <tbody>
                {feedbackList.map((item) => {
                  const isEditing = editingFeedbackId === item.id;
                  return (
                    <tr key={item.id}>
                      <td>{formatDateTime(item.created_at)}</td>
                      <td>{studentNameById.get(item.student) ?? item.student}</td>
                      <td>
                        {isEditing ? (
                          <textarea
                            value={editingText}
                            onChange={(event) => setEditingText(event.target.value)}
                            rows={3}
                          />
                        ) : (
                          item.text
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="row">
                            <button
                              type="button"
                              className="button"
                              onClick={() => void onSaveEdit(item.id)}
                              disabled={isSubmitting}
                            >
                              {t("saveAction")}
                            </button>
                            <button
                              type="button"
                              className="button secondary"
                              onClick={() => {
                                setEditingFeedbackId(null);
                                setEditingText("");
                              }}
                              disabled={isSubmitting}
                            >
                              {t("cancelAction")}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => {
                              setEditingFeedbackId(item.id);
                              setEditingText(item.text);
                            }}
                          >
                            {t("editAction")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </section>
  );
}
