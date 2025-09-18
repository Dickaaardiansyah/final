// src/components/History/HistoryTimeline.jsx
import React from 'react';

function HistoryTimeline({ transactions, onViewTransaction }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('id-ID', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return 'Selesai';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <div className="empty-title">Oops, You still have no History</div>
      </div>
    );
  }

  return (
    <div className="history-timeline">
      {transactions.map(transaction => (
        <div 
          key={transaction.id}
          className={`timeline-item ${transaction.status}`}
          onClick={() => onViewTransaction(transaction.id)}
        >
          <div className="timeline-header">
            <div>
              <div className="transaction-id">{transaction.id}</div>
              <div className="transaction-date">{formatDate(transaction.date)}</div>
            </div>
            <div className={`transaction-status status-${transaction.status}`}>
              {getStatusText(transaction.status)}
            </div>
          </div>
          
          <div className="transaction-items">
            {transaction.items.map(item => (
              <div key={`${transaction.id}-${item.name}`} className="item-row">
                <div className="item-icon">{item.icon}</div>
                <div className="item-details">
                  <div className="item-name">{item.name}</div>
                  <div className="item-description">
                    {item.description} {item.quantity > 1 ? `(${item.quantity}x)` : ''}
                  </div>
                </div>
                <div className="item-price">{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>
          
          <div className="transaction-footer">
            <div className="total-amount">Total: {formatCurrency(transaction.total)}</div>
            <div className="action-buttons">
              {transaction.status === 'completed' ? (
                <>
                  <button className="action-button">Beli Lagi</button>
                  <button className="action-button primary">Review</button>
                </>
              ) : transaction.status === 'pending' ? (
                <>
                  <button className="action-button">Batalkan</button>
                  <button className="action-button primary">Lacak</button>
                </>
              ) : (
                <button className="action-button primary">Beli Lagi</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default HistoryTimeline;