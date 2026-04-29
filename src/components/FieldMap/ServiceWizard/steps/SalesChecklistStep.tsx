'use client';

import styles from './SalesChecklistStep.module.scss';

export interface SalesChecklistQuestion {
  id: string;
  text: string;
  answerType: 'yes_no' | 'text';
  displayOrder: number;
  parentQuestionId: string | null;
}

export interface SalesChecklist {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  questions: SalesChecklistQuestion[];
  linkedPlanIds: string[];
}

export interface ChecklistResponse {
  questionId: string;
  questionText: string;
  answerType: 'yes_no' | 'text';
  answer: 'yes' | 'no' | string;
  parentQuestionId?: string | null;
}

export interface ChecklistResponseGroup {
  checklistId: string;
  checklistName: string;
  responses: ChecklistResponse[];
}

interface SalesChecklistStepProps {
  checklists: SalesChecklist[];
  responseGroups: ChecklistResponseGroup[];
  onChange: (groups: ChecklistResponseGroup[]) => void;
}

export function SalesChecklistStep({
  checklists,
  responseGroups,
  onChange,
}: SalesChecklistStepProps) {
  if (checklists.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyMessage}>
          No checklists required for the selected services.
        </p>
      </div>
    );
  }

  function getGroup(checklistId: string): ChecklistResponseGroup | undefined {
    return responseGroups.find(g => g.checklistId === checklistId);
  }

  function getResponse(
    checklistId: string,
    questionId: string
  ): ChecklistResponse | undefined {
    return getGroup(checklistId)?.responses.find(r => r.questionId === questionId);
  }

  function handleAnswer(
    checklist: SalesChecklist,
    question: SalesChecklistQuestion,
    value: string,
    parentQuestionId?: string | null
  ) {
    const childrenOf = (parentId: string) =>
      checklist.questions.filter(q => q.parentQuestionId === parentId);

    const groupIndex = responseGroups.findIndex(g => g.checklistId === checklist.id);
    const currentGroup: ChecklistResponseGroup = groupIndex >= 0
      ? { ...responseGroups[groupIndex], responses: [...responseGroups[groupIndex].responses] }
      : { checklistId: checklist.id, checklistName: checklist.name, responses: [] };

    const existingIdx = currentGroup.responses.findIndex(r => r.questionId === question.id);

    if (existingIdx >= 0) {
      currentGroup.responses[existingIdx] = { ...currentGroup.responses[existingIdx], answer: value };
      // When yes/no is switched to 'no', remove child responses
      if (question.answerType === 'yes_no' && value === 'no') {
        currentGroup.responses = currentGroup.responses.filter(
          r => r.parentQuestionId !== question.id
        );
      }
      // When switched to 'yes', init child responses
      if (question.answerType === 'yes_no' && value === 'yes') {
        for (const child of childrenOf(question.id)) {
          if (!currentGroup.responses.find(r => r.questionId === child.id)) {
            currentGroup.responses.push({
              questionId: child.id,
              questionText: child.text,
              answerType: child.answerType,
              answer: '',
              parentQuestionId: question.id,
            });
          }
        }
      }
    } else {
      const newResponse: ChecklistResponse = {
        questionId: question.id,
        questionText: question.text,
        answerType: question.answerType,
        answer: value,
        ...(parentQuestionId ? { parentQuestionId } : {}),
      };
      currentGroup.responses.push(newResponse);
      if (question.answerType === 'yes_no' && value === 'yes') {
        for (const child of childrenOf(question.id)) {
          if (!currentGroup.responses.find(r => r.questionId === child.id)) {
            currentGroup.responses.push({
              questionId: child.id,
              questionText: child.text,
              answerType: child.answerType,
              answer: '',
              parentQuestionId: question.id,
            });
          }
        }
      }
    }

    const updatedGroups = groupIndex >= 0
      ? responseGroups.map((g, i) => (i === groupIndex ? currentGroup : g))
      : [...responseGroups, currentGroup];

    onChange(updatedGroups);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Sales Checklist</h2>
        <p className={styles.subtitle}>Answer all questions before continuing.</p>
      </div>

      {checklists.map(checklist => {
        const rootQuestions = checklist.questions.filter(q => q.parentQuestionId === null);
        const childrenOf = (parentId: string) =>
          checklist.questions.filter(q => q.parentQuestionId === parentId);

        return (
          <div key={checklist.id} className={styles.checklistSection}>
            <h3 className={styles.checklistName}>{checklist.name}</h3>

            <div className={styles.questionList}>
              {rootQuestions.map((q, idx) => {
                const response = getResponse(checklist.id, q.id);
                const answer = response?.answer ?? '';
                const children = childrenOf(q.id);
                const showChildren =
                  q.answerType === 'yes_no' && answer === 'yes' && children.length > 0;

                return (
                  <div key={q.id} className={styles.questionItem}>
                    <p className={styles.questionText}>
                      <span className={styles.questionNumber}>{idx + 1}.</span> {q.text}
                    </p>

                    {q.answerType === 'yes_no' ? (
                      <div className={styles.yesNoGroup}>
                        <button
                          type="button"
                          className={`${styles.yesNoBtn} ${answer === 'yes' ? styles.selected : ''}`}
                          onClick={() => handleAnswer(checklist, q, 'yes')}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className={`${styles.yesNoBtn} ${answer === 'no' ? styles.selectedNo : ''}`}
                          onClick={() => handleAnswer(checklist, q, 'no')}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <textarea
                        className={styles.textAnswer}
                        rows={3}
                        value={answer}
                        onChange={e => handleAnswer(checklist, q, e.target.value)}
                        placeholder="Enter your answer&hellip;"
                      />
                    )}

                    {showChildren && (
                      <div className={styles.conditionalBlock}>
                        {children.map(child => {
                          const childResponse = getResponse(checklist.id, child.id);
                          const childAnswer = childResponse?.answer ?? '';
                          return (
                            <div key={child.id} className={styles.conditionalQuestion}>
                              <p className={styles.conditionalLabel}>{child.text}</p>
                              {child.answerType === 'yes_no' ? (
                                <div className={styles.yesNoGroup}>
                                  <button
                                    type="button"
                                    className={`${styles.yesNoBtn} ${childAnswer === 'yes' ? styles.selected : ''}`}
                                    onClick={() => handleAnswer(checklist, child, 'yes', q.id)}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.yesNoBtn} ${childAnswer === 'no' ? styles.selectedNo : ''}`}
                                    onClick={() => handleAnswer(checklist, child, 'no', q.id)}
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
                                    handleAnswer(checklist, child, e.target.value, q.id)
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
      })}
    </div>
  );
}
