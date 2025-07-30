import { useState } from 'react';
import axios from 'axios';
import "./NoteEditor.css";
import { handleError, handleSuccess } from '../../toastutils';

const NoteEditor = ({ domain, currentNote, onSave }) => {
  const [note, setNote] = useState(currentNote || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const superCategory = localStorage.getItem("superCategory") || "natural";

const apiBase =
  superCategory === "casino"
    ? "casino/scraper"
    : superCategory === "dating"
    ? "dating/scraper"
    : "api/scraper"; //
  

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await axios.put(
        `${import.meta.env.VITE_API_URI}/${apiBase}/note/${domain}`,
        { note },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      handleSuccess(res.data.message || 'Note saved');
      onSave(note);
    } catch (err) {
      handleError(err.response?.data?.error || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm("Are you sure you want to delete this note?");
    if (!confirm) return;

    try {
      setDeleting(true);
    const res = await axios.delete(
        `${import.meta.env.VITE_API_URI}/${apiBase}/note/${domain}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      handleSuccess(res.data.message || 'Note deleted successfully'); 
      setNote('');
      onSave(''); // notify parent
    } catch (err) {
      handleError(err.response?.data?.error || 'Failed to delete note'); 
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="note-editor">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write your note here..."
        rows={2}
        className="note-textarea"
      />
      <div className="note-actions">
        <button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save'}
        </button>
        {note && (
          <button onClick={handleDelete} disabled={deleting} className="delete-btn">
            {deleting ? 'Deleting...' : '🗑️ Delete'}
          </button>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
