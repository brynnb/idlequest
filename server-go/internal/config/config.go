package config

import (
	"embed"
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

//go:embed key.pem
var keyPEMData embed.FS

//go:embed eqgo_config.json
var configData embed.FS

//go:embed discord.txt
var discordKeyData embed.FS

func GetDiscordKey() (string, error) {
	data, err := discordKeyData.ReadFile("discord.txt")
	if err != nil {
		return "", fmt.Errorf("failed to read embedded discord key: %w", err)
	}
	key := strings.TrimSpace(string(data))
	return key, nil
}

func GetCert() (string, error) {
	data, err := keyPEMData.ReadFile("key.pem")
	if err != nil {
		return "", fmt.Errorf("failed to read embedded cert: %w", err)
	}
	key := strings.TrimSpace(string(data))
	return key, nil
}

type Config struct {
	DBHost      string `json:"db_host"`
	DBPort      int    `json:"db_port"`
	DBUser      string `json:"db_user"`
	DBPass      string `json:"db_pass"`
	DBName      string `json:"db_name"`
	Local       bool   `json:"local"`
	LocalQuests bool   `json:"localQuests"`
	GracePeriod int    `json:"gracePeriod"`
}

var config *Config

func Get() (*Config, error) {
	if config != nil {
		return config, nil
	}

	// Initialize with default values
	config = &Config{
		DBHost:      "127.0.0.1", // Default host
		DBPort:      3306,        // Default MySQL port
		DBUser:      "root",      // Default user
		DBPass:      "",          // Default empty password
		DBName:      "eqgo",      // Default database name
		Local:       true,        // Default local setting
		LocalQuests: false,       // Default local setting
		GracePeriod: 5,           // Default local setting
	}

	// Load embedded default config (public-safe values)
	data, err := configData.ReadFile("eqgo_config.json")
	if err == nil {
		_ = json.Unmarshal(data, config)
	}

	// Optionally override from local file on disk (not embedded, gitignored)
	// This allows developers to keep real credentials in eqgo_config.local.json
	// without committing them to the public repository.
	if localData, err := os.ReadFile("internal/config/eqgo_config.local.json"); err == nil {
		_ = json.Unmarshal(localData, config)
	}

	return config, nil
}
