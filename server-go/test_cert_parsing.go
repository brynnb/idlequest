package main

import (
	"encoding/pem"
	"fmt"

	"idlequest/internal/config"
)

func main() {
	// Get the embedded certificate data
	certData, err := config.GetCert()
	if err != nil {
		fmt.Printf("Error getting embedded cert: %v\n", err)
		return
	}

	fmt.Printf("Embedded cert data length: %d bytes\n", len(certData))
	fmt.Printf("First 200 chars: %s...\n", certData[:200])

	// Parse PEM blocks
	var certCount int
	rest := []byte(certData)
	for {
		block, next := pem.Decode(rest)
		if block == nil {
			if len(rest) > 0 {
				fmt.Printf("Invalid PEM block, remaining data: %s\n", string(rest))
			}
			break
		}
		fmt.Printf("Found PEM block: %s\n", block.Type)
		if block.Type == "CERTIFICATE" {
			certCount++
		}
		rest = next
	}

	fmt.Printf("Total certificate blocks found: %d\n", certCount)
}





