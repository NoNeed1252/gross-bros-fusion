import React from 'react';

interface TradeTabProps {
  connected?: boolean;
  mainAddress?: string;
  mainBalance?: string;
  user?: any;
}

export function TradeTab({ mainAddress, mainBalance, connected, user }: TradeTabProps) {
  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-2">Trade Tab</h3>
      <p>Main Address: {mainAddress}</p>
      <p>Main Balance: {mainBalance}</p>
      <p>Connected: {connected ? 'Yes' : 'No'}</p>
      {user && <p>User: {JSON.stringify(user)}</p>}
    </div>
  );
}

export default TradeTab;
