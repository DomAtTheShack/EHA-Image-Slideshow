import React from 'react';
import { Button } from './UIComponents';

export default function Modal({ title, message, onConfirm, onCancel, children, hideButtons = false }) {
    // Prevent background scrolling when modal is open
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">{title}</h2>

                {/* Always render children if provided */}
                {children && <div className="mb-6">{children}</div>}

                {/* Render message only if no children */}
                {!children && <p className="text-gray-300 mb-6">{message}</p>}

                {/* Buttons section */}
                {!hideButtons && (
                    <div className="flex justify-end gap-4">
                        {onCancel && <Button onClick={onCancel} color="gray">Cancel</Button>}
                        {onConfirm && <Button onClick={onConfirm} color="red">Confirm</Button>}
                    </div>
                )}
            </div>
        </div>
    );
}
