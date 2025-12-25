"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';
import './Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">
              ⚖️ Encrypted Weight Trend System
            </h1>
          </div>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

