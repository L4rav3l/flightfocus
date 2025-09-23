import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkauth = async () => {
    if(localStorage.getItem("token"))
    {
      try
      {
        const response = await axios.post("https://flightfocus.marcellh.me/api/auth/verify", {}, {headers: {Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json"}});
        navigate("/dashboard")
      }
      catch(error)
      {
        localStorage.clear();
        alert("Invalid session");
      }
    }
  }
  checkauth();
  });

  const handleLogin = async () => {
    try{
        const response = await axios.post("https://flightfocus.marcellh.me/api/auth/create_session", {email: email});
        localStorage.setItem("session", response.data.session);
        document.getElementById("login").hidden = true;
        document.getElementById("code").hidden = false;
    }
    catch(error)
    {
      if(error.response.status == 409)
      {
        document.getElementById("login").hidden = false;
        document.getElementById("code").hidden = true;
        alert("The email format is incorrect.");
      }
      if(error.response.status == 500)
      {
        document.getElementById("login").hidden = false;
        document.getElementById("code").hidden = true;
        alert("Server error");
      }
    }
  };

  const handleJsonWebToken = async () => {
    try
    {
      var response = await axios.post("https://flightfocus.marcellh.me/api/auth/complete_session", {session: localStorage.getItem("session"), code: code});
      localStorage.setItem("token", response.data);
      navigate("/dashboard");
    }
    catch(error)
    {
      if(error.response.status == 500)
      {
        alert("Server error");
      } else {
        return("The code is wrong.")
      }
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200">
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12 px-8 w-full max-w-5xl">
        <div className="flex flex-col items-center md:items-start animate-fadeInLeft">
          <h1 className="text-4xl font-extrabold mb-6 text-gray-800 drop-shadow-md">
            Your journey begins now!
          </h1>
          <img
            src="/airplane.svg"
            alt="Airplane"
            className="w-40 h-40 animate-bounce-slow"
          />
        </div>

        <div className="shadow-2xl rounded-3xl bg-white/80 backdrop-blur-xl p-8 animate-fadeInUp border border-gray-100" id="login">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-700 tracking-wide">
            Login
          </h2>
          <label className="text-sm font-semibold text-gray-600">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-3 border rounded-xl mt-1 mb-6 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-lg shadow-lg transform transition hover:scale-105"
            onClick={handleLogin}
          >
            Next
          </button>
        </div>

          <div className="shadow-2xl rounded-3xl bg-white/80 backdrop-blur-xl p-8 animate-fadeInUp border border-gray-100" id="code" hidden>
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-700 tracking-wide">
            Authentication with email
          </h2>
          <label className="text-sm font-semibold text-gray-600">Code</label>
          <input
            type="text"
            placeholder="Enter your one time code"
            className="w-full p-3 border rounded-xl mt-1 mb-6 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-lg shadow-lg transform transition hover:scale-105"
            onClick={handleJsonWebToken}
          >
            Login
          </button>
        </div>
      </div>

      <style jsx>{`
        .animate-fadeInLeft {
          animation: fadeInLeft 1s ease forwards;
        }
        .animate-fadeInUp {
          animation: fadeInUp 1s ease forwards;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite;
        }
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }
      `}</style>
    </div>
  );
}
