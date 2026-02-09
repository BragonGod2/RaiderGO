/**
 * League of Legends Data Dragon Service
 * Fetches and caches champion, item, rune, and summoner data from Riot's CDN
 */

const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

class LolDataService {
    constructor() {
        this.version = null;
        this.cache = {
            champions: null,
            items: null,
            runes: null,
            summoners: null,
            timestamp: null
        };
    }

    /**
     * Get the latest Data Dragon version
     */
    async getLatestVersion() {
        if (this.version) return this.version;

        try {
            const response = await fetch(`${DDRAGON_BASE}/api/versions.json`);
            const versions = await response.json();
            this.version = versions[0]; // Latest version
            return this.version;
        } catch (error) {
            console.error('Failed to fetch Data Dragon version:', error);
            // Fallback to a known stable version
            this.version = '14.1.1';
            return this.version;
        }
    }

    /**
     * Check if cache is valid
     */
    isCacheValid() {
        if (!this.cache.timestamp) return false;
        return Date.now() - this.cache.timestamp < CACHE_DURATION;
    }

    /**
     * Fetch all champions
     */
    async getChampions() {
        if (this.cache.champions && this.isCacheValid()) {
            return this.cache.champions;
        }

        try {
            const version = await this.getLatestVersion();
            const response = await fetch(
                `${DDRAGON_BASE}/cdn/${version}/data/en_US/champion.json`
            );
            const data = await response.json();

            // Convert to array and add image URLs
            const champions = Object.values(data.data).map(champ => ({
                id: champ.id,
                key: champ.key,
                name: champ.name,
                title: champ.title,
                tags: champ.tags,
                icon: `${DDRAGON_BASE}/cdn/${version}/img/champion/${champ.id}.png`,
                splash: `${DDRAGON_BASE}/cdn/img/champion/splash/${champ.id}_0.jpg`,
                loading: `${DDRAGON_BASE}/cdn/img/champion/loading/${champ.id}_0.jpg`
            }));

            this.cache.champions = champions;
            this.cache.timestamp = Date.now();
            return champions;
        } catch (error) {
            console.error('Failed to fetch champions:', error);
            return [];
        }
    }

    /**
     * Fetch all items
     */
    async getItems() {
        if (this.cache.items && this.isCacheValid()) {
            return this.cache.items;
        }

        try {
            const version = await this.getLatestVersion();
            const response = await fetch(
                `${DDRAGON_BASE}/cdn/${version}/data/en_US/item.json`
            );
            const data = await response.json();

            // Convert to array and filter out special items
            const items = Object.entries(data.data)
                .filter(([id, item]) => {
                    // Filter out ornn items, trinkets, and other special items
                    return !item.requiredChampion &&
                        !item.specialRecipe &&
                        item.gold?.purchasable !== false &&
                        !item.name.includes('Quick Charge') &&
                        item.maps?.['11'] !== false; // Summoner's Rift
                })
                .map(([id, item]) => ({
                    id: parseInt(id),
                    name: item.name,
                    description: item.description,
                    plaintext: item.plaintext,
                    gold: item.gold,
                    tags: item.tags,
                    icon: `${DDRAGON_BASE}/cdn/${version}/img/item/${id}.png`
                }));

            this.cache.items = items;
            this.cache.timestamp = Date.now();
            return items;
        } catch (error) {
            console.error('Failed to fetch items:', error);
            return [];
        }
    }

    /**
     * Fetch runes reforged
     */
    async getRunes() {
        if (this.cache.runes && this.isCacheValid()) {
            return this.cache.runes;
        }

        try {
            const version = await this.getLatestVersion();
            const response = await fetch(
                `${DDRAGON_BASE}/cdn/${version}/data/en_US/runesReforged.json`
            );
            const runes = await response.json();

            // Add image URLs to runes
            const processedRunes = runes.map(tree => ({
                ...tree,
                icon: `${DDRAGON_BASE}/cdn/img/${tree.icon}`,
                slots: tree.slots.map(slot => ({
                    runes: slot.runes.map(rune => ({
                        ...rune,
                        icon: `${DDRAGON_BASE}/cdn/img/${rune.icon}`
                    }))
                }))
            }));

            this.cache.runes = processedRunes;
            this.cache.timestamp = Date.now();
            return processedRunes;
        } catch (error) {
            console.error('Failed to fetch runes:', error);
            return [];
        }
    }

    /**
     * Fetch summoner spells
     */
    async getSummonerSpells() {
        if (this.cache.summoners && this.isCacheValid()) {
            return this.cache.summoners;
        }

        try {
            const version = await this.getLatestVersion();
            const response = await fetch(
                `${DDRAGON_BASE}/cdn/${version}/data/en_US/summoner.json`
            );
            const data = await response.json();

            // Filter to only include Summoner's Rift spells
            const summoners = Object.values(data.data)
                .filter(spell => {
                    // Include common summoner spells for SR
                    return spell.modes?.includes('CLASSIC') ||
                        ['SummonerFlash', 'SummonerDot', 'SummonerHeal', 'SummonerBoost',
                            'SummonerExhaust', 'SummonerHaste', 'SummonerBarrier', 'SummonerTeleport',
                            'SummonerSmite'].includes(spell.id);
                })
                .map(spell => ({
                    id: spell.id,
                    key: spell.key,
                    name: spell.name,
                    description: spell.description,
                    icon: `${DDRAGON_BASE}/cdn/${version}/img/spell/${spell.id}.png`
                }));

            this.cache.summoners = summoners;
            this.cache.timestamp = Date.now();
            return summoners;
        } catch (error) {
            console.error('Failed to fetch summoner spells:', error);
            return [];
        }
    }

    /**
     * Get champion by ID
     */
    async getChampionById(id) {
        const champions = await this.getChampions();
        return champions.find(c => c.id === id || c.key === id);
    }

    /**
     * Get item by ID
     */
    async getItemById(id) {
        const items = await this.getItems();
        return items.find(i => i.id === parseInt(id));
    }

    /**
     * Search champions by name
     */
    async searchChampions(query) {
        const champions = await this.getChampions();
        const lowerQuery = query.toLowerCase();
        return champions.filter(c =>
            c.name.toLowerCase().includes(lowerQuery) ||
            c.title.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Clear cache (useful for forcing refresh)
     */
    clearCache() {
        this.cache = {
            champions: null,
            items: null,
            runes: null,
            summoners: null,
            timestamp: null
        };
        this.version = null;
    }
}

// Export singleton instance
export const lolDataService = new LolDataService();
export default lolDataService;
