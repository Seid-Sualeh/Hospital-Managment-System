import React from 'react';

const TabPills = ({ tabs, activeId, onChange }) => {
  return (
    <ul className="mc-tab-pills">
      {tabs.map((tab) => (
        <li key={tab.id}>
          <button
            type="button"
            className={`mc-tab-btn ${activeId === tab.id ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default TabPills;
