import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as chatClient from './chatClient.js';
import * as userService from './userService.js';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import ChatFloatingButton from './ChatFloatingButton';
import ChatPopup from './ChatPopup';
import CreateGroupModal from './CreateGroupModal';
import addGlobalStyles from './globalStyles';

const ChatComponent = () => {
    // Ajouter les styles globaux au chargement du composant
    useEffect(() => {
        addGlobalStyles();
    }, []);

    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [groups, setGroups] = useState([]);
    const [contacts, setContacts] = useState({});
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'groups', 'contacts'
    const [viewMode, setViewMode] = useState('fullscreen'); // 'fullscreen', 'popup', or 'floating'
    const [showPopup, setShowPopup] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

    // Get current user from localStorage or fetch from API
    useEffect(() => {
        const fetchUser = async () => {
            console.log("Checking localStorage for user data...");
            const userString = localStorage.getItem('user');
            console.log("User string from localStorage:", userString);

            try {
                // Essayer d'abord 'user'
                let user = userString ? JSON.parse(userString) : null;

                // Si pas d'utilisateur, essayer 'userInfo'
                if (!user) {
                    const userInfoString = localStorage.getItem('userInfo');
                    console.log("UserInfo string from localStorage:", userInfoString);
                    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
                    user = userInfo?.user || userInfo;
                }

                // Si toujours pas d'utilisateur, essayer de récupérer à partir du token
                if (!user || !user._id) {
                    console.log("No valid user found in localStorage, fetching from API...");
                    user = await userService.fetchUserInfo();
                    console.log("User fetched from API:", user);
                }

                console.log("Final user object:", user);

                if (user && user._id) {
                    console.log("Valid user found with ID:", user._id);
                    setCurrentUser(user);
                    // Connect to socket
                    chatClient.connectSocket(user._id);
                    // Load initial data
                    loadUserData(user._id);
                } else if (user && !user._id && user.id) {
                    // Certaines applications utilisent 'id' au lieu de '_id'
                    console.log("User found with 'id' instead of '_id':", user.id);
                    user._id = user.id; // Ajouter _id pour compatibilité
                    setCurrentUser(user);
                    chatClient.connectSocket(user._id);
                    loadUserData(user._id);
                } else {
                    console.error("No valid user found. Redirecting to login...");
                    // Rediriger vers la page de connexion
                    navigate('/signin');
                }
            } catch (error) {
                console.error("Error getting user data:", error);
                navigate('/signin');
            }
        };

        fetchUser();
    }, [navigate]);

    // Load user's conversations, groups, and contacts
    const loadUserData = async (userId) => {
        console.log("Loading user data for userId:", userId);
        setIsLoading(true);
        try {
            // Load conversations
            console.log("Fetching user chats...");
            try {
                // Ajouter des logs détaillés pour le débogage
                console.log("Calling getUserChats with userId:", userId);

                // Essayer d'abord de récupérer les conversations depuis le localStorage
                const storedConversations = chatClient.getConversationsFromLocalStorage(userId);
                if (storedConversations && storedConversations.length > 0) {
                    console.log(`Found ${storedConversations.length} conversations in localStorage`);
                }

                // Appeler l'API pour récupérer les conversations
                const chatsResponse = await chatClient.getUserChats(userId);
                console.log("Chats response:", chatsResponse);

                // Récupérer tous les contacts pour créer des conversations même s'il n'y a pas de messages
                const allContacts = await userService.fetchAllUsers();
                console.log("All contacts fetched:", allContacts);

                let allConversations = [];

                // D'abord, ajouter les conversations existantes avec des messages
                if (chatsResponse && Array.isArray(chatsResponse)) {
                    console.log(`Found ${chatsResponse.length} existing conversations with messages from API`);

                    // Ajouter un statut par défaut si non défini
                    const existingConversations = chatsResponse.map(conv => {
                        // Ajouter un statut par défaut
                        if (!conv.user.status) {
                            // Par défaut, considérer l'utilisateur comme en ligne
                            conv.user.status = 'online';
                        }

                        // S'assurer que lastMessage existe pour éviter les erreurs
                        if (!conv.lastMessage) {
                            conv.lastMessage = {
                                message: "Démarrer une conversation...",
                                sent_at: new Date().toISOString(),
                                is_read: true
                            };
                        }

                        return conv;
                    });

                    allConversations = [...existingConversations];
                } else {
                    console.log("No conversations found from API or invalid response format");

                    // Si nous avons des conversations stockées localement, les utiliser
                    if (storedConversations && storedConversations.length > 0) {
                        console.log(`Using ${storedConversations.length} conversations from localStorage`);
                        allConversations = [...storedConversations];
                    } else {
                        console.log("No conversations found in localStorage either");
                    }
                }

                // Nous voulons afficher TOUTES les conversations avec des messages réels
                // Assurons-nous que chaque conversation a un lastMessage valide
                allConversations = allConversations.filter(conv =>
                    conv.lastMessage &&
                    (conv.lastMessage.message !== "Démarrer une conversation..." ||
                     conv.lastMessage.message.trim() !== "")
                );

                console.log(`Filtered to ${allConversations.length} conversations with real messages`);

                // Trier les conversations par date du dernier message (les plus récentes en haut)
                allConversations.sort((a, b) => {
                    const dateA = a.lastMessage && a.lastMessage.sent_at ? new Date(a.lastMessage.sent_at) : new Date(0);
                    const dateB = b.lastMessage && b.lastMessage.sent_at ? new Date(b.lastMessage.sent_at) : new Date(0);
                    return dateB - dateA; // Ordre décroissant (plus récent en premier)
                });

                console.log(`Sorted ${allConversations.length} conversations by date`);

                // Nous voulons afficher toutes les conversations, même celles sans messages réels
                // Mais nous voulons les trier par date du dernier message
                console.log(`Setting all ${allConversations.length} conversations`);

                // Ajouter des logs pour déboguer
                allConversations.forEach((conv, index) => {
                    console.log(`Conversation ${index}:`, {
                        user: conv.user ? conv.user.name : 'Unknown',
                        lastMessage: conv.lastMessage ? {
                            message: conv.lastMessage.message,
                            sent_at: conv.lastMessage.sent_at
                        } : 'No message',
                        unreadCount: conv.unreadCount
                    });
                });

                // Définir toutes les conversations
                setConversations(allConversations);

                // Sauvegarder les conversations dans le localStorage pour qu'elles persistent après un rafraîchissement
                chatClient.saveConversationsToLocalStorage(userId, allConversations);

                // Si nous avons des conversations, basculer vers l'onglet Récents
                if (allConversations.length > 0) {
                    console.log("We have conversations, switching to Recent tab");
                    setActiveTab('users');
                }
            } catch (chatError) {
                console.error("Error fetching chats:", chatError);

                // Essayer de diagnostiquer le problème
                if (!chatsResponse) {
                    console.error("Chat response is null or undefined");
                } else if (!chatsResponse.success) {
                    console.error("Chat response indicates failure:", chatsResponse.error || "Unknown error");
                } else if (!Array.isArray(chatsResponse.data)) {
                    console.error("Chat response data is not an array:", chatsResponse.data);
                } else if (chatsResponse.data.length === 0) {
                    console.log("No conversations found for this user - this is normal for new users");
                }

                // Essayer de récupérer les conversations depuis le localStorage
                console.log("Trying to load conversations from localStorage");
                const storedConversations = chatClient.getConversationsFromLocalStorage(userId);

                if (storedConversations && storedConversations.length > 0) {
                    console.log(`Found ${storedConversations.length} conversations in localStorage`);
                    setConversations(storedConversations);
                } else {
                    console.log("No conversations found in localStorage, setting empty list");
                    setConversations([]);

                    // Essayer de récupérer directement les données pour le débogage
                    try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`http://localhost:3000/chat/user/${userId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        const data = await response.json();
                        console.log("Direct API fetch for chats result:", data);

                        // Si nous avons des données, les utiliser
                        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
                            console.log(`Found ${data.data.length} conversations from direct API fetch`);
                            setConversations(data.data);
                            chatClient.saveConversationsToLocalStorage(userId, data.data);
                        }
                    } catch (directFetchError) {
                        console.error("Error in direct API fetch for chats:", directFetchError);
                    }
                }
            }

            // Load groups
            console.log("Fetching user groups...");
            try {
                const groupsResponse = await chatClient.getUserGroups(userId);
                console.log("Groups response:", groupsResponse);
                if (groupsResponse && Array.isArray(groupsResponse)) {
                    console.log("Setting groups:", groupsResponse);
                    setGroups(groupsResponse);

                    // Sauvegarder les groupes dans le localStorage
                    chatClient.saveGroupsToLocalStorage(userId, groupsResponse);
                } else {
                    console.warn("Invalid groups response format or empty data, trying localStorage");

                    // Essayer de récupérer les groupes depuis le localStorage
                    const storedGroups = chatClient.getGroupsFromLocalStorage(userId);
                    if (storedGroups && storedGroups.length > 0) {
                        console.log(`Found ${storedGroups.length} groups in localStorage`);
                        setGroups(storedGroups);
                    } else {
                        console.warn("No groups found in localStorage, using mock data");

                        try {
                            // Créer des groupes fictifs pour test
                            const mockGroups = [
                                {
                                _id: '201',
                                name: 'Huge Rocks 😍',
                                description: 'Group for rock climbing enthusiasts',
                                creator: userId,
                                members: [
                                    { _id: '101', name: 'Rashid Khan', email: 'rashid@example.com', profileImage: '../assets/images/faces/5.jpg', status: 'online' },
                                    { _id: '102', name: 'Jamison Jen', email: 'jamison@example.com', profileImage: '../assets/images/faces/2.jpg', status: 'online' },
                                    { _id: '103', name: 'Andy Max', email: 'andy@example.com', profileImage: '../assets/images/faces/10.jpg', status: 'online' },
                                    { _id: '104', name: 'Kerina Cherish', email: 'kerina@example.com', profileImage: '../assets/images/faces/6.jpg', status: 'online' }
                                ],
                                avatar: '../assets/images/faces/17.jpg',
                                last_message: new Date(Date.now() - 3600000).toISOString(),
                                lastMessage: {
                                    _id: '2001',
                                    sender_id: '101',
                                    sender: { name: 'Mony', email: 'mony@example.com' },
                                    group_id: '201',
                                    message: 'Typing...',
                                    sent_at: new Date(Date.now() - 3600000).toISOString(),
                                    read_by: [userId]
                                },
                                unreadCount: 2
                            },
                            {
                                _id: '202',
                                name: 'Creative Group',
                                description: 'Group for creative professionals',
                                creator: userId,
                                members: [
                                    { _id: '105', name: 'Rony Erick', email: 'rony@example.com', profileImage: '../assets/images/faces/11.jpg', status: 'offline' },
                                    { _id: '106', name: 'Kenath Kin', email: 'kenath@example.com', profileImage: '../assets/images/faces/3.jpg', status: 'offline' },
                                    { _id: '107', name: 'Thomas Lie', email: 'thomas@example.com', profileImage: '../assets/images/faces/13.jpg', status: 'offline' }
                                ],
                                avatar: '../assets/images/faces/18.jpg',
                                last_message: new Date(Date.now() - 7200000).toISOString(),
                                lastMessage: {
                                    _id: '2002',
                                    sender_id: '106',
                                    sender: { name: 'Kin', email: 'kenath@example.com' },
                                    group_id: '202',
                                    message: 'Have any updates today?',
                                    sent_at: new Date(Date.now() - 7200000).toISOString(),
                                    read_by: []
                                },
                                unreadCount: 1
                            },
                            {
                                _id: '203',
                                name: 'Anyside Spriritual 😎',
                                description: 'Spiritual discussion group',
                                creator: '105',
                                members: [
                                    { _id: '101', name: 'Rashid Khan', email: 'rashid@example.com', profileImage: '../assets/images/faces/5.jpg', status: 'online' },
                                    { _id: '105', name: 'Rony Erick', email: 'rony@example.com', profileImage: '../assets/images/faces/11.jpg', status: 'offline' },
                                    userId
                                ],
                                avatar: '../assets/images/faces/19.jpg',
                                last_message: new Date(Date.now() - 172800000).toISOString(),
                                lastMessage: {
                                    _id: '2003',
                                    sender_id: '105',
                                    group_id: '203',
                                    message: 'Samantha, Adam, Jessica, Emily, Alex',
                                    sent_at: new Date(Date.now() - 172800000).toISOString(),
                                    read_by: [userId]
                                },
                                unreadCount: 0
                            }
                        ];

                            setGroups(mockGroups);

                            // Sauvegarder les groupes fictifs dans le localStorage
                            chatClient.saveGroupsToLocalStorage(userId, mockGroups);
                        } catch (error) {
                            console.error("Error creating mock groups:", error);
                        }
                    }
                }
            } catch (groupError) {
                console.error("Error fetching groups:", groupError);

                // En cas d'erreur, utiliser des données fictives
                const mockGroups = [
                    {
                        _id: '201',
                        name: 'Huge Rocks 😍',
                        description: 'Group for rock climbing enthusiasts',
                        creator: userId,
                        members: [
                            { _id: '101', name: 'Rashid Khan', email: 'rashid@example.com', profileImage: '../assets/images/faces/5.jpg', status: 'online' },
                            { _id: '102', name: 'Jamison Jen', email: 'jamison@example.com', profileImage: '../assets/images/faces/2.jpg', status: 'online' }
                        ],
                        avatar: '../assets/images/faces/17.jpg',
                        last_message: new Date(Date.now() - 3600000).toISOString(),
                        lastMessage: {
                            _id: '2001',
                            sender_id: '101',
                            sender: { name: 'Mony', email: 'mony@example.com' },
                            group_id: '201',
                            message: 'Typing...',
                            sent_at: new Date(Date.now() - 3600000).toISOString(),
                            read_by: [userId]
                        },
                        unreadCount: 2
                    }
                ];

                setGroups(mockGroups);

                // Sauvegarder les groupes fictifs dans le localStorage
                chatClient.saveGroupsToLocalStorage(userId, mockGroups);
            }

            // Fetch contacts (all users from database)
            console.log("Fetching contacts (all users)...");
            try {
                // Récupérer tous les utilisateurs de la base de données
                const allUsers = await userService.fetchAllUsers();
                console.log("All users fetched:", allUsers);

                if (Array.isArray(allUsers) && allUsers.length > 0) {
                    // Organiser les utilisateurs par ordre alphabétique
                    const organizedUsers = userService.organizeUsersByAlphabet(allUsers);
                    console.log("Organized users by alphabet:", organizedUsers);
                    console.log("Number of letters in contacts:", Object.keys(organizedUsers).length);
                    console.log("Total contacts:", allUsers.length);

                    // Définir les contacts
                    setContacts(organizedUsers);
                } else {
                    console.warn("No users found in database response. This could be because:");
                    console.warn("1. The API endpoint is not returning any users");
                    console.warn("2. The user might be the only user in the database");
                    console.warn("3. There might be an issue with the API connection");

                    // Attempt to fetch users directly from the API for debugging
                    try {
                        const token = localStorage.getItem('token');
                        const response = await fetch('http://localhost:3000/chat/contacts/' + userId, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        const data = await response.json();
                        console.log("Direct API fetch result:", data);
                    } catch (directFetchError) {
                        console.error("Error in direct API fetch:", directFetchError);
                    }

                    // Pour test: créer des contacts fictifs si aucun utilisateur n'est trouvé
                    // Note: Dans un environnement de production, vous pourriez vouloir afficher un message à l'utilisateur
                    // plutôt que d'utiliser des données fictives
                    const mockContacts = {
                        'A': [
                            { _id: '1', name: 'Alice Smith', email: 'alice@example.com', profileImage: '../assets/images/faces/5.jpg' },
                            { _id: '2', name: 'Adam Johnson', email: 'adam@example.com', profileImage: '../assets/images/faces/12.jpg' }
                        ],
                        'B': [
                            { _id: '3', name: 'Bob Williams', email: 'bob@example.com', profileImage: '../assets/images/faces/14.jpg' }
                        ],
                        'C': [
                            { _id: '4', name: 'Charlie Brown', email: 'charlie@example.com', profileImage: '../assets/images/faces/3.jpg' }
                        ]
                    };
                    console.log("Setting mock contacts for testing purposes only");
                    setContacts(mockContacts);
                }
            } catch (contactError) {
                console.error("Error fetching contacts:", contactError);
                console.error("Error details:", contactError.message);

                // Try to get more information about the error
                if (contactError.response) {
                    console.error("Error response data:", contactError.response.data);
                    console.error("Error response status:", contactError.response.status);
                }

                // En cas d'erreur, utiliser des contacts fictifs temporairement
                // Note: Dans un environnement de production, vous pourriez vouloir afficher un message d'erreur
                const mockContacts = {
                    'A': [
                        { _id: '1', name: 'Alice Smith', email: 'alice@example.com', profileImage: '../assets/images/faces/5.jpg' },
                        { _id: '2', name: 'Adam Johnson', email: 'adam@example.com', profileImage: '../assets/images/faces/12.jpg' }
                    ],
                    'B': [
                        { _id: '3', name: 'Bob Williams', email: 'bob@example.com', profileImage: '../assets/images/faces/14.jpg' }
                    ],
                    'C': [
                        { _id: '4', name: 'Charlie Brown', email: 'charlie@example.com', profileImage: '../assets/images/faces/3.jpg' }
                    ]
                };
                setContacts(mockContacts);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load conversation messages when active chat changes
    useEffect(() => {
        if (activeChat && currentUser) {
            loadMessages();

            // Set up a refresh interval to reload messages periodically
            const refreshInterval = setInterval(() => {
                if (activeChat) {
                    console.log('Refreshing messages...');
                    loadMessages(false); // Pass false to avoid showing loading indicator
                }
            }, 5000); // Refresh every 5 seconds

            return () => {
                clearInterval(refreshInterval);
            };
        }
    }, [activeChat, currentUser]);

    // Generate mock messages for testing
    const generateMockMessages = (chatId, isGroup = false) => {
        const now = Date.now();
        const otherUserId = isGroup ? chatId : activeChat.user._id;
        const otherUserName = isGroup ? activeChat.name : activeChat.user.name;

        return [
            {
                _id: `msg_${now}_1`,
                sender_id: otherUserId,
                receiver_id: isGroup ? null : currentUser._id,
                group_id: isGroup ? chatId : null,
                message: `Bonjour! Comment allez-vous aujourd'hui?`,
                sent_at: new Date(now - 3600000).toISOString(),
                is_read: true,
                sender: { name: otherUserName }
            },
            {
                _id: `msg_${now}_2`,
                sender_id: currentUser._id,
                receiver_id: isGroup ? null : otherUserId,
                group_id: isGroup ? chatId : null,
                message: `Je vais bien, merci! Et vous?`,
                sent_at: new Date(now - 3500000).toISOString(),
                is_read: true
            },
            {
                _id: `msg_${now}_3`,
                sender_id: otherUserId,
                receiver_id: isGroup ? null : currentUser._id,
                group_id: isGroup ? chatId : null,
                message: `Très bien! Je travaille sur le projet Lavoro.`,
                sent_at: new Date(now - 3400000).toISOString(),
                is_read: true,
                sender: { name: otherUserName }
            },
            {
                _id: `msg_${now}_4`,
                sender_id: currentUser._id,
                receiver_id: isGroup ? null : otherUserId,
                group_id: isGroup ? chatId : null,
                message: `C'est génial! J'ai quelques questions sur les fonctionnalités.`,
                sent_at: new Date(now - 3300000).toISOString(),
                is_read: true
            },
            {
                _id: `msg_${now}_5`,
                sender_id: otherUserId,
                receiver_id: isGroup ? null : currentUser._id,
                group_id: isGroup ? chatId : null,
                message: `Bien sûr, je suis là pour vous aider. Quelles sont vos questions?`,
                sent_at: new Date(now - 3200000).toISOString(),
                is_read: true,
                sender: { name: otherUserName }
            }
        ];
    };

    // Load messages for the active chat
    const loadMessages = async (showLoading = true) => {
        if (showLoading) {
            setIsLoading(true);
        }
        try {
            if (activeChat.type === 'direct') {
                try {
                    console.log("Fetching conversation between users", currentUser._id, "and", activeChat.user._id);
                    const response = await chatClient.getConversation(
                        currentUser._id,
                        activeChat.user._id
                    );

                    console.log("Conversation response:", response);

                    if (response && Array.isArray(response.messages)) {
                        if (response.messages.length > 0) {
                            console.log("Found messages for conversation:", response.messages);
                            // Assurez-vous que chaque message a un ID et un expéditeur
                            const processedMessages = response.messages.map(msg => {
                                // Si le message n'a pas d'ID, en générer un temporaire
                                if (!msg._id) {
                                    msg._id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                                }
                                // Ajouter des informations sur l'expéditeur si nécessaire
                                if (msg.sender_id === currentUser._id) {
                                    msg.sender = currentUser;
                                } else if (!msg.sender) {
                                    msg.sender = activeChat.user;
                                }
                                return msg;
                            });
                            setMessages(processedMessages);
                        } else {
                            console.log("No messages found in response, checking if we have a lastMessage");
                            // Vérifier si nous avons un dernier message dans la conversation active
                            if (activeChat.lastMessage && activeChat.lastMessage.message !== "Démarrer une conversation...") {
                                console.log("Using lastMessage from activeChat:", activeChat.lastMessage);
                                const lastMsg = {...activeChat.lastMessage};
                                if (!lastMsg._id) {
                                    lastMsg._id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                                }
                                if (lastMsg.sender_id === currentUser._id) {
                                    lastMsg.sender = currentUser;
                                } else if (!lastMsg.sender) {
                                    lastMsg.sender = activeChat.user;
                                }
                                setMessages([lastMsg]);
                            } else {
                                console.log("No lastMessage found, using empty array");
                                // Utiliser un tableau vide au lieu de messages fictifs
                                setMessages([]);
                            }
                        }
                    } else {
                        console.log("Invalid response format, using empty array");
                        // Utiliser un tableau vide au lieu de messages fictifs
                        setMessages([]);
                    }
                } catch (error) {
                    console.error('Error loading direct messages:', error);
                    // En cas d'erreur, utiliser des messages fictifs
                    setMessages(generateMockMessages(activeChat.user._id));
                }
            } else if (activeChat.type === 'group') {
                try {
                    const response = await chatClient.getGroupMessages(
                        activeChat._id,
                        currentUser._id
                    );
                    if (response && response.messages && response.messages.length > 0) {
                        setMessages(response.messages);
                    } else {
                        console.log("No group messages found or invalid response, using mock data");
                        // Utiliser des messages fictifs
                        setMessages(generateMockMessages(activeChat._id, true));
                    }
                } catch (error) {
                    console.error('Error loading group messages:', error);
                    // En cas d'erreur, utiliser des messages fictifs
                    setMessages(generateMockMessages(activeChat._id, true));
                }
            }
        } catch (error) {
            console.error('Error in loadMessages:', error);
            // Utiliser des messages fictifs en cas d'erreur générale
            if (activeChat.type === 'direct') {
                setMessages(generateMockMessages(activeChat.user._id));
            } else {
                setMessages(generateMockMessages(activeChat._id, true));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle sending a message
    const handleSendMessage = async (message, attachment = null, updatedMessages = null) => {
        try {
            // If updatedMessages is provided, just update the messages state
            if (updatedMessages) {
                setMessages(updatedMessages);
                return;
            }

            // Ensure message is a string
            const messageText = message || '';

            // If there's no message and no attachment, don't send anything
            if (messageText.trim() === '' && !attachment) {
                console.log('No message or attachment to send');
                return;
            }

            // Set a default message if there's an attachment but no message
            const finalMessage = messageText.trim() === '' && attachment ? 'Pièce jointe' : messageText;

            if (activeChat.type === 'direct') {
                const messageData = {
                    sender_id: currentUser._id,
                    receiver_id: activeChat.user._id,
                    message: finalMessage
                };

                if (attachment) {
                    try {
                        console.log('Sending direct message with attachment:', finalMessage);
                        // Try to send with attachment
                        const response = await chatClient.sendMessage(messageData, attachment);

                        // Add the message with attachment to the messages list
                        if (response && response.success && response.data) {
                            console.log('Message with attachment sent successfully:', response.data);
                            // Add the message to the UI
                            setMessages(prevMessages => [...prevMessages, response.data]);
                        }
                    } catch (attachmentError) {
                        console.error('Failed to send message with attachment:', attachmentError);

                        // Always try to send at least the text message
                        chatClient.emitPrivateMessage(messageData);
                    }
                } else {
                    // For faster UI update, emit through socket
                    console.log('Sending direct message without attachment:', finalMessage);

                    // Créer un objet message pour mettre à jour l'UI immédiatement
                    const newMessage = {
                        _id: `temp_${Date.now()}`,
                        sender_id: currentUser._id,
                        receiver_id: activeChat.user._id,
                        message: finalMessage,
                        sent_at: new Date().toISOString(),
                        is_read: false,
                        sender: currentUser // Ajouter les informations de l'expéditeur
                    };

                    // Ajouter le message à la liste des messages
                    setMessages(prevMessages => [...prevMessages, newMessage]);

                    // Mettre à jour la conversation dans la liste des conversations
                    // Cela va mettre à jour l'UI immédiatement sans recharger les données du serveur
                    updateConversationWithNewMessage(newMessage, activeChat.user);

                    // Envoyer le message via Socket.IO APRÈS avoir mis à jour l'UI
                    // Cela évite que le message soit ajouté deux fois
                    setTimeout(() => {
                        chatClient.emitPrivateMessage(messageData);
                    }, 10);
                }
            } else if (activeChat.type === 'group') {
                const messageData = {
                    group_id: activeChat._id,
                    sender_id: currentUser._id,
                    message: finalMessage
                };

                if (attachment) {
                    try {
                        console.log('Sending group message with attachment:', finalMessage);
                        // Try to send with attachment
                        const response = await chatClient.sendGroupMessage(messageData, attachment);

                        // Add the message with attachment to the messages list
                        if (response && response.success && response.data) {
                            console.log('Group message with attachment sent successfully:', response.data);
                            // Add the message to the UI
                            setMessages(prevMessages => [...prevMessages, response.data]);
                        }
                    } catch (attachmentError) {
                        console.error('Failed to send group message with attachment:', attachmentError);

                        // Always try to send at least the text message
                        chatClient.emitGroupMessage(messageData);
                    }
                } else {
                    // For faster UI update, emit through socket
                    console.log('Sending group message without attachment:', finalMessage);

                    // Créer un objet message pour mettre à jour l'UI immédiatement
                    const newMessage = {
                        _id: `temp_${Date.now()}`,
                        sender_id: currentUser._id,
                        group_id: activeChat._id,
                        message: finalMessage,
                        sent_at: new Date().toISOString(),
                        read_by: [currentUser._id],
                        sender: currentUser // Ajouter les informations de l'expéditeur
                    };

                    // Ajouter le message à la liste des messages
                    setMessages(prevMessages => [...prevMessages, newMessage]);

                    // Mettre à jour le groupe dans la liste des groupes
                    updateGroupWithNewMessage(newMessage, currentUser, activeChat);

                    // Envoyer le message via Socket.IO APRÈS avoir mis à jour l'UI
                    // Cela évite que le message soit ajouté deux fois
                    setTimeout(() => {
                        chatClient.emitGroupMessage(messageData);
                    }, 10);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Show error notification to user
            alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
        }
    };

    // Set up socket event listeners
    useEffect(() => {
        if (!currentUser) return;

        // Listen for new direct messages
        chatClient.onNewMessage((data) => {
            // If the message is from the active chat, add it to messages
            if (
                activeChat &&
                activeChat.type === 'direct' &&
                (data.message.sender_id === activeChat.user._id ||
                    data.message.receiver_id === activeChat.user._id)
            ) {
                setMessages((prevMessages) => {
                    // Vérifier si le message existe déjà (éviter les doublons)
                    const messageExists = prevMessages.some(
                        (m) => m._id === data.message._id ||
                              (m._id.startsWith('temp_') && m.message === data.message.message &&
                               new Date(m.sent_at).getTime() > new Date().getTime() - 60000)
                    );

                    if (messageExists) {
                        // Ne pas ajouter le message s'il existe déjà
                        return prevMessages;
                    } else {
                        // Si le message n'existe pas, l'ajouter
                        return [...prevMessages, data.message];
                    }
                });
            }

            // Update the conversations list
            updateConversationWithNewMessage(data.message, data.sender);
        });

        // Listen for new group messages
        chatClient.onNewGroupMessage((data) => {
            // If the message is from the active group, add it to messages
            if (
                activeChat &&
                activeChat.type === 'group' &&
                data.message.group_id === activeChat._id
            ) {
                setMessages((prevMessages) => {
                    // Vérifier si le message existe déjà (éviter les doublons)
                    const messageExists = prevMessages.some(
                        (m) => m._id === data.message._id ||
                              (m._id.startsWith('temp_') && m.message === data.message.message &&
                               new Date(m.sent_at).getTime() > new Date().getTime() - 60000)
                    );

                    if (messageExists) {
                        // Ne pas ajouter le message s'il existe déjà
                        return prevMessages;
                    } else {
                        // Si le message n'existe pas, l'ajouter
                        return [...prevMessages, data.message];
                    }
                });
            }

            // Update the groups list
            updateGroupWithNewMessage(data.message, data.sender, data.group);
        });

        // Listen for message sent confirmation
        chatClient.onMessageSent((message) => {
            // Remplacer le message temporaire par le message confirmé
            if (
                activeChat &&
                activeChat.type === 'direct' &&
                message.receiver_id === activeChat.user._id
            ) {
                setMessages((prevMessages) => {
                    // Vérifier si le message existe déjà (éviter les doublons)
                    const messageExists = prevMessages.some(
                        (m) => m._id === message._id ||
                              (m._id.startsWith('temp_') && m.message === message.message &&
                               new Date(m.sent_at).getTime() > new Date().getTime() - 60000)
                    );

                    if (messageExists) {
                        // Remplacer le message temporaire par le message confirmé
                        return prevMessages.map((m) => {
                            if (m._id.startsWith('temp_') && m.message === message.message &&
                                new Date(m.sent_at).getTime() > new Date().getTime() - 60000) {
                                return message;
                            }
                            return m;
                        });
                    } else {
                        // Si le message n'existe pas, l'ajouter
                        return [...prevMessages, message];
                    }
                });
            }
        });

        // Listen for group message sent confirmation
        chatClient.onGroupMessageSent((message) => {
            // Remplacer le message temporaire par le message confirmé
            if (
                activeChat &&
                activeChat.type === 'group' &&
                message.group_id === activeChat._id
            ) {
                setMessages((prevMessages) => {
                    // Vérifier si le message existe déjà (éviter les doublons)
                    const messageExists = prevMessages.some(
                        (m) => m._id === message._id ||
                              (m._id.startsWith('temp_') && m.message === message.message &&
                               new Date(m.sent_at).getTime() > new Date().getTime() - 60000)
                    );

                    if (messageExists) {
                        // Remplacer le message temporaire par le message confirmé
                        return prevMessages.map((m) => {
                            if (m._id.startsWith('temp_') && m.message === message.message &&
                                new Date(m.sent_at).getTime() > new Date().getTime() - 60000) {
                                return message;
                            }
                            return m;
                        });
                    } else {
                        // Si le message n'existe pas, l'ajouter
                        return [...prevMessages, message];
                    }
                });
            }
        });

        // Listen for message updates
        chatClient.onMessageUpdated((data) => {
            // If the message is from the active chat, update it in messages
            if (
                activeChat &&
                activeChat.type === 'direct'
            ) {
                setMessages((prevMessages) => {
                    return prevMessages.map(msg =>
                        msg._id === data.messageId
                            ? { ...msg, message: data.newMessage, edited: true, edited_at: data.edited_at }
                            : msg
                    );
                });
            }
        });

        // Listen for group message updates
        chatClient.onGroupMessageUpdated((data) => {
            // If the message is from the active group, update it in messages
            if (
                activeChat &&
                activeChat.type === 'group' &&
                data.groupId === activeChat._id
            ) {
                setMessages((prevMessages) => {
                    return prevMessages.map(msg =>
                        msg._id === data.messageId
                            ? { ...msg, message: data.newMessage, edited: true, edited_at: data.edited_at }
                            : msg
                    );
                });
            }
        });

        // Listen for message deletions
        chatClient.onMessageDeleted((messageId) => {
            // Remove the message from the UI
            setMessages((prevMessages) => {
                return prevMessages.filter(msg => msg._id !== messageId);
            });
        });

        // Listen for group message deletions
        chatClient.onGroupMessageDeleted((data) => {
            // If the message is from the active group, remove it from messages
            if (
                activeChat &&
                activeChat.type === 'group' &&
                data.groupId === activeChat._id
            ) {
                setMessages((prevMessages) => {
                    return prevMessages.filter(msg => msg._id !== data.messageId);
                });
            }
        });

        // Clean up listeners on unmount
        return () => {
            // Désenregistrer les écouteurs d'événements
            chatClient.offNewMessage();
            chatClient.offMessageSent();
            chatClient.offNewGroupMessage();
            chatClient.offGroupMessageSent();
            chatClient.offMessageUpdated();
            chatClient.offGroupMessageUpdated();
            chatClient.offMessageDeleted();
            chatClient.offGroupMessageDeleted();
        };
    }, [currentUser, activeChat]);

    // Update conversations list with a new message
    const updateConversationWithNewMessage = (message, sender) => {
        console.log("Updating conversation with new message:", { message, sender });

        // Mettre à jour l'UI immédiatement pour une meilleure réactivité
        setConversations((prevConversations) => {
            // Vérifier si la conversation existe déjà
            const existingConvIndex = prevConversations.findIndex(
                (conv) => conv.user && sender && conv.user._id === sender._id
            );

            console.log("Existing conversation index:", existingConvIndex);

            let updatedConversations = [...prevConversations];

            if (existingConvIndex !== -1) {
                // Mettre à jour la conversation existante
                console.log("Updating existing conversation");
                updatedConversations[existingConvIndex] = {
                    ...updatedConversations[existingConvIndex],
                    lastMessage: message,
                    unreadCount:
                        message.sender_id !== currentUser._id
                            ? updatedConversations[existingConvIndex].unreadCount + 1
                            : updatedConversations[existingConvIndex].unreadCount
                };

                // Si c'est la conversation active, mettre à jour les messages
                if (activeChat &&
                    activeChat.type === 'direct' &&
                    activeChat.user._id === sender._id) {
                    console.log("This is the active chat, updating messages");
                    setMessages(prevMessages => {
                        // Vérifier si le message existe déjà (éviter les doublons)
                        const messageExists = prevMessages.some(
                            (m) => m._id === message._id ||
                                  (m._id.startsWith('temp_') && m.message === message.message &&
                                   new Date(m.sent_at).getTime() > new Date().getTime() - 60000)
                        );

                        if (messageExists) {
                            // Ne pas ajouter le message s'il existe déjà
                            return prevMessages;
                        } else {
                            // Si le message n'existe pas, l'ajouter
                            return [...prevMessages, message];
                        }
                    });
                }
            } else {
                // Ajouter une nouvelle conversation en haut de la liste
                console.log("Adding new conversation with sender:", sender);
                if (sender && sender._id) {
                    // S'assurer que le sender a toutes les propriétés nécessaires
                    const enhancedSender = {
                        ...sender,
                        // Ajouter un statut par défaut si non défini
                        status: sender.status || 'online',
                        // S'assurer que le nom est défini
                        name: sender.name || `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Utilisateur',
                        // S'assurer que l'image de profil est définie
                        profileImage: sender.profileImage || sender.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.name || `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Utilisateur')}&background=4a6bff&color=fff`
                    };

                    console.log("Enhanced sender:", enhancedSender);

                    const newConversation = {
                        user: enhancedSender,
                        lastMessage: message,
                        unreadCount: message.sender_id !== currentUser._id ? 1 : 0
                    };

                    // Ajouter la nouvelle conversation au début du tableau
                    updatedConversations = [newConversation, ...updatedConversations];

                    // Si c'est la conversation active, mettre à jour les messages
                    if (activeChat &&
                        activeChat.type === 'direct' &&
                        activeChat.user._id === sender._id) {
                        console.log("This is the active chat, updating messages");
                        setMessages(prevMessages => {
                            // Vérifier si le message existe déjà (éviter les doublons)
                            const messageExists = prevMessages.some(
                                (m) => m._id === message._id ||
                                      (m._id.startsWith('temp_') && m.message === message.message &&
                                       new Date(m.sent_at).getTime() > new Date().getTime() - 60000)
                            );

                            if (messageExists) {
                                // Ne pas ajouter le message s'il existe déjà
                                return prevMessages;
                            } else {
                                // Si le message n'existe pas, l'ajouter
                                return [...prevMessages, message];
                            }
                        });
                    }
                } else {
                    console.error("Invalid sender object:", sender);
                }
            }

            // Trier les conversations par date du dernier message (les plus récentes en haut)
            updatedConversations.sort((a, b) => {
                if (!a.lastMessage || !a.lastMessage.sent_at) return 1;
                if (!b.lastMessage || !b.lastMessage.sent_at) return -1;

                const dateA = new Date(a.lastMessage.sent_at);
                const dateB = new Date(b.lastMessage.sent_at);
                return dateB - dateA; // Ordre décroissant (plus récent en premier)
            });

            console.log("Updated conversations:", updatedConversations.map(c => ({
                user: c.user ? c.user.name : 'Unknown',
                lastMessage: c.lastMessage ? c.lastMessage.message : 'No message',
                sent_at: c.lastMessage ? c.lastMessage.sent_at : 'No date'
            })));

            // Sauvegarder les conversations mises à jour dans le localStorage
            if (currentUser && currentUser._id) {
                chatClient.saveConversationsToLocalStorage(currentUser._id, updatedConversations);
            }

            // Si le message vient de l'utilisateur actuel, basculer vers l'onglet Récents
            if (message.sender_id === currentUser._id) {
                // Utiliser setTimeout pour éviter les problèmes de rendu React
                setTimeout(() => {
                    setActiveTab('users');
                }, 100);
            }

            return updatedConversations;
        });

        // Si nous avons reçu un message et que nous n'avons pas de conversation active,
        // ou si la conversation active n'est pas celle qui a reçu le message,
        // afficher une notification
        if (message.sender_id !== currentUser._id &&
            (!activeChat ||
             activeChat.type !== 'direct' ||
             activeChat.user._id !== sender._id)) {
            console.log("Received message from another user, showing notification");
            // Ici, vous pourriez ajouter une notification visuelle ou sonore
            // Par exemple, jouer un son ou afficher une notification toast
        }
    };

    // Update groups list with a new message
    const updateGroupWithNewMessage = (message, sender, group) => {
        console.log("Updating group with new message:", { message, sender, group });

        // Mettre à jour l'UI immédiatement pour une meilleure réactivité
        setGroups((prevGroups) => {
            // Vérifier si le groupe existe déjà
            const existingGroupIndex = prevGroups.findIndex(
                (g) => g._id === group._id
            );

            console.log("Existing group index:", existingGroupIndex);

            let updatedGroups = [...prevGroups];

            if (existingGroupIndex !== -1) {
                // Mettre à jour le groupe existant
                console.log("Updating existing group");
                updatedGroups[existingGroupIndex] = {
                    ...updatedGroups[existingGroupIndex],
                    lastMessage: message,
                    unreadCount:
                        message.sender_id !== currentUser?._id
                            ? updatedGroups[existingGroupIndex].unreadCount + 1
                            : updatedGroups[existingGroupIndex].unreadCount
                };

                // Si c'est le groupe actif, mettre à jour les messages
                if (activeChat &&
                    activeChat.type === 'group' &&
                    activeChat._id === group._id) {
                    console.log("This is the active group, updating messages");
                    setMessages(prevMessages => {
                        // Vérifier si le message existe déjà (éviter les doublons)
                        const messageExists = prevMessages.some(
                            (m) => m._id === message._id ||
                                  (m._id.startsWith('temp_') && m.message === message.message &&
                                   new Date(m.sent_at).getTime() > new Date().getTime() - 60000)
                        );

                        if (messageExists) {
                            // Ne pas ajouter le message s'il existe déjà
                            return prevMessages;
                        } else {
                            // Si le message n'existe pas, l'ajouter
                            return [...prevMessages, message];
                        }
                    });
                }
            } else {
                // Si le groupe n'existe pas, c'est une erreur
                console.error("Group not found in groups list:", group);
            }

            // Trier les groupes par date du dernier message (les plus récents en haut)
            updatedGroups.sort((a, b) => {
                if (!a.lastMessage || !a.lastMessage.sent_at) return 1;
                if (!b.lastMessage || !b.lastMessage.sent_at) return -1;

                const dateA = new Date(a.lastMessage.sent_at);
                const dateB = new Date(b.lastMessage.sent_at);
                return dateB - dateA; // Ordre décroissant (plus récent en premier)
            });

            console.log("Updated groups:", updatedGroups.map(g => ({
                name: g.name,
                lastMessage: g.lastMessage ? g.lastMessage.message : 'No message',
                sent_at: g.lastMessage ? g.lastMessage.sent_at : 'No date'
            })));

            // Sauvegarder les groupes mis à jour dans le localStorage
            if (currentUser && currentUser._id) {
                chatClient.saveGroupsToLocalStorage(currentUser._id, updatedGroups);
            }

            // Si le message vient de l'utilisateur actuel, basculer vers l'onglet Groupes
            if (message.sender_id === currentUser?._id) {
                // Utiliser setTimeout pour éviter les problèmes de rendu React
                setTimeout(() => {
                    setActiveTab('groups');
                }, 100);
            }

            return updatedGroups;
        });

        // Si nous avons reçu un message et que nous n'avons pas de groupe actif,
        // ou si le groupe actif n'est pas celui qui a reçu le message,
        // afficher une notification
        if (message.sender_id !== currentUser?._id &&
            (!activeChat ||
             activeChat.type !== 'group' ||
             activeChat._id !== group._id)) {
            console.log("Received message from another user in a group, showing notification");
            // Ici, vous pourriez ajouter une notification visuelle ou sonore
            // Par exemple, jouer un son ou afficher une notification toast
        }
    };

    // Handle chat selection
    const handleChatSelect = (chat, type) => {
        console.log("Chat selected:", chat, "Type:", type);

        // Vérifier si nous avons déjà une conversation active
        const wasActiveChat = activeChat;

        // Définir la nouvelle conversation active
        setActiveChat({ ...chat, type });

        // Si l'utilisateur vient de l'onglet Contacts, créer une nouvelle conversation
        if (type === 'direct' && activeTab === 'contacts') {
            console.log("Creating new conversation from contact");

            // Vérifier si cette conversation existe déjà
            const existingConvIndex = conversations.findIndex(
                (conv) => conv.user && chat.user && conv.user._id === chat.user._id
            );

            if (existingConvIndex === -1) {
                console.log("This is a new conversation, adding to conversations list");

                // Créer une nouvelle conversation
                const newConversation = {
                    user: chat.user || chat, // Prendre l'utilisateur du chat ou le chat lui-même si c'est un contact
                    lastMessage: {
                        message: "Démarrer une conversation...",
                        sent_at: new Date().toISOString(),
                        is_read: true
                    },
                    unreadCount: 0
                };

                // Ajouter la nouvelle conversation à la liste
                setConversations(prevConversations => {
                    const updatedConversations = [newConversation, ...prevConversations];

                    // Sauvegarder les conversations mises à jour dans le localStorage
                    if (currentUser && currentUser._id) {
                        chatClient.saveConversationsToLocalStorage(currentUser._id, updatedConversations);
                    }

                    return updatedConversations;
                });

                // Basculer vers l'onglet Récents
                setActiveTab('users');
            } else {
                console.log("Conversation already exists at index:", existingConvIndex);

                // Utiliser la conversation existante pour avoir les derniers messages
                const existingConversation = conversations[existingConvIndex];
                console.log("Using existing conversation:", existingConversation);

                // Mettre à jour la conversation active avec les données de la conversation existante
                setActiveChat({ ...existingConversation, type });
            }
        }

        // Si nous changeons de conversation, forcer le rechargement des messages
        if (!wasActiveChat ||
            (wasActiveChat.type !== type) ||
            (type === 'direct' && wasActiveChat.user._id !== chat.user._id) ||
            (type === 'group' && wasActiveChat._id !== chat._id)) {
            console.log("Chat changed, forcing message reload");
            // Utiliser setTimeout pour s'assurer que activeChat est mis à jour avant de charger les messages
            setTimeout(() => {
                loadMessages(true);
            }, 100);
        }

        // Mark messages as read when selecting a chat
        if (type === 'direct') {
            setConversations((prevConversations) => {
                return prevConversations.map((conv) => {
                    if (conv.user._id === chat.user._id) {
                        return { ...conv, unreadCount: 0 };
                    }
                    return conv;
                });
            });
        } else if (type === 'group') {
            setGroups((prevGroups) => {
                return prevGroups.map((group) => {
                    if (group._id === chat._id) {
                        return { ...group, unreadCount: 0 };
                    }
                    return group;
                });
            });
        }
    };

    // Handle search
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    // Filter conversations, groups, and contacts based on search query
    const filteredConversations = conversations.filter((conv) => {
        // Vérifier que conv et conv.user existent
        if (!conv || !conv.user) return false;

        // Obtenir le nom de l'utilisateur, en utilisant différentes propriétés possibles
        const userName = conv.user.name ||
                        `${conv.user.firstName || ''} ${conv.user.lastName || ''}`.trim() ||
                        'Utilisateur';

        // Vérifier si le nom contient la recherche
        return userName.toLowerCase().includes((searchQuery || '').toLowerCase());
    });

    const filteredGroups = groups.filter((group) => {
        // Vérifier que group existe et que group.name est une chaîne
        return group && typeof group.name === 'string' &&
            group.name.toLowerCase().includes((searchQuery || '').toLowerCase());
    });

    // Filter contacts by search query
    const filteredContacts = {};
    Object.keys(contacts || {}).forEach((letter) => {
        // Vérifier que contacts[letter] existe
        if (contacts[letter] && Array.isArray(contacts[letter])) {
            const filteredLetterContacts = contacts[letter].filter((contact) => {
                // Vérifier que contact existe et que contact.name est une chaîne
                return contact && typeof contact.name === 'string' &&
                    contact.name.toLowerCase().includes((searchQuery || '').toLowerCase());
            });
            if (filteredLetterContacts.length > 0) {
                filteredContacts[letter] = filteredLetterContacts;
            }
        }
    });

    // Toggle view mode
    const toggleViewMode = () => {
        if (viewMode === 'fullscreen') {
            setViewMode('popup');
            setShowPopup(true);
        } else {
            setViewMode('fullscreen');
            setShowPopup(false);
        }
    };

    // Close popup
    const closePopup = () => {
        setShowPopup(false);
    };

    // Handle group creation
    const handleGroupCreated = (newGroup) => {
        console.log('New group created:', newGroup);

        // Add the new group to the groups list
        setGroups(prevGroups => {
            const updatedGroups = [newGroup, ...prevGroups];

            // Save groups to localStorage
            if (currentUser && currentUser._id) {
                chatClient.saveGroupsToLocalStorage(currentUser._id, updatedGroups);
            }

            return updatedGroups;
        });

        // Switch to groups tab
        setActiveTab('groups');

        // Select the new group
        setTimeout(() => {
            onChatSelect(newGroup, 'group');
        }, 100);
    };

    // Render based on view mode
    if (viewMode === 'fullscreen') {
        return (
            <div >
                <div >
                    {/* Page Header */}
                    <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
                        <div>
                            <nav>
                                <ol className="breadcrumb mb-1">
                                    <li className="breadcrumb-item"><a href="javascript:void(0);">Pages</a></li>
                                    <li className="breadcrumb-item active" aria-current="page">Chat</li>
                                </ol>
                            </nav>
                            <h1 className="page-title fw-medium fs-18 mb-0">Chat</h1>
                        </div>
                        <div className="btn-list">
                            <button className="btn btn-white btn-wave" onClick={toggleViewMode}>
                                <i className="ri-contract-left-right-line align-middle me-1 lh-1"></i> Mode Popup
                            </button>
                            <button className="btn btn-primary btn-wave me-0">
                                <i className="ri-share-forward-line me-1"></i> Share
                            </button>
                        </div>
                    </div>
                    {/* Page Header Close */}

                    <div className="container-fluid">
                        <div className="row justify-content-center">
                            <div className="col-12">
                                <div className="main-chart-wrapper mb-0 d-flex" style={{ height: 'calc(100vh - 180px)', gap: '30px' }}>
                                    {/* Chat Sidebar - Limité à 30% de la largeur avec marge à gauche */}
                                    <div className="chat-sidebar-container" style={{ width: '30%', maxWidth: '350px', minWidth: '280px', marginLeft: '20px' }}>
                                        <ChatSidebar
                                            conversations={filteredConversations}
                                            groups={filteredGroups}
                                            contacts={filteredContacts}
                                            activeChat={activeChat}
                                            activeTab={activeTab}
                                            setActiveTab={setActiveTab}
                                            onChatSelect={handleChatSelect}
                                            searchQuery={searchQuery}
                                            onSearch={handleSearch}
                                            currentUser={currentUser}
                                            onCreateGroup={() => setShowCreateGroupModal(true)}
                                        />
                                    </div>

                                    {/* Chat Window - Prend le reste de l'espace avec marge à droite */}
                                    <div className="chat-window-container" style={{ flex: '1', minWidth: '0', marginRight: '10px' }}>
                                        {activeChat ? (
                                            <ChatWindow
                                                chat={activeChat}
                                                messages={messages}
                                                currentUser={currentUser}
                                                onSendMessage={handleSendMessage}
                                                isLoading={isLoading}
                                            />
                                        ) : (
                                            <div className="chat-window-placeholder">
                                                <div className="text-center welcome-chat-container">
                                                    <div className="welcome-chat-icon">
                                                        <i className="ri-chat-smile-3-line"></i>
                                                    </div>
                                                    <h4 className="welcome-chat-title">Bienvenue dans votre espace de discussion!</h4>
                                                    <p className="welcome-chat-subtitle">Sélectionnez une conversation dans la liste pour commencer à échanger</p>
                                                    <div className="welcome-chat-features">
                                                        <div className="welcome-feature">
                                                            <i className="ri-message-2-line"></i>
                                                            <span>Messages instantanés</span>
                                                        </div>
                                                        <div className="welcome-feature">
                                                            <i className="ri-group-line"></i>
                                                            <span>Discussions de groupe</span>
                                                        </div>
                                                        <div className="welcome-feature">
                                                            <i className="ri-attachment-2"></i>
                                                            <span>Partage de fichiers</span>
                                                        </div>
                                                    </div>
                                                    <div className="welcome-chat-action">
                                                        <button className="btn btn-primary" onClick={() => setActiveTab('contacts')}>
                                                            <i className="ri-user-add-line me-1"></i>
                                                            Nouvelle conversation
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create Group Modal */}
                <CreateGroupModal
                    isOpen={showCreateGroupModal}
                    onClose={() => setShowCreateGroupModal(false)}
                    onGroupCreated={handleGroupCreated}
                    currentUser={currentUser}
                    contacts={contacts}
                />
            </div>
        );
    } else if (showPopup) {
        return (
            <>
                <ChatPopup
                    onClose={closePopup}
                    currentUser={currentUser}
                    onCreateGroup={() => setShowCreateGroupModal(true)}
                />

                {/* Create Group Modal */}
                <CreateGroupModal
                    isOpen={showCreateGroupModal}
                    onClose={() => setShowCreateGroupModal(false)}
                    onGroupCreated={handleGroupCreated}
                    currentUser={currentUser}
                    contacts={contacts}
                />
            </>
        );
    } else {
        return <ChatFloatingButton onClick={() => setShowPopup(true)} />;
    }
};

export default ChatComponent;
