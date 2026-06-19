// Global state
let currentNoteId = null;
let notes = [];

// DOM Elements
const notesContainer = document.getElementById('notesContainer');
const noteEditor = document.getElementById('noteEditor');
const modal = document.getElementById('noteModal');
const modalTitle = document.getElementById('modalTitle');
const noteForm = document.getElementById('noteForm');
const noteIdInput = document.getElementById('noteId');
const noteTitleInput = document.getElementById('noteTitle');
const noteContentInput = document.getElementById('noteContent');
const newNoteBtn = document.getElementById('newNoteBtn');
const closeModal = document.querySelector('.close');

// Fetch all notes
async function loadNotes() {
    try {
        const response = await fetch('/api/notes');
        notes = await response.json();
        renderNotesList();
        
        // Select first note if available
        if (notes.length > 0 && !currentNoteId) {
            selectNote(notes[0].id);
        }
    } catch (error) {
        console.error('Error loading notes:', error);
    }
}

// Render notes list
function renderNotesList() {
    if (notes.length === 0) {
        notesContainer.innerHTML = `
            <div class="empty-state" style="padding: 20px; text-align: center;">
                <p style="font-size: 14px; color: #bdc3c7;">No notes yet</p>
                <p style="font-size: 12px; color: #bdc3c7;">Create your first note!</p>
            </div>
        `;
        return;
    }

    notesContainer.innerHTML = notes.map(note => `
        <div class="note-item ${note.id === currentNoteId ? 'active' : ''}" 
             onclick="selectNote(${note.id})">
            <div class="note-item-title">${escapeHtml(note.title) || 'Untitled'}</div>
            <div class="note-item-preview">${escapeHtml(note.content.substring(0, 60)) || 'Empty note'}</div>
            <div class="note-item-date">${formatDate(note.updated_at)}</div>
            <div class="note-item-actions">
                <button class="btn-edit" onclick="event.stopPropagation(); openEditNote(${note.id})">Edit</button>
                <button class="btn-danger" onclick="event.stopPropagation(); deleteNote(${note.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Select a note to view
function selectNote(noteId) {
    currentNoteId = noteId;
    const note = notes.find(n => n.id === noteId);
    
    if (note) {
        renderNoteView(note);
        renderNotesList(); // Update active state
    }
}

// Render note view
function renderNoteView(note) {
    noteEditor.innerHTML = `
        <div class="note-view">
            <div class="note-view-title">${escapeHtml(note.title) || 'Untitled'}</div>
            <div class="note-view-date">Updated: ${formatDate(note.updated_at)}</div>
            <div class="note-view-content">${escapeHtml(note.content) || 'Empty note'}</div>
            <div class="note-view-actions">
                <button class="btn-edit" onclick="openEditNote(${note.id})">✏️ Edit Note</button>
                <button class="btn-danger" onclick="deleteNote(${note.id})">🗑️ Delete Note</button>
            </div>
        </div>
    `;
}

// Open modal for new note
function openNewNote() {
    modalTitle.textContent = 'New Note';
    noteIdInput.value = '';
    noteTitleInput.value = '';
    noteContentInput.value = '';
    modal.style.display = 'block';
    noteTitleInput.focus();
}

// Open modal for editing note
function openEditNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    modalTitle.textContent = 'Edit Note';
    noteIdInput.value = note.id;
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
    modal.style.display = 'block';
    noteTitleInput.focus();
}

// Close modal
function closeModalFunc() {
    modal.style.display = 'none';
}

// Save note (create or update)
async function saveNote(event) {
    event.preventDefault();
    
    const id = noteIdInput.value;
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    
    if (!title || !content) {
        alert('Please fill in both title and content.');
        return;
    }
    
    try {
        let response;
        let savedNote;
        
        if (id) {
            // Update existing note
            response = await fetch(`/api/notes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content })
            });
            savedNote = await response.json();
            
            // Update in local array
            const index = notes.findIndex(n => n.id === parseInt(id));
            if (index !== -1) {
                notes[index] = savedNote;
            }
        } else {
            // Create new note
            response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content })
            });
            savedNote = await response.json();
            notes.push(savedNote);
        }
        
        // Close modal and refresh UI
        closeModalFunc();
        renderNotesList();
        selectNote(savedNote.id);
        
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Failed to save note. Please try again.');
    }
}

// Delete note
async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from local array
            notes = notes.filter(n => n.id !== noteId);
            
            // Clear view if current note was deleted
            if (currentNoteId === noteId) {
                currentNoteId = null;
                noteEditor.innerHTML = `
                    <div class="empty-state">
                        <p>📄 Select a note to view or edit</p>
                        <p class="empty-sub">Or click "New Note" to create one</p>
                    </div>
                `;
            }
            
            renderNotesList();
            
            // Select first note if available
            if (notes.length > 0 && !currentNoteId) {
                selectNote(notes[0].id);
            }
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note. Please try again.');
    }
}

// Utility: Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility: Format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Event Listeners
newNoteBtn.addEventListener('click', openNewNote);
closeModal.addEventListener('click', closeModalFunc);
noteForm.addEventListener('submit', saveNote);

// Close modal on outside click
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModalFunc();
    }
});

// Close modal on ESC key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModalFunc();
    }
});

// Load notes on page load
document.addEventListener('DOMContentLoaded', loadNotes);
