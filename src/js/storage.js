// Storage module: export/import JSON records
// Exports: exportJSON(state), importJSON(file, state)

export function exportJSON(state) {
  const payload = { records: state.records };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'records.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importJSON(file, state) {
  const text = await file.text();
  const obj = JSON.parse(text);
  if (!obj || !Array.isArray(obj.records)) throw new Error('Invalid JSON schema');
  state.records = obj.records;
  state.onDataChanged();
}
