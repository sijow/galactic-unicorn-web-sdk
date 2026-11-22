/**
 * Simple textarea-based editor for the Lua SDK workspace.
 */

let textarea = null;

// Path of the file currently shown in the editor, or null when empty.
let activeBufferKey = null;

// View state (cursor selection + scroll position) keyed by file path.
const viewStatesByPath = new Map();

/**
 * @param {string} path
 */
function stashViewState(path) {
  if (!textarea) return;

  viewStatesByPath.set(path, {
    selectionStart: textarea.selectionStart,
    selectionEnd: textarea.selectionEnd,
    scrollTop: textarea.scrollTop,
    scrollLeft: textarea.scrollLeft,
  });
}

/**
 * @param {string} path
 */
function restoreViewStateForPath(path) {
  if (!textarea) return;

  const state = viewStatesByPath.get(path);
  if (state !== undefined) {
    textarea.setSelectionRange(state.selectionStart, state.selectionEnd);
    textarea.scrollTop = state.scrollTop;
    textarea.scrollLeft = state.scrollLeft;
  } else {
    textarea.setSelectionRange(0, 0);
    textarea.scrollTop = 0;
    textarea.scrollLeft = 0;
  }
}

export const TextEditor = Object.freeze({
  /**
   * Initialize the textarea editor. Call once at startup.
   *
   * @param {string} defaultTextContent text content to load as the default buffer upon load
   */
  async init(defaultTextContent = "") {
    textarea = document.getElementById("editor-textarea");
    textarea.value = defaultTextContent;

    // Insert 2 spaces when pressing Tab (matching Lua style)
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Tab" && !textarea.readOnly) {
        event.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        textarea.value = value.slice(0, start) + "  " + value.slice(end);
        textarea.setSelectionRange(start + 2, start + 2);
      }
    });

    // Enable the play button after the editor has loaded
    document.getElementById("run-btn").disabled = false;
  },

  /**
   * Open a file buffer, preserving per-path cursor/scroll when revisiting.
   *
   * @param {string} path filesystem path used as the view-state cache key
   * @param {string} text
   * @param {string} _language
   * @param {boolean} readOnly whether to set the editor as read-only
   */
  openBuffer(path, text, _language = "plaintext", readOnly = false) {
    if (!textarea) return;

    if (activeBufferKey !== null) {
      stashViewState(activeBufferKey);
    }

    textarea.value = text;
    textarea.readOnly = readOnly;

    activeBufferKey = path;
    restoreViewStateForPath(path);
    textarea.focus();
  },

  /**
   * Clear the editor without stashing view state (empty / no file open).
   */
  closeBuffer() {
    if (!textarea) return;

    activeBufferKey = null;
    textarea.value = "";
    textarea.readOnly = true;
  },

  /**
   * Move cached view state when a file is renamed.
   *
   * @param {string} oldPath
   * @param {string} newPath
   */
  renameBufferPath(oldPath, newPath) {
    if (viewStatesByPath.has(oldPath)) {
      viewStatesByPath.set(newPath, viewStatesByPath.get(oldPath));
      viewStatesByPath.delete(oldPath);
    }

    if (activeBufferKey === oldPath) {
      activeBufferKey = newPath;
    }
  },

  /**
   * Drop cached view state for a removed file.
   *
   * @param {string} path
   */
  forgetBufferPath(path) {
    viewStatesByPath.delete(path);

    if (activeBufferKey === path) {
      activeBufferKey = null;
    }
  },

  /**
   * Append a trailing newline in the buffer when missing, preserving
   * selection and scroll position.
   */
  ensureFinalNewLine() {
    if (!textarea || textarea.value.endsWith("\n")) {
      return;
    }

    const { selectionStart, selectionEnd, scrollTop, scrollLeft } = textarea;
    textarea.value += "\n";
    textarea.setSelectionRange(selectionStart, selectionEnd);
    textarea.scrollTop = scrollTop;
    textarea.scrollLeft = scrollLeft;
  },

  /**
   * Get the currently open buffer in the editor.
   * @returns {string} the open buffer in the editor
   */
  getText() {
    if (!textarea) return "";

    return textarea.value;
  },
});
