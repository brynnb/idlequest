package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"idlequest/internal/config"
	"idlequest/internal/db"
	items "idlequest/internal/db/items"
	"idlequest/internal/server"

	_ "github.com/go-sql-driver/mysql" // Import MySQL driver
)

// Build timestamp - set at compile time via ldflags
var BuildTime = "unknown"

func getConnectionString() (string, error) {
	serverConfig, err := config.Get()
	if err != nil {
		return "", fmt.Errorf("failed to read config: %v", err)
	}
	host := serverConfig.DBHost
	port := serverConfig.DBPort
	user := serverConfig.DBUser
	pass := serverConfig.DBPass
	dbName := serverConfig.DBName

	if host == "" || user == "" || dbName == "" {
		return "", fmt.Errorf("database connection string is not set")
	}
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true", user, pass, host, port, dbName), nil

}

func main() {
	log.Printf("=== IdleQuest Server Starting ===")
	log.Printf("Binary built at: %s", BuildTime)

	dsn, err := getConnectionString()
	if err != nil {
		log.Fatalf("failed to read connection string: %v", err)
	}
	if err := db.InitWorldDB(dsn); err != nil {
		log.Fatalf("failed to initialize db.WorldDB: %v", err)
	}

	_, err = items.InitializeItemsMMF()
	if err != nil {
		log.Fatalf("failed to initialize items: %v", err)
	}

	serverConfig, err := config.Get()
	if err != nil {
		log.Fatalf("failed to read config: %v", err)
	}

	srv, err := server.NewServer(dsn, time.Duration(serverConfig.GracePeriod), serverConfig.Local)
	if err != nil {
		log.Fatalf("failed to create server: %v", err)
	}

	// _, err = nav.GetNavigation()

	// if err != nil {
	// 	log.Fatalf("Failed to create navigation %v", err)
	// }

	go srv.StartServer()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan
	log.Println("Received shutdown signal, shutting down...")

	srv.StopServer()
}
