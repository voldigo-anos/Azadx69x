const bannedUsersCache = new Map(); // Stockage temporaire des compteurs de spam
const systemStats = {
    totalBans: 0,
    activeUsers: 0
};

const CONFIG = {
    limit: 10,          // Max commandes par minute
    window: 60000,      // Fenêtre de 60 secondes
    warning: 8,         // Alerte à 8 commandes
    durations: {
        1: 3600000,     // 1 heure
        2: 7200000,     // 2 heures
        3: 10800000,    // 3 heures
        4: 86400000,    // 1 jour
        5: -1           // Permanent
    }
};

module.exports = {
    initialize: function (usersData) {
        this.usersData = usersData;
    },

    /**
     * Vérifie si un utilisateur est banni et gère l'auto-unban
     */
    isUserBanned: async function (uid, usersData) {
        const userData = await usersData.get(uid);
        if (!userData || !userData.banned || !userData.banned.status) {
            return { banned: false };
        }

        const banInfo = userData.banned;
        
        // Si c'est un ban permanent
        if (banInfo.duration === -1) {
            return { banned: true, reason: banInfo.reason, type: "Permanent", timeLeft: -1 };
        }

        // Vérification du temps restant
        const now = Date.now();
        const timeLeft = banInfo.expiry - now;

        if (timeLeft <= 0) {
            // Auto-unban si le temps est écoulé
            await this.manualUnban(uid, usersData, false);
            return { banned: false };
        }

        return { 
            banned: true, 
            reason: banInfo.reason, 
            type: banInfo.type || "Automatique", 
            timeLeft: timeLeft 
        };
    },

    /**
     * Retourne les statistiques de spam pour un utilisateur
     */
    getBanStats: async function (uid) {
        const user = bannedUsersCache.get(uid) || { count: 0, warnings: 0 };
        const data = await this.usersData.get(uid);
        
        return {
            totalBans: data?.banned?.historyCount || 0,
            currentCommands: user.count,
            warnings: user.count >= CONFIG.warning ? 1 : 0
        };
    },

    /**
     * Débloque un utilisateur
     */
    manualUnban: async function (uid, usersData, resetHistory) {
        try {
            const data = await usersData.get(uid);
            if (!data) return false;

            const updateData = {
                'banned.status': false,
                'banned.reason': '',
                'banned.expiry': 0
            };

            if (resetHistory) {
                updateData['banned.historyCount'] = 0;
            }

            await usersData.set(uid, updateData);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    },

    /**
     * Statistiques globales du système
     */
    getSystemStats: function () {
        return {
            totalUsers: bannedUsersCache.size,
            activeUsers: Array.from(bannedUsersCache.values()).filter(u => u.count > 0).length,
            totalBannedUsers: systemStats.totalBans,
            commandLimit: CONFIG.limit,
            timeWindow: CONFIG.window
        };
    },

    /**
     * Formate les millisecondes en texte lisible
     */
    formatDuration: function (ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    }
};
