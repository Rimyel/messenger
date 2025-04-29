import axios from "axios";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
    interface Window {
        axios: typeof axios;
        Pusher: typeof Pusher;
        Echo: Echo<any>;
    }
}

// Set up axios
window.axios = axios;
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
window.axios.defaults.withCredentials = true;

// Get CSRF token
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common["X-CSRF-TOKEN"] =
        token.getAttribute("content");
} else {
    console.error("CSRF token not found");
}

// Initialize Pusher
window.Pusher = Pusher;

// Initialize Echo
try {
    window.Echo = new Echo({
        broadcaster: "pusher",
        key: "fbec33f8ff40825149ad",
        cluster: "app2",
        wsHost: undefined,
        wsPort: undefined,
        wssPort: undefined,
        forceTLS: true,
        encrypted: true,
        enabledTransports: ["ws", "wss"],
        disableStats: true,
        auth: {
            headers: {
                "X-CSRF-TOKEN": token?.getAttribute("content") || "",
                Accept: "application/json",
            },
        },
    });

    // Debug successful initialization
    window.Echo.connector.pusher.connection.bind("connected", () => {
        console.log("Successfully connected to Pusher");
    });

    window.Echo.connector.pusher.connection.bind("error", (err: any) => {
        console.error("Pusher connection error:", err);
    });

    console.log("Echo initialized successfully");
} catch (error) {
    console.error("Failed to initialize Echo:", error);
}

export default window.Echo;
