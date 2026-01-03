package main

import (
	"fmt"
	"log"

	"idlequest/internal/config"

	"github.com/go-jet/jet/v2/generator/mysql"
)

func getConnection() (mysql.DBConnection, error) {
	serverConfig, err := config.Get()
	if err != nil {
		return mysql.DBConnection{}, fmt.Errorf("failed to read config: %v", err)
	}

	host := serverConfig.DBHost
	port := serverConfig.DBPort
	user := serverConfig.DBUser
	pass := serverConfig.DBPass

	// Allow empty password for local development (common with homebrew MySQL)
	if host == "" || user == "" {
		return mysql.DBConnection{}, fmt.Errorf("database connection details are not set (host=%s, user=%s)", host, user)
	}

	return mysql.DBConnection{
		Host:     host,
		Port:     port,
		User:     user,
		Password: pass,
		Params:   "parseTime=true",
		DBName:   "eqgo",
	}, nil
}

func main() {
	dbConn, err := getConnection()
	if err != nil {
		log.Fatalf("failed to get connection details: %v", err)
	}

	err = mysql.Generate("./internal/db/jetgen", dbConn)
	if err != nil {
		log.Fatalf("failed to generate Jet bindings: %v", err)
	}

	log.Println("Jet bindings generated successfully in ./internal/db/jetgen")
}
