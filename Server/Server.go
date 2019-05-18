package main

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-redis/redis"
	"github.com/gorilla/mux"
	log "github.com/sirupsen/logrus"
)

// Server
type Server struct {
	//dictionary Dictionary
	redis  *redis.Client
	server *http.Server
	router *mux.Router

	stop chan int
}

// Create new server
func NewServer(port int, redis *redis.Client) *Server {
	router := mux.NewRouter()

	server := &Server{
		redis:  redis,
		router: router,
		server: &http.Server{
			Addr:    ":" + strconv.Itoa(port),
			Handler: router},
		stop: make(chan int),
	}

	router.HandleFunc("/games/{game}/points", server.handleGetPoints()).Methods(http.MethodGet).Queries("x", "{x}", "y", "{y}", "radius", "{radius}")
	router.HandleFunc("/games/{game}/points", server.handleAddPoint()).Methods(http.MethodPost)
	router.HandleFunc("/games/{game}/points/{point}", server.handleDeletePoint()).Methods(http.MethodDelete)
	return server
}

// Start server listening
func (server *Server) Start() {
	go func() {
		if err := server.server.ListenAndServe(); err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe(): %s", err)
		}
	}()

	log.Info("Server started")
}

// Stop server
func (server *Server) Stop() {
	close(server.stop)

	if err := server.server.Shutdown(nil); err != nil {
		log.WithField("method", "Stop").WithError(err).Error("HTTP server shutdown error")
	}
}

// HTTP handler	/games/{game}/points
// method POST
// add new map point
func (server *Server) handleAddPoint() http.HandlerFunc {
	return func(resp http.ResponseWriter, req *http.Request) {
		logger := log.WithFields(log.Fields{"method": "handleAddPoint"})

		vars := mux.Vars(req)

		point := struct {
			Name string
			X    float64
			Y    float64
		}{}

		// Decode JSON
		decoder := json.NewDecoder(req.Body)
		if err := decoder.Decode(&point); err != nil {
			logger.WithError(err).Error("JSON decode error")
			http.Error(resp, err.Error(), http.StatusInternalServerError)
			return
		}

		logger.WithField("point", point).Trace()

		// Add geolocation
		if err := server.redis.GeoAdd(vars["game"], &redis.GeoLocation{Name: point.Name, Longitude: point.X, Latitude: point.Y}).Err(); err != nil {
			logger.WithError(err).Trace("GeoAdd error")
			http.Error(resp, err.Error(), http.StatusInternalServerError)
			return
		}

		resp.WriteHeader(http.StatusCreated)
	}
}

// HTTP handler games/{game}/points/{point}
// method DELETE
// delete point from game
func (server *Server) handleDeletePoint() http.HandlerFunc {
	return func(resp http.ResponseWriter, req *http.Request) {
		logger := log.WithFields(log.Fields{"method": "handleDeletePoint"})

		vars := mux.Vars(req)

		logger.WithField("point", vars["point"]).Trace()

		// Delete geolocation
		if err := server.redis.ZRem(vars["game"], vars["point"]).Err(); err != nil {
			logger.WithError(err).Trace("ZREM error")
			http.Error(resp, err.Error(), http.StatusInternalServerError)
			return
		}

		resp.WriteHeader(http.StatusNoContent)
	}
}

// HTTP handler	/games/{game}/points
// method GET
// get all points in radius
func (server *Server) handleGetPoints() http.HandlerFunc {
	return func(resp http.ResponseWriter, req *http.Request) {
		logger := log.WithFields(log.Fields{"method": "handleGetPoints"})

		vars := mux.Vars(req)

		// Values
		values := req.URL.Query()
		x, _ := strconv.ParseFloat(values.Get("x"), 64)
		y, _ := strconv.ParseFloat(values.Get("y"), 64)
		radius, _ := strconv.ParseFloat(values.Get("radius"), 64)

		logger.WithField("data", values).Trace()

		// Get points in radius
		points, err := server.redis.GeoRadius(vars["game"], x, y, &redis.GeoRadiusQuery{Radius: radius, Unit: "m", WithCoord: true, WithDist: true}).Result()
		if err != nil {
			logger.WithError(err).Trace("GeoRadius error")
			http.Error(resp, err.Error(), http.StatusInternalServerError)
			return
		}

		// Encode points
		resp.Header().Set("Content-Type", "application/json")
		json.NewEncoder(resp).Encode(points)

	}
}
