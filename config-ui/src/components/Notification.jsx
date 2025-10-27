import React, { useEffect, useState } from 'react';

export default function Notification({ message, type = 'success', onDismiss }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Trigger slide-in
        setVisible(true);

        // Auto-dismiss after 3 seconds
        const timer = setTimeout(() => {
            setVisible(false); // trigger slide-out
            setTimeout(() => onDismiss?.(), 300); // remove after animation
        }, 3000);

        return () => clearTimeout(timer);
    }, [onDismiss]);

    const typeClasses = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
    };

    return (
        <div
            className={`
                fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white max-w-sm z-50
                transform transition-all duration-300 ease-in-out
                ${typeClasses[type]}
                ${visible ? 'translate-x-0 opacity-100' : 'translate-x-32 opacity-0'}
            `}
        >
            {message}
            <button
                onClick={() => {
                    setVisible(false);
                    setTimeout(() => onDismiss?.(), 300);
                }}
                className="absolute top-1 right-2 text-lg font-bold leading-none"
            >
                &times;
            </button>
        </div>
    );
}
