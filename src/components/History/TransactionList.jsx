import React from 'react';
import TransactionItem from './TransactionItem';
import EmptyState from './EmptyState';

function TransactionList({ transactions, onViewTransaction, onTransactionAction }) {
  if (transactions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="transaction-list">
      <h3 className="list-title">Riwayat Transaksi</h3>
      <div className="transaction-items">
        {transactions.map(transaction => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onViewTransaction={onViewTransaction}
            onTransactionAction={onTransactionAction}
          />
        ))}
      </div>
    </div>
  );
}

export default TransactionList;