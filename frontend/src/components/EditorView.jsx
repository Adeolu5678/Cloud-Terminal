import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { Save } from "lucide-react";

export function EditorView({ fileNode, serverId, onContentChange, defaultContent = "" }) {
  const { fsRead, fsWrite } = useAppContext();
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(!defaultContent);
  const [error, setError] = useState(null);
  const [savedContent, setSavedContent] = useState(defaultContent);

  useEffect(() => {
    let isMounted = true;
    if (!defaultContent) {
      setLoading(true);
      fsRead(serverId, fileNode.path)
        .then(res => {
          if (isMounted) {
            setContent(res.content);
            setSavedContent(res.content);
            setLoading(false);
          }
        })
        .catch(err => {
          if (isMounted) {
            setError(err.message);
            setLoading(false);
          }
        });
    }
    return () => { isMounted = false; };
  }, [fileNode.path, serverId]);

  const handleChange = (e) => {
    const newVal = e.target.value;
    setContent(newVal);
    onContentChange(newVal !== savedContent);
  };

  const handleSave = async () => {
    try {
      await fsWrite(serverId, fileNode.path, content);
      setSavedContent(content);
      onContentChange(false);
    } catch (err) {
      alert("Failed to save: " + err.message);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  if (loading) return <div className="p-4 text-slate-500 font-mono text-xs">Loading {fileNode.name}...</div>;
  if (error) return <div className="p-4 text-red-500 font-mono text-xs">Error: {error}</div>;

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e]">
      <textarea
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck="false"
        className="flex-1 w-full p-4 bg-transparent text-slate-300 font-mono text-sm resize-none focus:outline-none custom-scrollbar"
        style={{ whiteSpace: 'pre', tabSize: 2 }}
      />
    </div>
  );
}
