/**
 * Chat Client for Lavoro Frontend
 * This is a thin client that communicates with the backend chat service
 */

import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:3000';
const socket = io(API_URL, {
    withCredentials: true,
    extraHeaders: {
        "my-custom-header": "abcd"
    }
});

// Create axios instance for chat API
const api = axios.create({
    baseURL: `${API_URL}/chat`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add authorization header to requests if token exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Socket.io connection management
export const connectSocket = (userId) => {
    socket.emit('user_connected', userId);
};

// Get all chats for a user
export const getUserChats = async (userId) => {
    try {
        const response = await api.get(`/user/${userId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching user chats:', error);
        throw error;
    }
};

// Get conversation between two users
export const getConversation = async (userId, otherUserId) => {
    try {
        console.log(`Fetching conversation between ${userId} and ${otherUserId}`);
        const response = await api.get(`/conversation/${userId}/${otherUserId}`);

        // Log the raw response for debugging
        console.log('Raw conversation response:', response);

        // Validate and process the response
        if (response.data && response.data.data) {
            // Ensure messages is an array
            if (!response.data.data.messages) {
                console.warn('No messages array in response, creating empty array');
                response.data.data.messages = [];
            } else if (!Array.isArray(response.data.data.messages)) {
                console.warn('Messages is not an array, converting to array:', response.data.data.messages);
                response.data.data.messages = [response.data.data.messages];
            }

            // Process each message to ensure it has required properties
            response.data.data.messages = response.data.data.messages.map(msg => {
                if (!msg) return null;

                // Ensure message has an ID
                if (!msg._id) {
                    msg._id = `temp_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
                }

                // Ensure message has sent_at
                if (!msg.sent_at) {
                    msg.sent_at = new Date().toISOString();
                }

                return msg;
            }).filter(msg => msg !== null); // Remove any null messages

            console.log('Processed conversation data:', response.data.data);
            return response.data.data;
        } else {
            console.warn('Invalid response format:', response.data);
            // Return a valid empty response
            return { messages: [] };
        }
    } catch (error) {
        console.error('Error fetching conversation:', error);
        // Return a valid empty response instead of throwing
        return { messages: [] };
    }
};

