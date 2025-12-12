package main

import (
	"fmt"

	"idlequest/internal/cert"
	"idlequest/internal/config"
)

func main() {
	// Test config loading
	serverConfig, err := config.Get()
	if err != nil {
		fmt.Printf("Config error: %v\n", err)
		return
	}
	fmt.Printf("Config loaded - local: %v\n", serverConfig.Local)

	// Test embedded certificate loading
	tlsConf, err := cert.LoadTLSConfig()
	if err != nil {
		fmt.Printf("TLS config error: %v\n", err)
		return
	}

	fmt.Printf("TLS config loaded successfully\n")
	fmt.Printf("Number of certificates: %d\n", len(tlsConf.Certificates))
	if len(tlsConf.Certificates) > 0 {
		cert := tlsConf.Certificates[0]
		fmt.Printf("Certificate subject: %s\n", cert.Leaf.Subject)
		fmt.Printf("Certificate SAN: %v\n", cert.Leaf.DNSNames)
	}
}





