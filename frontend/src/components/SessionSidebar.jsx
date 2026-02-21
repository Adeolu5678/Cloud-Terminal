function SessionSidebar({ windows, onSwitch, onRefresh }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Sessions</h2>
        <button type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <ul>
        {windows.map((windowItem) => (
          <li key={windowItem.index}>
            <button
              type="button"
              className={windowItem.active ? 'active' : ''}
              onClick={() => onSwitch(windowItem.index)}
            >
              {windowItem.index}: {windowItem.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default SessionSidebar
