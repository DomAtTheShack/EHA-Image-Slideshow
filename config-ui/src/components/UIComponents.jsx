import React from 'react';

export const Section = ({ title, children }) => (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4 border-b border-gray-700 pb-2">{title}</h2>
        {children}
    </div>
);

export const InputField = ({ label, name, value, onChange, type = 'text', step = 'any' }) => (
    <div className="mb-4">
        <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor={name}>{label}</label>
        <input
            id={name} name={name} type={type} value={value} onChange={onChange} step={step}
            className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 border-gray-600 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
    </div>
);

export const SelectField = ({ label, name, value, onChange, children }) => (
    <div className="mb-4">
        <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor={name}>{label}</label>
        <select
            id={name} name={name} value={value} onChange={onChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 border-gray-600 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
            {children}
        </select>
    </div>
);

export const Button = ({ children, onClick, color = 'blue', className = '', disabled = false }) => {
    const colorClasses = {
        blue: 'bg-blue-600 hover:bg-blue-700',
        green: 'bg-green-600 hover:bg-green-700',
        red: 'bg-red-600 hover:bg-red-700',
        gray: 'bg-gray-600 hover:bg-gray-700'
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses[color]} ${className}`}
        >
            {children}
        </button>
    );
};

export const TabButton = ({ children, onClick, isActive }) => (
    <button onClick={onClick} className={`px-6 py-3 font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${isActive ? 'bg-gray-800 text-yellow-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
        {children}
    </button>
);

