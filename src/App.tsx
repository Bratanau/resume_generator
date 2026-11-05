import React, { useState, useEffect } from 'react';
import { SimpleChatView } from './components/SimpleChatView';
import { PublicResumeView } from './components/PublicResumeView';
import OldApp from './old/OldApp';

export default function App() {
  const [appVersion, setAppVersion] = useState<'simple' | 'old'>('simple');
  const [resumeLinkId, setResumeLinkId] = useState<string | null>(null);

  useEffect(() => {
    // Check if URL has ?r=linkId query parameter or #r=linkId hash
    const searchParams = new URLSearchParams(window.location.search);
    const rQuery = searchParams.get('r');
    if (rQuery) {
      setResumeLinkId(rQuery);
      return;
    }

    const hash = window.location.hash;
    if (hash && hash.startsWith('#r=')) {
      setResumeLinkId(hash.replace('#r=', ''));
    }
  }, []);

  // If viewing via unique employer apply link (?r=...)
  if (resumeLinkId) {
    return (
      <PublicResumeView
        linkId={resumeLinkId}
        onBackToApp={() => {
          // Clear query param and return to candidate chat app
          window.history.pushState({}, '', window.location.pathname);
          setResumeLinkId(null);
        }}
      />
    );
  }

  // Toggle between the new simplified Gemini Chat version (default, white background)
  // and the preserved full B2B SaaS CRM version (in src/old/)
  if (appVersion === 'old') {
    return <OldApp onSwitchToSimple={() => setAppVersion('simple')} />;
  }

  return (
    <SimpleChatView 
      onSwitchToOldVersion={() => setAppVersion('old')}
      onOpenEmployerResume={(id) => setResumeLinkId(id)}
    />
  );
}

