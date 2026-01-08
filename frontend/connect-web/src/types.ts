export interface User {
    username: string;
    token: string;
}

export interface ChatMessage {
    sender: string;
    content: string;
    timestamp?: string;
}