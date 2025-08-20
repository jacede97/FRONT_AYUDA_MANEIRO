import React, { useEffect } from "react";

const Alert = ({ message, type, setAlert }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      setAlert({ show: false, message: "", type: "" });
    }, 5000);

    return () => clearTimeout(timer);
  }, [message, type, setAlert]);

  const alertClasses = {
    success: "bg-green-100 border-green-400 text-green-700",
    error: "bg-red-100 border-red-400 text-red-700",
    warning: "bg-yellow-100 border-yellow-400 text-yellow-700",
    info: "bg-blue-100 border-blue-400 text-blue-700",
  };

  const selectedClasses =
    alertClasses[type] || "bg-gray-100 border-gray-400 text-gray-700";

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${selectedClasses}`}
      role="alert"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-3">
          {type === "success" && (
            <svg
              className="h-5 w-5 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {type === "error" && (
            <svg
              className="h-5 w-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {type === "warning" && (
            <svg
              className="h-5 w-5 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0L14.717 7.6a4 4 0 01-.892 4.093l-4.787 4.787a4 4 0 01-5.656 0l-4.787-4.787A4 4 0 011.283 7.6L8.257 3.099zM10 13a1 1 0 100-2 1 1 0 000 2zm0-4a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {type === "info" && (
            <svg
              className="h-5 w-5 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 2a1 1 0 100 2h.01a1 1 0 100-2H10z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div>
          <p className="font-bold text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default Alert;
