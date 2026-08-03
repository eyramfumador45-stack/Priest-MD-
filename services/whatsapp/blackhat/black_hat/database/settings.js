const { createModel, Op, DataTypes } = require("./miniModel");
const path = require("path");
const config = require("../../../../../config/config");

const packageJson = require("../../../../../package.json");

const SettingsDB = createModel("SettingsDB", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, { persist: true });

const DEFAULT_SETTINGS = {
    PREFIX: (config.bot && config.bot.prefixes && config.bot.prefixes[0]) || ".",
    OWNER_NAME: (config.bot && config.bot.ownerName) || "Inkora Systems",
    OWNER_NUMBER: (Array.isArray(config.owner) && config.owner[0]) || "",
    BOT_NAME: (config.bot && config.bot.name) || "Priest MD",
    FOOTER: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ Inkora Systems",
    CAPTION: `©${new Date().getFullYear()} PRIEST MD — Inkora Systems`,
    BOT_PIC: "",
    VERSION: packageJson.version || "1.0.0",
    MODE: "public",
    WARN_COUNT: "3",
    TIME_ZONE: process.env.TIME_ZONE || "UTC",
    DM_PRESENCE: "online",
    GC_PRESENCE: "online",
    CHATBOT: "false",
    CHATBOT_MODE: "inbox",
    STARTING_MESSAGE: "true",
    ANTIDELETE: "indm",
    ANTI_EDIT: "indm",
    ANTICALL: "false",
    ANTICALL_MSG: "*_📞 Auto Call Reject Mode Active. 📵 No Calls Allowed!_*",
    AUTO_LIKE_STATUS: config.AUTO_LIKE_STATUS || "true",
    AUTO_READ_STATUS: config.AUTO_READ_STATUS || "true",
    STATUS_LIKE_EMOJIS: "💛,❤️,💜,🤍,💙",
    AUTO_REPLY_STATUS: "false",
    STATUS_REPLY_TEXT: "*ʏᴏᴜʀ sᴛᴀᴛᴜs ᴠɪᴇᴡᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ ✅*",
    AUTO_REACT: "off",
    AUTO_REPLY: "false",
    AUTO_READ_MESSAGES: "off",
    AUTO_BIO: "false",
    AUTO_BLOCK: "",
    YT: "",
    NEWSLETTER_JID: "",
    GC_JID: "",
    NEWSLETTER_URL: "",
    BOT_REPO: "",
    PACK_NAME: (config.bot && config.bot.name) || "Priest MD",
    PACK_AUTHOR: (config.bot && config.bot.ownerName) || "Inkora Systems",
    SUDO_NUMBERS: "",
    PM_PERMIT: "false",
    ANTIVIEWONCE: "indm",
};

let initialized = false;

const GROUP_ONLY_SETTINGS = [
    "WELCOME_MESSAGE",
    "GOODBYE_MESSAGE",
    "GROUP_EVENTS",
    "ANTILINK",
];

async function initializeSettings() {
    if (initialized) return;

    await SettingsDB.sync();

    await SettingsDB.destroy({
        where: { key: GROUP_ONLY_SETTINGS },
    });

    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
        await SettingsDB.findOrCreate({
            where: { key },
            defaults: { key, value: defaultValue },
        });
    }

    initialized = true;
    console.log("✅ Bot Settings Initialized");
}

async function getSetting(key) {
    if (!initialized) await initializeSettings();

    const record = await SettingsDB.findOne({ where: { key } });
    if (record) {
        return record.value;
    }

    return DEFAULT_SETTINGS[key] || null;
}

async function setSetting(key, value) {
    if (!initialized) await initializeSettings();

    const [record, created] = await SettingsDB.findOrCreate({
        where: { key },
        defaults: { key, value },
    });

    if (!created) {
        record.value = value;
        await record.save();
    }

    return true;
}

async function getAllSettings() {
    if (!initialized) await initializeSettings();

    const records = await SettingsDB.findAll();
    const settings = {};
    for (const record of records) {
        settings[record.key] = record.value;
    }
    return settings;
}

async function resetSetting(key) {
    if (!initialized) await initializeSettings();

    const defaultValue = DEFAULT_SETTINGS[key];
    if (defaultValue !== undefined) {
        await setSetting(key, defaultValue);
        return defaultValue;
    }
    return null;
}

async function resetAllSettings() {
    if (!initialized) await initializeSettings();

    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
        await setSetting(key, defaultValue);
    }
    return true;
}

module.exports = {
    SettingsDB,
    DEFAULT_SETTINGS,
    initializeSettings,
    getSetting,
    setSetting,
    getAllSettings,
    resetSetting,
    resetAllSettings,
};
