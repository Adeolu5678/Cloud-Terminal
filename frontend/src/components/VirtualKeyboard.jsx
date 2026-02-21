const KEYS = [
  { label: 'ESC', value: '\u001b' },
  { label: 'TAB', value: '\t' },
  { label: 'CTRL+C', value: '\u0003' },
  { label: '↑', value: '\u001b[A' },
  { label: '↓', value: '\u001b[B' },
  { label: '←', value: '\u001b[D' },
  { label: '→', value: '\u001b[C' },
]

function VirtualKeyboard({ onSend }) {
  return (
    <div className="virtual-keyboard">
      {KEYS.map((keyItem) => (
        <button type="button" key={keyItem.label} onClick={() => onSend(keyItem.value)}>
          {keyItem.label}
        </button>
      ))}
    </div>
  )
}

export default VirtualKeyboard
