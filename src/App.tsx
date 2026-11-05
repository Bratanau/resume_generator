import React, { useState } from 'react';
import { SimpleChatView } from './components/SimpleChatView';
import OldApp from './old/OldApp';

export default function App() {
  // Toggle between the new simplified Gemini Chat version (default, white background)
  // and the preserved full B2B SaaS CRM version (in src/old/)
  const [appVersion, setAppVersion] = useState<'simple' | 'old'>('simple');

  if (appVersion === 'old') {
    return <OldApp onSwitchToSimple={() => setAppVersion('simple')} />;
  }

  return (
    <SimpleChatView onSwitchToOldVersion={() => setAppVersion('old')} />
  );
}