// Send a message
export const sendMessage = async (messageData, attachment = null) => {
    try {
        // If there's an attachment, use FormData
        if (attachment) {
            const formData = new FormData();
            formData.append('sender_id', messageData.sender_id);
            formData.append('receiver_id', messageData.receiver_id);
            formData.append('message', messageData.message || '');
            formData.append('attachment', attachment);

            const response = await api.post('/message', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.data;
        } else {
            // Regular JSON request without attachment
            const response = await api.post('/message', messageData);
            return response.data.data;
        }
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

// Delete a message
export const deleteMessage = async (messageId) => {
    try {
        const response = await api.delete(`/message/${messageId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
};

// Update a message
export const updateMessage = async (messageId, newMessage) => {
    try {
        const response = await api.put(`/message/${messageId}`, { message: newMessage });
        return response.data.data;
    } catch (error) {
        console.error('Error updating message:', error);
        throw error;
    }
};

// Get all groups for a user
export const getUserGroups = async (userId) => {
    try {
        const response = await api.get(`/groups/${userId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching user groups:', error);
        throw error;
    }
};

// Create a new group
export const createGroup = async (groupData, avatar = null) => {
    try {
        // If there's an avatar, use FormData
        if (avatar) {
            const formData = new FormData();
            formData.append('name', groupData.name);
            formData.append('description', groupData.description);
            formData.append('creator', groupData.creator);

            // Append each member to the formData
            groupData.members.forEach(member => {
                formData.append('members', member);
            });

            formData.append('avatar', avatar);

            const response = await api.post('/group', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.data;
        } else {
            // Regular JSON request without avatar
            const response = await api.post('/group', groupData);
            return response.data.data;
        }
    } catch (error) {
        console.error('Error creating group:', error);
        throw error;
    }
};

// Get messages for a group
export const getGroupMessages = async (groupId, userId) => {
    try {
        const response = await api.get(`/group/${groupId}/${userId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching group messages:', error);
        throw error;
    }
};

// Send a message to a group
export const sendGroupMessage = async (messageData, attachment = null) => {
    try {
        // If there's an attachment, use FormData
        if (attachment) {
            const formData = new FormData();
            formData.append('group_id', messageData.group_id);
            formData.append('sender_id', messageData.sender_id);
            formData.append('message', messageData.message || '');
            formData.append('attachment', attachment);

            const response = await api.post('/group/message', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.data;
        } else {
            // Regular JSON request without attachment
            const response = await api.post('/group/message', messageData);
            return response.data.data;
        }
    } catch (error) {
        console.error('Error sending group message:', error);
        throw error;
    }
};

// Delete a group message
export const deleteGroupMessage = async (messageId) => {
    try {
        const response = await api.delete(`/group/message/${messageId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting group message:', error);
        throw error;
    }
};

// Update a group message
export const updateGroupMessage = async (messageId, newMessage) => {
    try {
        const response = await api.put(`/group/message/${messageId}`, { message: newMessage });
        return response.data.data;
    } catch (error) {
        console.error('Error updating group message:', error);
        throw error;
    }
};

// Get all contacts (users)
export const getContacts = async (userId) => {
    try {
        const response = await api.get(`/contacts/${userId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching contacts:', error);
        throw error;
    }
};

// Add user to group
export const addUserToGroup = async (groupId, userId) => {
    try {
        const response = await api.put(`/group/${groupId}/add/${userId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error adding user to group:', error);
        throw error;
    }
};

// Remove user from group
export const removeUserFromGroup = async (groupId, userId) => {
    try {
        const response = await api.put(`/group/${groupId}/remove/${userId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error removing user from group:', error);
        throw error;
    }
};

// Socket event listeners
export const onNewMessage = (callback) => {
    socket.on('new_message', callback);
};

export const onMessageSent = (callback) => {
    socket.on('message_sent', callback);
};

export const onNewGroupMessage = (callback) => {
    socket.on('new_group_message', callback);
};

export const onGroupMessageSent = (callback) => {
    socket.on('group_message_sent', callback);
};

export const onUserTyping = (callback) => {
    socket.on('user_typing', callback);
};

export const onUserStopTyping = (callback) => {
    socket.on('user_stop_typing', callback);
};

export const onMessageUpdated = (callback) => {
    socket.on('message_updated', callback);
};

export const onGroupMessageUpdated = (callback) => {
    socket.on('group_message_updated', callback);
};

export const onMessageDeleted = (callback) => {
    socket.on('message_deleted', callback);
};

export const onGroupMessageDeleted = (callback) => {
    socket.on('group_message_deleted', callback);
};

// Remove socket event listeners
export const offNewMessage = () => {
    socket.off('new_message');
};

export const offMessageSent = () => {
    socket.off('message_sent');
};

export const offNewGroupMessage = () => {
    socket.off('new_group_message');
};

export const offGroupMessageSent = () => {
    socket.off('group_message_sent');
};

export const offUserTyping = () => {
    socket.off('user_typing');
};

export const offUserStopTyping = () => {
    socket.off('user_stop_typing');
};

export const offMessageUpdated = () => {
    socket.off('message_updated');
};

export const offGroupMessageUpdated = () => {
    socket.off('group_message_updated');
};

export const offMessageDeleted = () => {
    socket.off('message_deleted');
};

export const offGroupMessageDeleted = () => {
    socket.off('group_message_deleted');
};

// Emit socket events
export const emitPrivateMessage = (data) => {
    socket.emit('private_message', data);
};

export const emitGroupMessage = (data) => {
    socket.emit('group_message', data);
};

export const emitTyping = (data) => {
    socket.emit('typing', data);
};

export const emitStopTyping = (data) => {
    socket.emit('stop_typing', data);
};

export const emitUpdateMessage = (data) => {
    socket.emit('update_message', data);
};

export const emitUpdateGroupMessage = (data) => {
    socket.emit('update_group_message', data);
};

// Local storage functions for offline support
export const saveConversationsToLocalStorage = (userId, conversations) => {
    localStorage.setItem(`conversations_${userId}`, JSON.stringify(conversations));
};

export const getConversationsFromLocalStorage = (userId) => {
    const conversations = localStorage.getItem(`conversations_${userId}`);
    return conversations ? JSON.parse(conversations) : [];
};

export const saveGroupsToLocalStorage = (userId, groups) => {
    localStorage.setItem(`groups_${userId}`, JSON.stringify(groups));
};

export const getGroupsFromLocalStorage = (userId) => {
    const groups = localStorage.getItem(`groups_${userId}`);
    return groups ? JSON.parse(groups) : [];
};

export default {
    getUserChats,
    getConversation,
    sendMessage,
    deleteMessage,
    updateMessage,
    getUserGroups,
    createGroup,
    getGroupMessages,
    sendGroupMessage,
    deleteGroupMessage,
    updateGroupMessage,
    getContacts,
    addUserToGroup,
    removeUserFromGroup,
    connectSocket,
    onNewMessage,
    onMessageSent,
    onNewGroupMessage,
    onGroupMessageSent,
    onUserTyping,
    onUserStopTyping,
    onMessageUpdated,
    onGroupMessageUpdated,
    onMessageDeleted,
    onGroupMessageDeleted,
    offNewMessage,
    offMessageSent,
    offNewGroupMessage,
    offGroupMessageSent,
    offUserTyping,
    offUserStopTyping,
    offMessageUpdated,
    offGroupMessageUpdated,
    offMessageDeleted,
    offGroupMessageDeleted,
    emitPrivateMessage,
    emitGroupMessage,
    emitTyping,
    emitStopTyping,
    emitUpdateMessage,
    emitUpdateGroupMessage,
    saveConversationsToLocalStorage,
    getConversationsFromLocalStorage,
    saveGroupsToLocalStorage,
    getGroupsFromLocalStorage
};
