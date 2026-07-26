import React, { useState } from 'react';
import Image from 'next/image';

interface TradeTabProps {
  connected?: boolean;
  mainAddress?: string;
  mainBalance?: string;
  user?: any;
}

export function TradeTab({ mainAddress, mainBalance, connected, user }: TradeTabProps) {
  const [payload, setPayload] = useState<
    | { uuid: string; qr_png?: string; deeplink?: string; always?: string }
    | null
  >(null);

  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

  const handleCreatePayload = async () => {
    try {
      const res = await fetch('/api/xaman/payload', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPayload({
          uuid: data.uuid,
          qr_png: data.qr_png,
          deeplink: data.deeplink,
          always: data.always
        });
        // Mobile redirect to deep link
        if (isMobile && (data.always || data.deeplink)) {
          window.location.href = data.always || data.deeplink;
        }
      } else {
        console.error('Xaman payload error', data.error);
      }
    } catch (err) {
      console.error('Failed to create Xaman payload', err);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-2">Trade Tab</h3>
      <p>Main Address: {mainAddress}</p>
      <p>Main Balance: {mainBalance}</p>
      <p>Connected: {connected ? 'Yes' : 'No'}</p>
      {user && <p>User: {JSON.stringify(user)}</p>}

      <button
        onClick={handleCreatePayload}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Sign In with Xaman
      </button>

      {payload && (
        <div className="mt-4">
          <p>Payload UUID: {payload.uuid}</p>
          {payload.qr_png && (
            <Image src={payload.qr_png} alt="Xaman QR" width={200} height={200} />
          )}
          {payload.deeplink && (
            <p className="mt-2">
              Deep Link:{' '}
              <a href={payload.deeplink} target="_blank" rel="noopener noreferrer">
                {payload.deeplink}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TradeTab;
