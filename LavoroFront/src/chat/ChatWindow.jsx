import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as chatClient from './chatClient.js';
import EmojiPicker from 'emoji-picker-react';

// API URL for file uploads
const API_URL = 'http://localhost:3000';

const ChatWindow = ({ chat, messages, currentUser, onSendMessage, isLoading }) => {
    const [messageText, setMessageText] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editText, setEditText] = useState('');
    const chatContentRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const messageInputRef = useRef(null);
    const editInputRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (chatContentRef.current) {
            chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
        }
    }, [messages]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle emoji selection
    const handleEmojiClick = (emojiData) => {
        setMessageText(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    // Toggle emoji picker
    const toggleEmojiPicker = () => {
        setShowEmojiPicker(prev => !prev);
    };

    // Format timestamp to time (e.g., "14:30")
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return format(new Date(timestamp), 'HH:mm', { locale: fr });
    };

    // Handle edit message
    const handleEditMessage = (message) => {
        setEditingMessage(message);
        setEditText(message.message);

        // Focus the edit input after a short delay to ensure it's rendered
        setTimeout(() => {
            if (editInputRef.current) {
                editInputRef.current.focus();
            }
        }, 100);
    };

    // Handle save edited message
    const handleSaveEdit = async () => {
        if (!editingMessage || editText.trim() === '') return;

        try {
            if (chat.type === 'direct') {
                // Use socket.io to update the message
                chatClient.emitUpdateMessage({
                    message_id: editingMessage._id,
                    new_message: editText
                });

                // Update the message in the UI immediately
                const updatedMessages = messages.map(msg =>
                    msg._id === editingMessage._id
                        ? { ...msg, message: editText, edited: true, edited_at: new Date() }
                        : msg
                );

                // Update the messages state through the parent component
                if (typeof onSendMessage === 'function') {
                    // This is a workaround to update the messages state in the parent component
                    // Ideally, we would have a separate callback for updating messages
                    onSendMessage(null, null, updatedMessages);
                }
            } else if (chat.type === 'group') {
                // Use socket.io to update the group message
                chatClient.emitUpdateGroupMessage({
                    message_id: editingMessage._id,
                    new_message: editText
                });

                // Update the message in the UI immediately
                const updatedMessages = messages.map(msg =>
                    msg._id === editingMessage._id
                        ? { ...msg, message: editText, edited: true, edited_at: new Date() }
                        : msg
                );

                // Update the messages state through the parent component
                if (typeof onSendMessage === 'function') {
                    // This is a workaround to update the messages state in the parent component
                    onSendMessage(null, null, updatedMessages);
                }
            }
        } catch (error) {
            console.error('Error updating message:', error);
        } finally {
            // Reset editing state
            setEditingMessage(null);
            setEditText('');
        }
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingMessage(null);
        setEditText('');
    };

    // Handle delete message
    const handleDeleteMessage = async (message) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            // Remove the message from the UI immediately
            const updatedMessages = messages.filter(msg => msg._id !== message._id);

            // Update the messages state through the parent component
            if (typeof onSendMessage === 'function') {
                onSendMessage(null, null, updatedMessages);
            }

            // Then send the delete request to the server
            if (chat.type === 'direct') {
                // Delete direct message
                await chatClient.deleteMessage(message._id);
            } else if (chat.type === 'group') {
                // Delete group message
                await chatClient.deleteGroupMessage(message._id);
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            // If there was an error, refresh the messages to restore the deleted message
            if (chat.type === 'direct' && chat.user) {
                const conversation = await chatClient.getConversation(currentUser._id, chat.user._id);
                if (conversation && conversation.messages) {
                    onSendMessage(null, null, conversation.messages);
                }
            } else if (chat.type === 'group') {
                const groupMessages = await chatClient.getGroupMessages(chat._id, currentUser._id);
                if (groupMessages) {
                    onSendMessage(null, null, groupMessages);
                }
            }
        }
    };

    // Handle message input change
    const handleMessageChange = (e) => {
        setMessageText(e.target.value);

        // Emit typing event
        if (chat.type === 'direct') {
            if (!isTyping) {
                setIsTyping(true);
                chatClient.emitTyping({
                    sender_id: currentUser._id,
                    receiver_id: chat.user._id
                });
            }

            // Clear previous timeout
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }

            // Set new timeout to stop typing indicator after 2 seconds
            const timeout = setTimeout(() => {
                setIsTyping(false);
                chatClient.emitStopTyping({
                    sender_id: currentUser._id,
                    receiver_id: chat.user._id
                });
            }, 2000);

            setTypingTimeout(timeout);
        }
    };

    // Handle file attachment
    const handleAttachmentClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Check file size (max 19MB)
            const maxSize = 19 * 1024 * 1024; // 19MB in bytes
            if (file.size > maxSize) {
                alert(`Le fichier est trop volumineux (${(file.size / (1024 * 1024)).toFixed(2)} MB). La taille maximale est de 19 MB.`);
                e.target.value = ''; // Reset file input
                return;
            }

            // Check file type
            const acceptedTypes = [
                'image/', 'video/', 'application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain', 'application/zip', 'application/x-rar-compressed'
            ];

            const isAccepted = acceptedTypes.some(type => file.type.startsWith(type));
            if (!isAccepted) {
                alert(`Type de fichier non pris en charge: ${file.type}. Veuillez sélectionner une image, une vidéo, un PDF, un document Word/Excel, un fichier texte ou une archive.`);
                e.target.value = ''; // Reset file input
                return;
            }

            console.log('File selected:', file.name, 'Type:', file.type, 'Size:', (file.size / (1024 * 1024)).toFixed(2) + 'MB');
            setAttachment(file);
        }
    };

    // Handle message submission
    const handleSubmit = (e) => {
        e.preventDefault();

        // Don't send if there's no message and no attachment
        if (messageText.trim() === '' && !attachment) {
            console.log('No message or attachment to send');
            return;
        }

        console.log('Submitting message:', messageText.trim() || '(empty)', 'with attachment:', attachment ? attachment.name : 'none');

        // Send message with or without attachment
        onSendMessage(messageText, attachment);

        // Reset form
        setMessageText('');
        setAttachment(null);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // Focus the input field for the next message
        if (messageInputRef.current) {
            messageInputRef.current.focus();
        }
    };

    // Group messages by date with additional validation
    const groupMessagesByDate = () => {
        const groups = {};

        if (!Array.isArray(messages)) {
            console.error("Messages is not an array:", messages);
            return groups;
        }

        messages.forEach(message => {
            if (!message) {
                console.warn("Undefined message found in messages array");
                return;
            }

            if (!message.sent_at) {
                console.warn("Message without sent_at found:", message);
                // Ajouter une date par défaut
                message.sent_at = new Date().toISOString();
            }

            try {
                const date = new Date(message.sent_at).toLocaleDateString('fr-FR');
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(message);
            } catch (error) {
                console.error("Error processing message date:", error, message);
            }
        });

        console.log("Grouped messages by date:", groups);
        return groups;
    };

    const messageGroups = groupMessagesByDate();

    // Get chat name and image
    const chatName = chat.type === 'direct' ? chat.user.name : chat.name;
    const chatImage = chat.type === 'direct'
        ? (chat.user.profileImage || "../assets/images/faces/6.jpg")
        : (chat.avatar || "../assets/images/faces/17.jpg");
    const chatStatus = chat.type === 'direct' ? chat.user.status || 'offline' : '';

    return (
        <div className="chat-window border d-flex flex-column">
            {/* Chat Header */}
            <div className="chat-header d-flex align-items-center justify-content-between p-3 border-bottom">
                <div className="d-flex align-items-center">
                    <span className={`avatar avatar-md ${chatStatus} me-2`}>
                        <img className="chatimageperson" src={chatImage} alt={chatName} />
                    </span>
                    <div>
                        <p className="mb-0 fw-semibold chatnameperson">{chatName}</p>
                        {chat.type === 'direct' && (
                            <p className="mb-0 fs-12 text-muted chatpersonstatus">
                                {chatStatus === 'online' ? 'En ligne' : 'Hors ligne'}
                            </p>
                        )}
                        {chat.type === 'group' && (
                            <p className="mb-0 fs-12 text-muted">
                                {chat.members?.length || 0} membres
                            </p>
                        )}
                    </div>
                </div>
                <div className="d-flex align-items-center">
                    <button className="btn btn-sm btn-icon btn-primary-light me-1">
                        <i className="ri-phone-line"></i>
                    </button>
                    <button className="btn btn-sm btn-icon btn-primary-light me-1">
                        <i className="ri-vidicon-line"></i>
                    </button>
                    <button className="btn btn-sm btn-icon btn-primary-light me-1 d-lg-none responsive-chat-close">
                        <i className="ri-close-line"></i>
                    </button>
                    <div className="dropdown">
                        <button className="btn btn-sm btn-icon btn-primary-light" data-bs-toggle="dropdown">
                            <i className="ri-more-2-fill"></i>
                        </button>
                        <ul className="dropdown-menu">
                            <li><a className="dropdown-item" href="javascript:void(0);"><i className="ri-user-line me-2"></i>Voir le profil</a></li>
                            <li><a className="dropdown-item" href="javascript:void(0);"><i className="ri-image-line me-2"></i>Médias partagés</a></li>
                            <li><a className="dropdown-item" href="javascript:void(0);"><i className="ri-delete-bin-line me-2"></i>Supprimer la conversation</a></li>
                            <li><a className="dropdown-item" href="javascript:void(0);"><i className="ri-spam-2-line me-2"></i>Bloquer</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Chat Content */}
            <div className="chat-content flex-grow-1" id="main-chat-content" ref={chatContentRef}>
                {isLoading ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Chargement...</span>
                        </div>
                    </div>
                ) : (
                    <ul className="list-unstyled">
                        {Object.keys(messageGroups).map(date => (
                            <React.Fragment key={date}>
                                <li className="chat-day-label">
                                    <div className="text-center my-3">
                                        <span className="date-label px-3 py-1">{date === new Date().toLocaleDateString('fr-FR') ? "Aujourd'hui" : date}</span>
                                    </div>
                                </li>
                                {messageGroups[date].map((message, index) => {
                                    // Gérer le cas où sender_id est un objet avec une propriété _id
                                    const senderId = typeof message.sender_id === 'object' && message.sender_id !== null && message.sender_id._id
                                        ? message.sender_id._id
                                        : message.sender_id;
                                    const currentUserId = currentUser._id;
                                    const isCurrentUser = senderId === currentUserId;

                                    // Log détaillé pour débogage
                                    console.log(`Message ${index}:`, {
                                        message: message.message,
                                        senderId: senderId,
                                        currentUserId: currentUserId,
                                        isCurrentUser: isCurrentUser,
                                        sender: message.sender,
                                        fullMessage: message
                                    });

                                    return (
                                        <li key={index} className={isCurrentUser ? "chat-item-end" : "chat-item-start"}>
                                            <div className="chat-list-inner">
                                                {!isCurrentUser && (
                                                    <div className="chat-user-profile">
                                                        <span className={`avatar avatar-md ${chat.type === 'direct' ? chatStatus : ''}`}>
                                                             <img
                                                                src={chat.type === 'direct' ?
                                                                    chatImage :
                                                                    (message.sender?.profileImage ||
                                                                     message.sender?.image ||
                                                                     "../assets/images/faces/6.jpg")}
                                                                alt={chat.type === 'direct' ?
                                                                    chatName :
                                                                    (message.sender?.name ||
                                                                     `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim() ||
                                                                     'Utilisateur')}
                                                            /> 

                                                        </span>
                                                    </div>
                                                )}
                                                <div className={isCurrentUser ? "me-3" : "ms-3"}>
                                                    <div className="main-chat-msg">
                                                        {chat.type === 'group' && (
                                                            <div className="sender-name mb-1 fw-bold" style={{ color: isCurrentUser ? '#28a745' : '#4a6bff', textAlign: isCurrentUser ? 'right' : 'left' }}>
                                                                {isCurrentUser ? 'Moi' :
                                                                 (message.sender?.name ||
                                                                 `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim() ||
                                                                 'Utilisateur')}
                                                            </div>
                                                        )}
                                                        {/* Debug info - remove in production */}
                                                        {chat.type === 'group' && (
                                                            <div style={{ display: 'none' }}>
                                                                {console.log('Message sender:', message.sender, 'isCurrentUser:', isCurrentUser)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            {editingMessage && editingMessage._id === message._id ? (
                                                                <div style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '10px',
                                                                    width: '100%'
                                                                }}>
                                                                    <textarea
                                                                        ref={editInputRef}
                                                                        value={editText}
                                                                        onChange={(e) => setEditText(e.target.value)}
                                                                        rows={3}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '10px',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid #4a6bff',
                                                                            backgroundColor: '#252a30',
                                                                            color: '#fff',
                                                                            resize: 'vertical'
                                                                        }}
                                                                    />
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        justifyContent: 'flex-end',
                                                                        gap: '10px'
                                                                    }}>
                                                                        <button
                                                                            onClick={handleCancelEdit}
                                                                            style={{
                                                                                padding: '5px 10px',
                                                                                borderRadius: '4px',
                                                                                border: 'none',
                                                                                backgroundColor: '#6c757d',
                                                                                color: 'white',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            onClick={handleSaveEdit}
                                                                            style={{
                                                                                padding: '5px 10px',
                                                                                borderRadius: '4px',
                                                                                border: 'none',
                                                                                backgroundColor: '#4a6bff',
                                                                                color: 'white',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            Save
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {/* Message actions (only show for current user's messages) */}
                                                                    {isCurrentUser && (
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            top: '-20px',
                                                                            right: '0',
                                                                            display: 'flex',
                                                                            gap: '5px',
                                                                            opacity: '0',
                                                                            transition: 'opacity 0.2s ease',
                                                                            zIndex: '10'
                                                                        }}
                                                                        className="hover-visible">
                                                                            <button
                                                                                style={{
                                                                                    background: '#4a6bff',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    borderRadius: '50%',
                                                                                    width: '24px',
                                                                                    height: '24px',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '12px'
                                                                                }}
                                                                                onClick={() => handleEditMessage(message)}
                                                                            >
                                                                                <i className="ri-edit-line"></i>
                                                                            </button>
                                                                            <button
                                                                                style={{
                                                                                    background: '#dc3545',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    borderRadius: '50%',
                                                                                    width: '24px',
                                                                                    height: '24px',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '12px'
                                                                                }}
                                                                                onClick={() => handleDeleteMessage(message)}
                                                                            >
                                                                                <i className="ri-delete-bin-line"></i>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    <p className="mb-0">{message.message}</p>
                                                                    {message.edited && (
                                                                        <div style={{
                                                                            fontSize: '11px',
                                                                            color: '#adb5bd',
                                                                            marginTop: '2px',
                                                                            fontStyle: 'italic'
                                                                        }}>
                                                                            (edited {message.edited_at ? format(new Date(message.edited_at), 'HH:mm', { locale: fr }) : ''})
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                            {message.attachment && (
                                                                <div className="chat-attachment mt-2">
                                                                    {message.attachment_type === 'image' ? (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="glightbox" data-gallery="chat-gallery">
                                                                            <img src={`${API_URL}/uploads/chat/${message.attachment}`} alt="attachment" className="img-fluid rounded" style={{ maxWidth: '200px', maxHeight: '200px' }} />
                                                                        </a>
                                                                    ) : message.attachment_type === 'video' ? (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="glightbox" data-gallery="chat-gallery">
                                                                            <video src={`${API_URL}/uploads/chat/${message.attachment}`} className="img-fluid rounded" controls style={{ maxWidth: '200px' }}></video>
                                                                        </a>
                                                                    ) : message.attachment_type === 'pdf' ? (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="chat-file-attachment p-2 border rounded d-inline-block" download>
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="ri-file-pdf-line fs-24 text-danger me-2"></i>
                                                                                <div>
                                                                                    <span className="d-block">{message.attachment.split('-').pop()}</span>
                                                                                    <small className="text-muted">Cliquez pour télécharger</small>
                                                                                </div>
                                                                            </div>
                                                                        </a>
                                                                    ) : message.attachment_type === 'word' || message.attachment.endsWith('.doc') || message.attachment.endsWith('.docx') ? (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="chat-file-attachment p-2 border rounded d-inline-block" download>
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="ri-file-word-line fs-24 text-primary me-2"></i>
                                                                                <div>
                                                                                    <span className="d-block">{message.attachment.split('-').pop()}</span>
                                                                                    <small className="text-muted">Cliquez pour télécharger</small>
                                                                                </div>
                                                                            </div>
                                                                        </a>
                                                                    ) : message.attachment_type === 'excel' || message.attachment.endsWith('.xls') || message.attachment.endsWith('.xlsx') ? (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="chat-file-attachment p-2 border rounded d-inline-block" download>
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="ri-file-excel-line fs-24 text-success me-2"></i>
                                                                                <div>
                                                                                    <span className="d-block">{message.attachment.split('-').pop()}</span>
                                                                                    <small className="text-muted">Cliquez pour télécharger</small>
                                                                                </div>
                                                                            </div>
                                                                        </a>
                                                                    ) : message.attachment.endsWith('.zip') || message.attachment.endsWith('.rar') ? (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="chat-file-attachment p-2 border rounded d-inline-block" download>
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="ri-file-zip-line fs-24 text-warning me-2"></i>
                                                                                <div>
                                                                                    <span className="d-block">{message.attachment.split('-').pop()}</span>
                                                                                    <small className="text-muted">Cliquez pour télécharger</small>
                                                                                </div>
                                                                            </div>
                                                                        </a>
                                                                    ) : (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="chat-file-attachment p-2 border rounded d-inline-block" download>
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="ri-file-line fs-24 text-muted me-2"></i>
                                                                                <div>
                                                                                    <span className="d-block">{message.attachment.split('-').pop()}</span>
                                                                                    <small className="text-muted">Cliquez pour télécharger</small>
                                                                                </div>
                                                                            </div>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="chatting-user-info">
                                                        <span>{isCurrentUser ? 'Moi' : (chat.type === 'direct' ? chatName : '')}</span>
                                                        <span className="msg-sent-time">{formatTime(message.sent_at)}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                        {messages.length === 0 && (
                            <li className="text-center p-5">
                                <p className="text-muted">Aucun message. Commencez la conversation!</p>
                            </li>
                        )}
                    </ul>
                )}
            </div>

            {/* Zone de saisie de message (nouvelle implémentation) */}
            <div className="chat-message-input-container mt-auto" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <form onSubmit={handleSubmit} className="chat-message-form" style={{ display: 'flex', width: '100%', maxWidth: '100%' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/zip,application/x-rar-compressed"
                    />
                    <button
                        type="button"
                        className="btn btn-primary1-light btn-icon chat-message-button attachment-btn"
                        onClick={handleAttachmentClick}
                        style={{
                            flexShrink: 0,
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '10px',
                            marginLeft: '20px',

                        }}
                    >
                        <i className="ri-attachment-2" style={{ fontSize: '18px' }}></i>
                    </button>
                    <div className="position-relative" style={{ flexShrink: 0 }}>
                        <button
                            type="button"
                            className="btn btn-icon btn-primary2 emoji-picker chat-message-button"
                            onClick={toggleEmojiPicker}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '10px'
                            }}
                        >
                            <i className="ri-emotion-line" style={{ fontSize: '18px' }}></i>
                        </button>
                        {showEmojiPicker && (
                            <div
                                className="position-absolute bottom-100 start-0 mb-2"
                                style={{ zIndex: 1000 }}
                                ref={emojiPickerRef}
                            >
                                <EmojiPicker
                                    onEmojiClick={handleEmojiClick}
                                    width={300}
                                    height={400}
                                    theme="auto"
                                />
                            </div>
                        )}
                    </div>
                    <input
                        className="form-control chat-message-space"
                        placeholder="Tapez votre message ici..."
                        type="text"
                        value={messageText}
                        onChange={handleMessageChange}
                        ref={messageInputRef}
                        style={{ flex: '1 1 auto', minWidth: '600px', width: '100%' }}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary btn-icon chat-message-button"
                        style={{
                            flexShrink: 0,
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '20px'
                        }}
                    >
                        <i className="ri-send-plane-2-line" style={{ fontSize: '18px' }}></i>
                    </button>
                </form>
                {attachment && (
                    <div className="attachment-preview mt-2 p-2 border rounded" style={{ width: '100%', boxSizing: 'border-box' }}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                                {attachment.type.startsWith('image/') ? (
                                    <i className="ri-image-line me-2 text-success"></i>
                                ) : attachment.type.startsWith('video/') ? (
                                    <i className="ri-video-line me-2 text-danger"></i>
                                ) : attachment.type.includes('pdf') ? (
                                    <i className="ri-file-pdf-line me-2 text-danger"></i>
                                ) : attachment.type.includes('word') || attachment.type.includes('document') ? (
                                    <i className="ri-file-word-line me-2 text-primary"></i>
                                ) : attachment.type.includes('excel') || attachment.type.includes('sheet') ? (
                                    <i className="ri-file-excel-line me-2 text-success"></i>
                                ) : attachment.type.includes('zip') || attachment.type.includes('compressed') ? (
                                    <i className="ri-file-zip-line me-2 text-warning"></i>
                                ) : (
                                    <i className="ri-file-line me-2 text-muted"></i>
                                )}
                                <div>
                                    <span className="d-block">{attachment.name}</span>
                                    <small className="text-muted">{(attachment.size / 1024).toFixed(2)} KB</small>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-icon btn-danger"
                                onClick={() => setAttachment(null)}
                            >
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
};

export default ChatWindow;