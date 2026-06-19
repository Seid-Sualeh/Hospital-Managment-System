import React from 'react';
import Loader from './Loader';
import EmptyState from './EmptyState';

const getColumnKey = (col, index) => col.key || col.header || `col-${index}`;

const DataTable = ({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription,
  onRowClick,
  rowKey = 'id',
  actions,
}) => {
  if (loading) {
    return <Loader message="Loading data..." />;
  }

  if (!data?.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="table-responsive">
      <table className="table mc-table mb-0">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={getColumnKey(col, index)} className={col.className || ''}>
                {col.label || col.header}
              </th>
            ))}
            {actions && <th className="text-end">Action</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row[rowKey] ?? idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {columns.map((col, index) => (
                <td key={getColumnKey(col, index)} className={col.className || ''}>
                  {col.render ? col.render(row) : row[col.key || col.header]}
                </td>
              ))}
              {actions && (
                <td className="text-end" onClick={(e) => e.stopPropagation()}>
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
