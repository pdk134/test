package main

import (
	"encoding/json"
	"net/http"
	"sort"
	"strconv"
	"time"
)

// Handler 封装 HTTP 处理器
type Handler struct {
	store *Store
}

func NewHandler(store *Store) *Handler {
	return &Handler{store: store}
}

// mallWithDistance 商场 + 与用户位置的距离
type mallWithDistance struct {
	Mall
	DistanceM  float64 `json:"distance_m"`
	DistanceKM float64 `json:"distance_km"`
}

// handleListMalls GET /api/malls?lat=&lng=
// 可选传 lat/lng，返回每个商场与用户位置的距离，并按距离排序
func (h *Handler) handleListMalls(w http.ResponseWriter, r *http.Request) {
	lat, err1 := strconv.ParseFloat(r.URL.Query().Get("lat"), 64)
	lng, err2 := strconv.ParseFloat(r.URL.Query().Get("lng"), 64)
	hasLoc := err1 == nil && err2 == nil

	malls := h.store.Malls()
	out := make([]mallWithDistance, 0, len(malls))
	for _, m := range malls {
		item := mallWithDistance{Mall: m}
		if hasLoc {
			item.DistanceM = haversine(lat, lng, m.Lat, m.Lng)
			item.DistanceKM = item.DistanceM / 1000
		}
		out = append(out, item)
	}
	if hasLoc {
		sort.Slice(out, func(i, j int) bool {
			return out[i].DistanceM < out[j].DistanceM
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"malls": out})
}

type checkinRequest struct {
	MallID int     `json:"mall_id"`
	Lat    float64 `json:"lat"`
	Lng    float64 `json:"lng"`
}

// handleCheckin POST /api/checkin
// 请求体：{"mall_id": 1, "lat": 39.9, "lng": 116.4}
func (h *Handler) handleCheckin(w http.ResponseWriter, r *http.Request) {
	var req checkinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "请求体格式错误"})
		return
	}
	mall, ok := h.store.GetMall(req.MallID)
	if !ok {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "商场不存在"})
		return
	}
	if req.Lat < -90 || req.Lat > 90 || req.Lng < -180 || req.Lng > 180 {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "坐标非法"})
		return
	}

	dist := haversine(req.Lat, req.Lng, mall.Lat, mall.Lng)
	c := Checkin{
		MallID:      mall.ID,
		MallName:    mall.Name,
		MallAddress: mall.Address,
		UserLat:     req.Lat,
		UserLng:     req.Lng,
		DistanceM:   dist,
		Time:        time.Now(),
	}
	if err := h.store.AddCheckin(&c); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "保存失败: " + err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"checkin": c,
		"message": "打卡成功",
	})
}

// handleListCheckins GET /api/checkins
func (h *Handler) handleListCheckins(w http.ResponseWriter, r *http.Request) {
	cs := h.store.Checkins()
	// 倒序：最新的在前
	for i, j := 0, len(cs)-1; i < j; i, j = i+1, j-1 {
		cs[i], cs[j] = cs[j], cs[i]
	}
	writeJSON(w, http.StatusOK, map[string]any{"checkins": cs})
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}
