import 'bootstrap/dist/css/bootstrap.min.css';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import React from 'react';
import './App.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import MainView from './views/main-view';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

interface AppProps {

}

const network = 'http://127.0.0.1:8899';
const supportedWallets = [ new PhantomWalletAdapter() ];

const App: React.FC<AppProps> = () => {
    return (
        <ConnectionProvider endpoint={network}>
            <WalletProvider wallets={supportedWallets} autoConnect>
                <WalletModalProvider>
                    <div className='App'>
                        <MainView network={network} />
                    </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default App;

