export class FormForgeExporter {
  /**
   * Prompts browser to download submissions payload list as a JSON file.
   */
  static exportToJSON(formName, submissions) {
    const cleanSubmissions = submissions.map(s => ({
      id: s.id,
      submittedAt: s.createdAt,
      data: s.payload
    }));
    
    const jsonStr = JSON.stringify(cleanSubmissions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const filename = `${this.formatFilename(formName)}_submissions.json`;
    this.triggerDownload(blob, filename);
  }

  /**
   * Parses dynamic key payloads and downloads submissions list as CSV.
   */
  static exportToCSV(formName, submissions) {
    if (submissions.length === 0) return;

    // 1. Gather all dynamic payload keys across all submissions to act as columns
    const payloadKeys = new Set();
    submissions.forEach(sub => {
      if (sub.payload) {
        Object.keys(sub.payload).forEach(key => payloadKeys.add(key));
      }
    });
    const keyList = Array.from(payloadKeys);

    // 2. Build CSV Header
    const headers = ['Submission ID', 'Submitted At', ...keyList];
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    // 3. Build CSV Rows dynamically mapping payload fields
    submissions.forEach(sub => {
      const row = [
        sub.id,
        new Date(sub.createdAt).toLocaleString(),
        ...keyList.map(k => {
          const val = sub.payload[k];
          if (val === undefined || val === null) {
            return '';
          }
          const valStr = Array.isArray(val) ? val.join('; ') : String(val);
          return valStr;
        })
      ];
      csvRows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `${this.formatFilename(formName)}_submissions.csv`;
    this.triggerDownload(blob, filename);
  }

  // Helper utils
  static formatFilename(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  }

  static triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
