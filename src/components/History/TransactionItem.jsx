import React from 'react';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

function TransactionItem({ transaction, onViewTransaction, onTransactionAction }) {
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

  const getStatusConfig = (status) => {
    switch(status) {
      case 'completed':
        return {
          text: 'Selesai',
          icon: <CheckCircle size={16} />,
          className: 'status-completed'
        };
      case 'pending':
        return {
          text: 'Pending',
          icon: <Clock size={16} />,
          className: 'status-pending'
        };
      case 'cancelled':
        return {
          text: 'Dibatalkan',
          icon: <XCircle size={16} />,
          className: 'status-cancelled'
        };
      default:
        return {
          text: status,
          icon: null,
          className: 'status-default'
        };
    }
  };

  const getActionButtons = (status, transactionId) => {
    switch(status) {
      case 'completed':
        return (
          <>
            <button 
              className="action-button secondary"
              onClick={() => onTransactionAction(transactionId, 'buy-again')}
            >
              Beli Lagi
            </button>
            <button 
              className="action-button primary"
              onClick={() => onTransactionAction(transactionId, 'review')}
            >
              Review
            </button>
          </>
        );
      case 'pending':
        return (
          <>
            <button 
              className="action-button danger"
              onClick={() => onTransactionAction(transactionId, 'cancel')}
            >
              Batalkan
            </button>
            <button 
              className="action-button primary"
              onClick={() => onTransactionAction(transactionId, 'track')}
            >
              Lacak
            </button>
          </>
        );
      case 'cancelled':
        return (
          <button 
            className="action-button primary"
            onClick={() => onTransactionAction(transactionId, 'buy-again')}
          >
            Beli Lagi
          </button>
        );
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig(transaction.status);

  return (
    <div className={`transaction-item ${transaction.status}`}>
      <div className="transaction-header">
        <div className="transaction-info">
          <div className="transaction-id">{transaction.id}</div>
          <div className="transaction-date">{formatDate(transaction.date)}</div>
        </div>
        <div className="transaction-actions">
          <div className={`transaction-status ${statusConfig.className}`}>
            {statusConfig.icon}
            <span>{statusConfig.text}</span>
          </div>
          <button 
            className="view-button"
            onClick={() => onViewTransaction(transaction.id)}
          >
            <Eye size={16} />
          </button>
        </div>
      </div>
      
      <div className="transaction-items">
        {transaction.items.map((item, index) => (
          <div key={`${transaction.id}-${index}`} className="item-row">
            <div className="item-icon">{item.icon}</div>
            <div className="item-details">
              <div className="item-name">{item.name}</div>
              <div className="item-description">
                {item.description} 
                {item.quantity > 1 && (
                  <span className="item-quantity"> × {item.quantity}</span>
                )}
              </div>
            </div>
            <div className="item-price">
              {formatCurrency(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="transaction-footer">
        <div className="total-amount">
          <span className="total-label">Total: </span>
          <span className="total-value">{formatCurrency(transaction.total)}</span>
        </div>
        <div className="action-buttons">
          {getActionButtons(transaction.status, transaction.id)}
        </div>
      </div>
    </div>
  );
}

export default TransactionItem;