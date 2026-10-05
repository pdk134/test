package main

import (
	"log"
	"net/http"
)

func main() {
	store := NewStore("data/checkins.json")
	h := NewHandler(store)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/malls", h.handleListMalls)
	mux.HandleFunc("POST /api/checkin", h.handleCheckin)
	mux.HandleFunc("GET /api/checkins", h.handleListCheckins)

	addr := ":8080"
	log.Printf("商场打卡后端已启动: http://localhost%s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
