import { useState, useRef, useCallback } from "react";

export function useEditableNode(onSaveCallback) {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const initialNameRef = useRef("");
  const nameRef = useRef("");
  const hasSavedRef = useRef(false);

  const startEditing = useCallback((id, currentName) => {
    hasSavedRef.current = false;
    initialNameRef.current = currentName;
    nameRef.current = currentName;
    setEditingId(id);
    setEditingName(currentName);
  }, []);

  const saveEditing = useCallback(() => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    const finalName = nameRef.current.trim();
    if (editingId && finalName !== initialNameRef.current) {
      onSaveCallback(editingId, finalName);
    }
    setEditingId(null);
  }, [editingId, onSaveCallback]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      saveEditing(); 
    }
    if (e.key === 'Escape') { 
      hasSavedRef.current = true; 
      setEditingId(null); 
    }
  }, [saveEditing]);

  return { 
    editingId, 
    editingName, 
    setEditingName, 
    nameRef, 
    startEditing, 
    saveEditing, 
    handleKeyDown 
  };
}
