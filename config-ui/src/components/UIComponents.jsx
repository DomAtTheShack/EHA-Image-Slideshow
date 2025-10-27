import React from 'react';

// Reusable component for section layout
export const Section = ({ title, children }) => (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8 animate-fade-in">
        {title && <h2 className="text-2xl font-bold text-yellow-400 mb-4 border-b border-gray-700 pb-2">{title}</h2>}
        {children}
    </div>
);

// Reusable Input Field component
export const InputField = ({ label, name, value, onChange, type = 'text', step = 'any', placeholder = '' }) => (
    <div className="w-full mb-4">
        {label && <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor={name}>{label}</label>}
        <input
            id={name} name={name} type={type} value={value} onChange={onChange} step={step} placeholder={placeholder}
            className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-600 border-gray-500 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
    </div>
);

// Reusable Select Field component
export const SelectField = ({ label, name, value, onChange, children }) => (
    <div className="w-full mb-4">
        {label && <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor={name}>{label}</label>}
        <select
            id={name} name={name} value={value} onChange={onChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-600 border-gray-500 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
            {children}
        </select>
    </div>
);

// Reusable Button component with different color styles and disabled state
export const Button = ({ children, onClick, color = 'blue', className = '', disabled = false }) => {
    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        gray: 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-400',
    };
    const disabledClasses = 'opacity-50 cursor-not-allowed';
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 text-white transition-all duration-200 transform hover:scale-105 ${colorClasses[color]} ${className} ${disabled ? disabledClasses : ''}`}
        >
            {children}
        </button>
    );
};

// Reusable Tab Button component for navigation
export const TabButton = ({ children, onClick, isActive }) => (
    <button onClick={onClick} className={`px-4 py-2 font-medium text-sm rounded-t-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 ${isActive ? 'bg-gray-800 text-yellow-300 border-b-2 border-yellow-300' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
        {children}
    </button>
);

