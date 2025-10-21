import React, { useEffect } from 'react';

export default function Notification({ message, type, onDismiss }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 3000); // Notification disappears after 3 seconds

        return () => clearTimeout(timer);
    }, [onDismiss]);

    const baseClasses = 'fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white font-semibold transition-all duration-300 z-50 animate-fade-in';
    const typeClasses = {
        success: 'bg-green-600',
        error: 'bg-red-600',
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            {message}
        </div>
    );
}

