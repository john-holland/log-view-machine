import React from 'react';
import './WaveTabs.css';
interface WaveTabsProps {
    initialActiveTab?: string;
    onTabChange?: (tabId: string) => void;
    className?: string;
}
declare const WaveTabs: React.FC<WaveTabsProps>;
export default WaveTabs;
