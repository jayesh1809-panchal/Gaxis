import React, { useState, useEffect, useRef } from "react";
import { FaRobot, FaPaperPlane, FaSpinner, FaCheck, FaTimes, FaHistory } from "react-icons/fa";
import aiService from "../../services/aiService";

const AICopilotDashboard = () => {
    const [messages, setMessages] = useState([
        { sender: "assistant", text: "Hello! I am your G-Axis AI Copilot. How can I help you today? You can ask me about failed workflows, access issues, or draft new actions." }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = inputValue.trim();
        setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
        setInputValue("");
        setLoading(true);

        try {
            const res = await aiService.sendMessage(userMsg, conversationId);
            if (res.success) {
                if (!conversationId && res.conversation) {
                    setConversationId(res.conversation._id);
                }
                setMessages(prev => [...prev, { 
                    sender: "assistant", 
                    text: res.assistantMessage.text,
                    suggestedActions: res.assistantMessage.suggestedActions 
                }]);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, { sender: "assistant", text: "Sorry, I encountered an error while processing your request." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteAction = async (actionId) => {
        setActionLoading(actionId);
        try {
            const res = await aiService.executeAction(actionId);
            if (res.success) {
                setMessages(prev => [...prev, { sender: "assistant", text: `Action executed successfully: ${res.action.actionType}` }]);
            }
        } catch (error) {
            console.error("Error executing action:", error);
            setMessages(prev => [...prev, { sender: "assistant", text: `Failed to execute action: ${error.response?.data?.message || error.message}` }]);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="flex h-full bg-gray-900 text-gray-100">
            {/* Sidebar / History */}
            <div className="w-64 border-r border-gray-700 p-4 hidden md:flex flex-col">
                <div className="flex items-center space-x-2 text-xl font-bold mb-6 text-indigo-400">
                    <FaRobot />
                    <span>AI Copilot</span>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded-md mb-6 transition-colors">
                    + New Conversation
                </button>
                <div className="flex items-center text-sm text-gray-400 mb-2">
                    <FaHistory className="mr-2" />
                    <span>Recent Activity</span>
                </div>
                <div className="text-sm text-gray-500 italic">
                    History will appear here.
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="h-16 border-b border-gray-700 flex items-center px-6 bg-gray-800">
                    <h2 className="text-lg font-semibold">Copilot Session</h2>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-2xl rounded-lg p-4 shadow-md ${
                                msg.sender === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-gray-800 border border-gray-700 rounded-bl-none text-gray-200'
                            }`}>
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                                
                                {/* Suggested Actions */}
                                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                                    <div className="mt-4 space-y-2 border-t border-gray-600 pt-3">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Suggested Actions</p>
                                        {msg.suggestedActions.map(actionId => (
                                            <div key={actionId} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                                                <div>
                                                    <span className="text-sm font-medium">Draft Action</span>
                                                    <span className="text-xs block text-gray-400">{actionId}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleExecuteAction(actionId)}
                                                    disabled={actionLoading === actionId}
                                                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium flex items-center transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === actionId ? <FaSpinner className="animate-spin" /> : <><FaCheck className="mr-1"/> Apply</>}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 rounded-bl-none text-gray-400 flex items-center space-x-2">
                                <FaSpinner className="animate-spin" />
                                <span>Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-gray-800 border-t border-gray-700">
                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
                        <input 
                            type="text" 
                            className="w-full bg-gray-900 border border-gray-700 rounded-full py-3 pl-6 pr-12 text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            placeholder="Ask the AI Copilot..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={loading}
                        />
                        <button 
                            type="submit" 
                            disabled={!inputValue.trim() || loading}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            <FaPaperPlane />
                        </button>
                    </form>
                    <div className="text-center mt-2 text-xs text-gray-500">
                        AI can make mistakes. Verify important actions before executing.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AICopilotDashboard;
