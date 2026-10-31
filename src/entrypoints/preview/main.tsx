import './shim';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces';
import '../../styles/tokens.css';
import '../../styles/base.css';
import '../../styles/surface.css';

// Static import would hoist the App chunk (and wxt/browser init) above the
// shim. Deferred, the storage shim is definitely installed first.
const root = document.getElementById('root')!;
void import('../../App')
  .then(({ default: App }) => {
    createRoot(root).render(<App />);
  })
  .catch((err) => {
    console.error('PREVIEW', err);
    document.body.textContent = `Preview failed: ${String(err)}`;
  });
