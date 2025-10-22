import React, { useEffect, useState } from 'react';

export default function Notification({ message, type, show, onDismiss }) {
    const [isShowing, setIsShowing] = useState(false);

    useEffect(() => {
        if (show) {
            const showTimer = setTimeout(() => {
                setIsShowing(true);
            }, 50);

            const dismissTimer = setTimeout(() => {
                setIsShowing(false);
            }, 4000);

            const unmountTimer = setTimeout(() => {
                onDismiss();
            }, 4500);

            return () => {
                clearTimeout(showTimer);
                clearTimeout(dismissTimer);
                clearTimeout(unmountTimer);
            };
        } else {
            setIsShowing(false);
        }
    }, [show, onDismiss]);

    const baseClasses = "fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white transition-all duration-500 ease-in-out transform z-50 max-w-sm";
    const typeClasses = {
        success: "bg-green-600",
        error: "bg-red-600",
    };

    const visibilityClasses = isShowing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0";

    if (!show && !isShowing) return null;

    return (
        <div className={`${baseClasses} ${typeClasses[type]} ${visibilityClasses}`}>
            {message}
        </div>
    );
}

