import React from 'react';
import './App.css';
import MainView from './views/main-view';

interface AppProps {

}

const App: React.FC<AppProps> = () => {
  return (
    <div className="App">
      <MainView/>
    </div>
  );
}

export default App;
