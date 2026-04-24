'use client';

import { useEffect, useState } from 'react';
import styles from './SafetyChecklistStep.module.scss';

export interface SafetyChecklistQuestion {
  id: string;
  text: string;
  answerType: 'yes_no' | 'text';
  order: number;
  parentId?: string; // if set, this question is a conditional child shown when parent answer = 'yes'
}

export interface SafetyChecklistResponse {
  questionId: string;
  questionText: string;
  answerType: 'yes_no' | 'text';
  answer: 'yes' | 'no' | string;
  parentQuestionId?: string; // present on conditional child responses
}

interface SafetyChecklistStepProps {
  companyId: string;
  responses: SafetyChecklistResponse[];
  onChange: (responses: SafetyChecklistResponse[]) => void;
}

export function SafetyChecklistStep({
  companyId,
  responses,
  onChange,
}: SafetyChecklistStepProps) {
  const [questions, setQuestions] = useState<SafetyChecklistQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`/api/companies/${companyId}/settings`);
        if (!res.ok) return;
        const { settings } = await res.json();
        const raw = settings?.safety_checklist_questions?.value;

        const parsed: any[] = raw ? JSON.parse(raw) : [];

        // Migrate old format (conditionalQuestion on parent → parentId on child)
        const migrated: SafetyChecklistQuestion[] = parsed.map(q => {
          const { conditionalQuestion, ...rest } = q;
          const parent = parsed.find(
            (p: { conditionalQuestion?: { questionId?: string } }) =>
              p.conditionalQuestion?.questionId === q.id
          );
          return parent ? { ...rest, parentId: parent.id } : rest;
        });

        migrated.sort((a, b) => a.order - b.order);
        setQuestions(migrated);

        if (migrated.length > 0 && responses.length === 0) {
          const rootQuestions = migrated.filter(q => !q.parentId);
          const initial: SafetyChecklistResponse[] = rootQuestions.map(q => ({
            questionId: q.id,
            questionText: q.text,
            answerType: q.answerType,
            answer: '',
          }));
          onChange(initial);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const rootQuestions = questions.filter(q => !q.parentId);
  const childrenOf = (parentId: string) =>
    questions.filter(q => q.parentId === parentId);

  function getResponse(
    questionId: string
  ): SafetyChecklistResponse | undefined {
    return responses.find(r => r.questionId === questionId);
  }

  function handleAnswer(
    questionId: string,
    value: string,
    parentQuestionId?: string
  ) {
    const q = questions.find(q => q.id === questionId);
    const existing = responses.find(r => r.questionId === questionId);

    if (existing) {
      let updated = responses.map(r =>
        r.questionId === questionId ? { ...r, answer: value } : r
      );
      // When a yes/no question is switched to 'no', remove all its child responses
      if (q?.answerType === 'yes_no' && value === 'no') {
        updated = updated.filter(r => r.parentQuestionId !== questionId);
      }
      // When switched to 'yes', init responses for any children that don't have one yet
      if (q?.answerType === 'yes_no' && value === 'yes') {
        for (const child of childrenOf(questionId)) {
          if (!updated.find(r => r.questionId === child.id)) {
            updated.push({
              questionId: child.id,
              questionText: child.text,
              answerType: child.answerType,
              answer: '',
              parentQuestionId: questionId,
            });
          }
        }
      }
      onChange(updated);
    } else if (q) {
      const newResponse: SafetyChecklistResponse = {
        questionId: q.id,
        questionText: q.text,
        answerType: q.answerType,
        answer: value,
        ...(parentQuestionId ? { parentQuestionId } : {}),
      };
      const updated = [...responses, newResponse];
      if (q.answerType === 'yes_no' && value === 'yes') {
        for (const child of childrenOf(questionId)) {
          if (!updated.find(r => r.questionId === child.id)) {
            updated.push({
              questionId: child.id,
              questionText: child.text,
              answerType: child.answerType,
              answer: '',
              parentQuestionId: questionId,
            });
          }
        }
      }
      onChange(updated);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading checklist&hellip;</div>;
  }

  if (rootQuestions.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Safety Checklist</h2>
        <p className={styles.subtitle}>
          Answer all questions before continuing.
        </p>
      </div>

      <div className={styles.questionList}>
        {rootQuestions.map((q, idx) => {
          const response = getResponse(q.id);
          const answer = response?.answer ?? '';
          const children = childrenOf(q.id);
          const showChildren =
            q.answerType === 'yes_no' &&
            answer === 'yes' &&
            children.length > 0;

          return (
            <div key={q.id} className={styles.questionItem}>
              <p className={styles.questionText}>
                <span className={styles.questionNumber}>{idx + 1}.</span>{' '}
                {q.text}
              </p>

              {q.answerType === 'yes_no' ? (
                <div className={styles.yesNoGroup}>
                  <button
                    type="button"
                    className={`${styles.yesNoBtn} ${answer === 'yes' ? styles.selected : ''}`}
                    onClick={() => handleAnswer(q.id, 'yes')}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`${styles.yesNoBtn} ${answer === 'no' ? styles.selectedNo : ''}`}
                    onClick={() => handleAnswer(q.id, 'no')}
                  >
                    No
                  </button>
                </div>
              ) : (
                <textarea
                  className={styles.textAnswer}
                  rows={3}
                  value={answer}
                  onChange={e => handleAnswer(q.id, e.target.value)}
                  placeholder="Enter your answer&hellip;"
                />
              )}

              {showChildren && (
                <div className={styles.conditionalBlock}>
                  {children.map(child => {
                    const childResponse = getResponse(child.id);
                    const childAnswer = childResponse?.answer ?? '';
                    return (
                      <div
                        key={child.id}
                        className={styles.conditionalQuestion}
                      >
                        <p className={styles.conditionalLabel}>{child.text}</p>
                        {child.answerType === 'yes_no' ? (
                          <div className={styles.yesNoGroup}>
                            <button
                              type="button"
                              className={`${styles.yesNoBtn} ${childAnswer === 'yes' ? styles.selected : ''}`}
                              onClick={() =>
                                handleAnswer(child.id, 'yes', q.id)
                              }
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              className={`${styles.yesNoBtn} ${childAnswer === 'no' ? styles.selectedNo : ''}`}
                              onClick={() => handleAnswer(child.id, 'no', q.id)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <textarea
                            className={styles.textAnswer}
                            rows={2}
                            value={childAnswer}
                            onChange={e =>
                              handleAnswer(child.id, e.target.value, q.id)
                            }
                            placeholder="Enter your answer&hellip;"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
