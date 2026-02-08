import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthProvider';
import { parseJwt } from '../utils/jwt';

const TokenTimer = () => {
    const { token, logout } = useContext(AuthContext);
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!token) {
            setTimeLeft(null);
            return;
        }

        const decoded = parseJwt(token);
        if (!decoded || !decoded.exp) return;

        const updateTimer = () => {
            const currentTime = Math.floor(Date.now() / 1000);
            const remaining = decoded.exp - currentTime;

            if (remaining <= 0) {
                // Token expired
                logout();
                setTimeLeft(0);
            } else {
                setTimeLeft(remaining);
            }
        };

        // Initial call
        updateTimer();

        // Update every second
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [token, logout]);

    if (timeLeft === null) return null;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    // Styling for low time
    const isLow = timeLeft < 60; // Less than 1 minute

    return (
        <div style={{
            padding: '10px 15px',
            color: isLow ? '#f87171' : '#94a3b8',
            fontSize: '0.8rem',
            textAlign: 'center',
            fontWeight: '500',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            marginTop: 'auto'
        }}>
            Expires in: {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
    );
};

export default TokenTimer;
