// Editor module: open/close editor and bind form events
// Exports: openEditor, closeEditor, bindEditorEvents

export function openEditor(rec = { name: '', startDate: '', endDate: '', tags: [], notes: '' }, index = -1) {
  const panel = document.getElementById('editorPanel');
  const form = document.getElementById('editorForm');
  panel.hidden = false;
  form.dataset.index = String(index);
  document.getElementById('fName').value = rec.name || '';
  document.getElementById('fStart').value = rec.startDate || '';
  document.getElementById('fEnd').value = rec.endDate || '';
  document.getElementById('fTags').value = (rec.tags || []).join(', ');
  document.getElementById('fNotes').value = rec.notes || '';
}

export function closeEditor() {
  const panel = document.getElementById('editorPanel');
  const form = document.getElementById('editorForm');
  form.reset();
  form.dataset.index = '-1';
  panel.hidden = true;
}

export function bindEditorEvents(state) {
  const editorForm = document.getElementById('editorForm');
  const btnCancel = document.getElementById('btnCancel');
  if (!editorForm) return;

  editorForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const idx = Number(editorForm.dataset.index || -1);
    const rec = {
      name: document.getElementById('fName').value.trim(),
      startDate: document.getElementById('fStart').value.trim(),
      endDate: document.getElementById('fEnd').value.trim(),
      tags: document.getElementById('fTags').value.split(',').map(s=>s.trim()).filter(Boolean),
      notes: document.getElementById('fNotes').value.trim()
    };
    if (idx >= 0) state.records[idx] = rec; else state.records.push(rec);
    closeEditor();
    state.onDataChanged();
  });
  btnCancel?.addEventListener('click', () => closeEditor());
}
