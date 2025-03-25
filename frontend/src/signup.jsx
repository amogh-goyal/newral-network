import { useState } from "react";
import { motion } from "framer-motion";

function BackgroundGrid() {
    const gridSize = 15;
    const cells = Array.from({ length: gridSize * gridSize });

    return (
        <div className="fixed top-0 left-0 w-screen h-screen pointer-events-auto" style={{ zIndex: 1 }}>
            <div 
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0
                }}
            >
                {cells.map((_, index) => (
                    <div
                        key={index}
                        style={{
                            border: '0.5px solid rgba(255, 255, 255, 0.2)',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.3)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function Signup() {
    const [setup, setSetup] = useState("sign in");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username,setUsername] = useState("")
    const [response, setResponse] = useState({});

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950 text-white">
            <BackgroundGrid />
            <div className="relative z-10 w-full max-w-2xl mx-auto">
                <motion.div
                    className="w-full p-8 bg-gray-800 bg-opacity-90 rounded-2xl shadow-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <MakeBase
                        email={email}
                        password={password}
                        username={username}
                        setEmail={setEmail}
                        setPassword={setPassword}
                        setUsername={setUsername}
                        setup={setup}
                        setSetup={setSetup}
                        response={response}
                        setResponse={setResponse}
                    />
                </motion.div>
            </div>
        </div>
    );
}

function pickOtherSetup(currentSetup) {
    return currentSetup === "sign in" ? "sign up" : "sign in";
}

async function signInBackend(email, password, setResponse) {
    try {
        const response = await fetch("http://localhost:3001/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (data.error) {
            setResponse({ error: data.error });
            return;
        }
        
        if (data.message === "Signin successful") {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            window.location.href = '/home';
        } else {
            setResponse({ error: data.message || "Login failed" });
        }
    } catch (error) {
        console.error('Signin error:', error);
        setResponse({ error: "An error occurred during sign in" });
    }
}

async function signUpBackend(user, email, password, setResponse) {
    try {
        const response = await fetch("http://localhost:3001/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, email, password }),
        });
        const data = await response.json();
        setResponse(data.message);
        
        if (data.message === "Signup successful") {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', user);
            window.location.href = '/home';
        }
    } catch (error) {
        console.error('Signup error:', error);
        setResponse("An error occurred during sign up");
    }
}

function functionSelector(params) {
    if (params.setup === "sign in") {
        signInBackend(params.email, params.password, params.setResponse);
    } else {
        signUpBackend(params.username, params.email, params.password,params.setResponse);
    }
}

function MakeBase(params) {
    return (
        <div className="text-center max-w-xl mx-auto">
            <motion.h1
                className="text-3xl font-bold uppercase mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {params.setup}
            </motion.h1>
            <div className="mb-4">
                <input
                    type="email"
                    placeholder="Enter email"
                    className="w-full p-3 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    onChange={(e) => params.setEmail(e.target.value)}
                />
            </div>
            <div className="mb-4">
                <input
                    type="password"
                    placeholder="Enter password"
                    className="w-full p-3 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    onChange={(e) => params.setPassword(e.target.value)}
                />
            </div>
            <div >
                {params.setup === "sign up" &&
                    <div className="mb-6">
                        <input
                            type="username"
                            placeholder="Enter username"
                            className="w-full p-3 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                            onChange={(e) => params.setUsername(e.target.value)}
                        />
                    </div>
                }
            </div>

            <div className="flex flex-col gap-4">
                <motion.button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => functionSelector(params)}
                >
                    {params.setup}
                </motion.button>
                <motion.button
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => params.setSetup(pickOtherSetup(params.setup))}
                >
                    Change to {pickOtherSetup(params.setup)}
                </motion.button>
            </div>
            <div className="mt-4 text-sm text-gray-300">{params.response["error"]}</div>
        </div>
    );
}

export default Signup;