package main

import (
	"fmt"

	"idlequest/internal/config"
)

func main() {
	cert, err := config.GetCert()
	if err != nil {
		fmt.Printf("Error loading embedded certificate: %v\n", err)
	} else {
		fmt.Printf("Certificate loaded successfully: %d bytes\n", len(cert))
		fmt.Printf("First 100 chars: %s...\n", cert[:100])
	}
}





