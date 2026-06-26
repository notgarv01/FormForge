function formatFilename(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'form';
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSubmissionsToJSON(formName, submissions) {
  const cleanSubmissions = submissions.map((submission) => ({
    id: submission.id,
    submittedAt: submission.createdAt,
    data: submission.payload
  }));

  const blob = new Blob([JSON.stringify(cleanSubmissions, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `${formatFilename(formName)}_submissions.json`);
}

export function exportSubmissionsToCSV(formName, submissions) {
  if (submissions.length === 0) return;

  const payloadKeys = new Set();
  submissions.forEach((submission) => {
    Object.keys(submission.payload || {}).forEach((key) => payloadKeys.add(key));
  });

  const keyList = Array.from(payloadKeys);
  const headers = ['Submission ID', 'Submitted At', ...keyList];
  const rows = [
    headers,
    ...submissions.map((submission) => [
      submission.id,
      new Date(submission.createdAt).toLocaleString(),
      ...keyList.map((key) => {
        const value = submission.payload?.[key];
        if (value === undefined || value === null) return '';
        return Array.isArray(value) ? value.join('; ') : String(value);
      })
    ])
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${formatFilename(formName)}_submissions.csv`);
}
