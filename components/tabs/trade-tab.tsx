import React from 'react';

interface TradeTabProps {
  mainAddress: string;
  mainBalance: string;
  connected: boolean;
}

export default function TradeTab({ mainAddress, mainBalance, connected }: TradeTabProps) {
  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-2">Trade Tab</h3>
      <p>Main Address: {mainAddress}</p>
      <p>Main Balance: {mainBalance}</p>
      <p>Connected: {connected ? 'Yes' : 'No'}</p>
    </div>
  );
}
