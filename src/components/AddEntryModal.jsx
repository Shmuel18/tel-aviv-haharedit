import { useState } from 'react';

export function AddEntryModal({ category, schema, fields, onSubmit, onClose, t }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(schema.map(f => [f, '']))
  );

  const handleChange = (field, val) => {
    setValues(v => ({ ...v, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = {};
    for (const [k, v] of Object.entries(values)) {
      if (v.trim()) cleaned[k] = v.trim();
    }
    if (!cleaned[schema[0]]) return; // require at least primary field
    onSubmit(cleaned);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <h3>{t.directory.addTitle}</h3>
          <button className="modal-close" onClick={onClose} aria-label="close">✕</button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          {schema.map(field => (
            <label key={field} className="modal-field">
              <span>{fields[field] || field}</span>
              <input
                type="text"
                value={values[field] || ''}
                onChange={e => handleChange(field, e.target.value)}
                autoFocus={field === schema[0]}
              />
            </label>
          ))}

          <p className="modal-hint">{t.directory.addHint}</p>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              {t.directory.cancel}
            </button>
            <button type="submit" className="btn-primary">
              {t.directory.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
