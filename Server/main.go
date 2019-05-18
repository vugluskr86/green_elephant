// GreenElephant project main.go
package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-redis/redis"
	log "github.com/sirupsen/logrus"
)

func main() {
	// Log
	log.SetLevel(log.TraceLevel)

	// Redis
	redis := redis.NewClient(&redis.Options{
		Addr:     "127.0.0.1:6379",
		Password: "",
		DB:       1})

	server := NewServer(8080, redis)

	server.Start()

	// Main loop
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	<-stop

	server.Stop()

	// Just wait for goroutins ??? TODO
	time.Sleep(time.Second)

}
