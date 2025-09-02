import React from 'react';
import './SelectorInput.css';
interface SelectorInputProps {
    initialSelector?: string;
    onSelectorChange?: (selector: string) => void;
    onGo?: () => void;
    onStop?: () => void;
    going?: boolean;
    className?: string;
}
declare const SelectorInput: React.FC<SelectorInputProps>;
export default SelectorInput;
