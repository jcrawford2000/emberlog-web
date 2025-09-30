import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-primary mb-4">
        My Awesome App Template!
      </h1>
      <p className="mb-6 text-accent">Powered by Vite, React, TS, Tailwind, DaisyUI</p>
      <button className="btn btn-primary">Click Me (DaisyUI Button)</button>
      <div className="mt-4 p-4 bg-neutral text-neutral-content rounded-md">
        <p>Check out `import.meta.env.VITE_API_BASE_URL`:</p>
        <p className="font-mono">{import.meta.env.VITE_API_BASE_URL || 'Not Set'}</p>
      </div>
    </div>
  )
}
export default App

/*
* Defaualt App.tsx from Vite 

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </>
  );
}

export default App;
*/
