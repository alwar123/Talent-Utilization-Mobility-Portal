/**
 * pdf.js — Assessment result data builder
 *
 * The frontend uses jsPDF to render the actual PDF.
 * This utility builds a clean, structured JSON payload that the frontend
 * consumes directly from GET /api/hr/assessments/:id/download.
 *
 * It is also used server-side to build the plain-text version if needed.
 */

/**
 * Build a structured result report from a fully-populated Assessment document.
 *
 * @param {object} assessment - Mongoose Assessment doc (populated jobId + employeeId)
 * @returns {object} Structured report ready for the frontend PDF renderer
 */
exports.buildResultReport = (assessment) => {
  const { questions = [], submittedAnswers = [] } = assessment;

  // ── Question-by-question breakdown ─────────────────────────────────────────
  const breakdown = questions.map((q, i) => {
    const submitted    = submittedAnswers.find((a) => a.questionIndex === i);
    const selected     = submitted?.selectedAnswer || "—";
    const correct      = q.correctAnswer;
    const isCorrect    = selected === correct;

    return {
      questionNo: i + 1,
      question:   q.question,
      options:    q.options,
      selected,
      correct,
      isCorrect,
    };
  });

  // ── Category breakdown (tech / problem-solving / soft skills) ──────────────
  // Questions are ordered: 1-18 technical, 19-25 problem-solving, 26-30 soft skills
  const technical      = breakdown.slice(0, 18);
  const problemSolving = breakdown.slice(18, 25);
  const softSkills     = breakdown.slice(25, 30);

  const sectionScore = (items) => ({
    correct: items.filter((q) => q.isCorrect).length,
    total:   items.length,
    pct:     items.length
      ? Math.round((items.filter((q) => q.isCorrect).length / items.length) * 100)
      : 0,
  });

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      platform:    "SkillSphere",
    },
    candidate: {
      name:       assessment.employeeId?.fullName  || "N/A",
      email:      assessment.employeeId?.email     || "N/A",
      department: assessment.employeeId?.department || "N/A",
    },
    role: {
      title:      assessment.jobId?.title      || "N/A",
      department: assessment.jobId?.department || "N/A",
    },
    schedule: {
      date: assessment.scheduledDate,
      time: assessment.scheduledTime,
    },
    result: {
      score:      assessment.score      ?? 0,
      total:      30,
      percentage: assessment.percentage ?? 0,
      aiSummary:  assessment.aiSummary  || "",
      hrAction:   assessment.hrAction,
      hrFeedback: assessment.hrFeedback || "",
    },
    sectionScores: {
      technical:      sectionScore(technical),
      problemSolving: sectionScore(problemSolving),
      softSkills:     sectionScore(softSkills),
    },
    breakdown,
  };
};

/**
 * Build a plain-text summary for logging / fallback usage.
 *
 * @param {object} report - Output of buildResultReport()
 * @returns {string}
 */
exports.buildPlainTextSummary = (report) => {
  const lines = [
    `===== SkillSphere Assessment Report =====`,
    `Candidate : ${report.candidate.name} (${report.candidate.email})`,
    `Role      : ${report.role.title} — ${report.role.department}`,
    `Date      : ${report.schedule.date}  ${report.schedule.time}`,
    `Score     : ${report.result.score}/${report.result.total} (${report.result.percentage}%)`,
    `HR Action : ${report.result.hrAction.toUpperCase()}`,
    report.result.hrFeedback ? `HR Feedback: ${report.result.hrFeedback}` : "",
    ``,
    `AI Summary: ${report.result.aiSummary}`,
    ``,
    `── Section Scores ──`,
    `  Technical      : ${report.sectionScores.technical.correct}/${report.sectionScores.technical.total} (${report.sectionScores.technical.pct}%)`,
    `  Problem-Solving: ${report.sectionScores.problemSolving.correct}/${report.sectionScores.problemSolving.total} (${report.sectionScores.problemSolving.pct}%)`,
    `  Soft Skills    : ${report.sectionScores.softSkills.correct}/${report.sectionScores.softSkills.total} (${report.sectionScores.softSkills.pct}%)`,
    ``,
    `── Question Breakdown ──`,
    ...report.breakdown.map(
      (q) =>
        `Q${String(q.questionNo).padStart(2, "0")}: ${q.isCorrect ? "✅" : "❌"}  ` +
        `Selected: ${q.selected}  Correct: ${q.correct}  |  ${q.question}`
    ),
    `=========================================`,
  ];

  return lines.filter((l) => l !== undefined).join("\n");
};
