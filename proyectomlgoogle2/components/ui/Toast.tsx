
import React from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const icons = {
  success: <CheckCircle className="text-green-500" />,
  error: <XCircle className="text-red-500" />,
  info: <Info className="text-blue-500" />,
};

const bgColors = {
  success: 'bg-green-100 dark:bg-green-900 border-green-400',
  error: 'bg-red-100 dark:bg-red-900 border-red-400',
  info: 'bg-blue-100 dark:bg-blue-900 border-blue-400',
};

const textColors = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    info: 'text-blue-800 dark:text-blue-200',
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  return (
    <div className={`flex items-center p-4 rounded-lg shadow-lg border-l-4 ${bgColors[type]}`} role="alert">
      <div className="mr-3">{icons[type]}</div>
      <p className={`text-sm font-medium ${textColors[type]}`}>{message}</p>
      <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
};

export default Toast;
