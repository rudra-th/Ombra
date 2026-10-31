import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces';
import '../../styles/tokens.css';
import '../../styles/base.css';
import '../../styles/surface.css';
import App from '../../App';

createRoot(document.getElementById('root')!).render(<App />);
