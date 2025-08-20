import React, { useState } from "react";

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123") {
      onLoginSuccess(); // Call the function passed by App.tsx to change the login state
      setLoginError("");
    } else {
      setLoginError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0095D4] to-[#003578] flex items-center justify-center p-4 font-sans">
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-blue-100">
        <div className="text-center mb-6">
          {/* Logo de la aplicación, ahora como imagen normal en la parte superior central */}
          <img
            src="/LOGO.png"
            alt="Logo de la Aplicación"
            className="h-20 w-auto mx-auto block mb-3" // Tamaño y centrado como imagen, y margen inferior
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/80x80/cccccc/ffffff?text=LOGO";
              e.currentTarget.onerror = null;
            }}
          />
          {/* El título principal se mantiene debajo del logo */}
          <h1 className="text-2xl font-extrabold text-gray-800">
            Gestión de Ayudas
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
              placeholder="Ingrese su usuario"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
              placeholder="Ingrese su contraseña"
              required
            />
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#0069B6] text-white py-2 px-4 rounded-xl hover:bg-[#003578] focus:ring-4 focus:ring-[#0095D4] transition-all font-medium transform hover:scale-105 hover:shadow-xl"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-gray-500">
        
        </div>
      </div>
    </div>
  );
};

export default Login;
