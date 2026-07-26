'use client';

import React, { useState, useEffect } from 'react';

interface TradeTabProps {
  mainAddress: string;
  mainBalance: string;
  connected: boolean;
}

export default function TradeTab({ mainAddress, mainBalance, connected }: TradeTabProps) {
  const [activated, setActivated] = useState<boolean>(false);
  const [loadingPayload, setLoadingPayload] = useState<boolean>(false);
  const [payloadId, setPayloadId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const isAct = localStorage.getItem('tgb_masterstroke_activated') === 'true';
    if (isAct) {
      setActivated(true);
    }
  }, []);

  const handleCreatePayload = async () => {
    if (!connected || !mainAddress) {
      setErrorMessage('Connect Xaman Wallet first');
      return;
    }
    setErrorMessage(null);
    setLoadingPayload(true);
    try {
      const res = await fetch('/api/xaman/payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '20',
          currency: 'USD',
          userAddress: mainAddress,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate $20 USD activation payload');
      }

      const data = await res.json();
      if (data.payload_id) {
        setPayloadId(data.payload_id);
        setQrUrl(data.qr_png || null);
        setDeepLink(data.next_url || null);
      } else {
        throw new Error('Invalid response from Xaman API');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error initializing paywall');
    } finally {
      setLoadingPayload(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!payloadId) return;
    setVerifying(true);
    setErrorMessage(null);
    try {
      const res = await fetch(/api/xaman/verify?payload_id=${payloadId});
      if (!res.ok) {
        throw new Error('Verification request failed');
      }

      const data = await res.json();
      if (data.signed || data.verified) {
        localStorage.setItem('tgb_masterstroke_activated', 'true');
        setActivated(true);
      } else {
        setErrorMessage('Payment signature not detected yet. Please sign in Xaman.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error verifying payload signature');
    } finally {
      setVerifying(false);
    }
  };

  if (!activated) {
    return (
      
        <h2 className="text-xl font-bold text-white mb-2">Tactical Masterstroke Engine
        <p className="text-sm text-zinc-400 mb-6">
          Activation required. Submit $20 USD authorization via Xaman to unlock persistent local vault trading
        

        {!connected ? (
          <div className="w-full p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg mb-4">
            Connect Xaman Wallet First
          
        ) : (
          
            {!payloadId ? (
              <button
                onClick={handleCreatePayload}
                disabled={loadingPayload}
                className="w-full py-3 px-4 bg-white text-black font-semibold text-sm rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {loadingPayload ? 'Generating Payload...' : 'Pay $20 USD via Xaman'}
              
            ) : (
              <div className="w-full flex flex-col items-center gap-4 border-t border-zinc-800 pt-4">
                {qrUrl && (
                  <img src={qrUrl} alt="Xaman Payload QR" className="w-48 h-48 border border-zinc-700 rounded-lg" />
                )}

                {deepLink && (
                  <a
                    href={deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-zinc-800 text-white font-medium text-sm rounded-lg text-center hover:bg-zinc-700 transition-colors"
                  >
                    Open in Xaman App
                  
                )}

                <button
                  onClick={handleVerifyPayment}
                  disabled={verifying}
                  className="w-full py-3 px-4 bg-white text-black font-semibold text-sm rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {verifying ? 'Verifying Signature...' : 'Verify Payment'}
                
              
            )}
          
        )}

        {errorMessage && (
          
            {errorMessage}
          
        )}
      
    );
  }

  return (
    
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <h3 className="text-lg font-bold text-white mb-1">Masterstroke Control Active
        <p className="text-xs text-zinc-400">
          Connected: {mainAddress ? ${mainAddress.slice(0, 6)}...${mainAddress.slice(-4)} : 'N/A'}
        
      
    
  );
}