import React from 'react';
import { Button } from './UIComponents';

export default function Modal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 animate-fade-in">
                <h3 className="text-2xl font-bold text-yellow-400 mb-4">{title}</h3>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <Button onClick={onCancel} color="gray">Cancel</Button>
                    <Button onClick={onConfirm} color="red">Confirm</Button>
                </div>
            </div>
        </div>
    );
}

